
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
    const apiKey = process.env.OMDB_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: "OMDB_API_KEY belum diatur di file .env." },
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
        const url = new URL("https://www.omdbapi.com/");
        url.searchParams.set("apikey", apiKey);
        url.searchParams.set("s", title);
        url.searchParams.set("type", "movie");

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            console.error("OMDb HTTP error:", response.status);

            return NextResponse.json(
                { error: "Gagal menghubungi OMDb API." },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (data.Response === "False") {
            const status = data.Error === "Invalid API key!" ? 502 : 200;

            return NextResponse.json(
                status === 200
                    ? []
                    : { error: "API Key OMDb tidak valid atau belum aktif." },
                { status }
            );
        }

        const results = (data.Search || []).map((movie) => ({
            id: movie.imdbID,
            title: movie.Title,
            release_year: movie.Year
                ? Number(movie.Year.match(/\d{4}/)?.[0]) || null
                : null,
            poster_url:
                movie.Poster && movie.Poster !== "N/A"
                    ? movie.Poster
                    : null
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error("GET /api/poster failed:", error);

        return NextResponse.json(
            { error: "Tidak bisa terhubung ke layanan OMDb." },
            { status: 500 }
        );
    }
}
