-- Run in SQL Editor as postgres after the migration. All fixtures roll back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users limit 1),true);
insert into public.generations(id,user_id,prompt,system_prompt,caption,model)
values ('00000000-0000-4000-8000-000000000004',auth.uid(),'RLS transaction test','test','Temporary test caption','test');
set local role authenticated;
insert into public.votes(generation_id,user_id,value)
values('00000000-0000-4000-8000-000000000004',auth.uid(),1);
update public.votes set value=-1 where generation_id='00000000-0000-4000-8000-000000000004' and user_id=auth.uid();
do $$ begin
 if (select count(*) from public.votes where generation_id='00000000-0000-4000-8000-000000000004' and value=-1) <> 1 then raise exception 'Own vote failed'; end if;
 begin insert into public.votes(generation_id,user_id,value) values('00000000-0000-4000-8000-000000000004',auth.uid(),1); raise exception 'Duplicate allowed'; exception when unique_violation then null; end;
 begin insert into public.votes(generation_id,user_id,value) values('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000099',1); raise exception 'Forged owner allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.generations(user_id,prompt,system_prompt,caption,model) values(auth.uid(),'forged prompt','test','fake','test'); raise exception 'Forged generation allowed'; exception when insufficient_privilege then null; end;
 begin perform * from public.generation_attempts; raise exception 'Quota table exposed'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
do $$ begin
 if exists(select 1 from public.votes where generation_id='00000000-0000-4000-8000-000000000004') then raise exception 'Other user vote visible'; end if;
 if exists(select 1 from public.profiles) then raise exception 'Other profile visible'; end if;
 update public.votes set value=1 where generation_id='00000000-0000-4000-8000-000000000004';
 if found then raise exception 'Other vote updated'; end if;
end $$;
set local role anon;
do $$ begin
 perform id,caption from public.generations;
 begin insert into public.votes(generation_id,value) values('00000000-0000-4000-8000-000000000004',1); raise exception 'Anonymous vote allowed'; exception when insufficient_privilege then null; end;
 begin perform user_id from public.generations; raise exception 'Creator identifier exposed'; exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: own insert/update, duplicate block, forged-owner block, cross-user isolation, anonymous write block, server-only generation and quotas' as test_result;
