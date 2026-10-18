import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN;

    if (!token) {
        return NextResponse.json(
            { error: "TMDB_READ_ACCESS_TOKEN belum diatur di .env.local." },
            { status: 500 }
        );
    }

    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.trim();

    if (!title) {
        return NextResponse.json(
            { error: "Masukkan judul film terlebih dahulu." },
            { status: 400 }
        );
    }

    try {
        const url = new URL("https://api.themoviedb.org/3/search/movie");
        url.searchParams.set("query", title);
        url.searchParams.set("include_adult", "false");
        url.searchParams.set("language", "en-US");

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                accept: "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            console.error("TMDB search failed:", response.status);

            return NextResponse.json(
                { error: "Gagal mencari poster film dari TMDB." },
                { status: 502 }
            );
        }

        const data = await response.json();

        const results = (data.results || [])
            .slice(0, 8)
            .map((movie) => ({
                id: movie.id,
                title: movie.title,
                release_year: movie.release_date
                    ? Number(movie.release_date.slice(0, 4)) || null
                    : null,
                poster_url: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : null
            }));

        return NextResponse.json(results);
    } catch (error) {
        console.error("GET /api/poster failed:", error);

        return NextResponse.json(
            { error: "Tidak bisa terhubung ke layanan pencarian poster." },
            { status: 500 }
        );
    }
}
