import { supabase } from "@/lib/supabase";

export default async function Home() {
    const { data: movies, error } = await supabase
        .from("movies")
        .select("*");

    if (error) {
        return <main>Error loading movies: {error.message}</main>;
    }

    return (
        <main style={{ padding: "40px" }}>
            <h1>My Movies</h1>

            <ul>
                {movies?.map((movie) => (
                    <li key={movie.id}>
                        {movie.title} ({movie.year})
                    </li>
                ))}
            </ul>
        </main>
    );
}