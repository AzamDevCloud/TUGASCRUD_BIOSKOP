import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateMovie(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const genre = typeof body.genre === "string" ? body.genre.trim() : "";
  const review = typeof body.review === "string" ? body.review.trim() : "";
  const posterUrl = typeof body.poster_url === "string" ? body.poster_url.trim() : "";
  const status = body.status;
  const year = body.release_year === "" || body.release_year == null
    ? null : Number(body.release_year);
  const rating = Number(body.rating);

  if (!title) return { error: "Judul film wajib diisi." };
  if (title.length > 255) return { error: "Judul maksimal 255 karakter." };
  if (genre.length > 100) return { error: "Genre maksimal 100 karakter." };
  if (year !== null && (!Number.isInteger(year) || year < 1888 || year > 2200)) {
    return { error: "Tahun rilis harus antara 1888 dan 2200." };
  }
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
    return { error: "Rating harus antara 0 sampai 5." };
  }
  if (!["Watched", "Watching", "Watchlist"].includes(status)) {
    return { error: "Status tontonan tidak valid." };
  }
  if (posterUrl && (posterUrl.length > 2048 || !/^https?:\/\//i.test(posterUrl))) {
    return { error: "URL poster harus diawali http:// atau https://." };
  }
  return {
    value: {
      title, genre, review, poster_url: posterUrl || null,
      release_year: year, rating: rating.toFixed(1), status
    }
  };
}

export async function GET() {
  try {
    const [rows] = await query(
      `SELECT id, title, release_year, genre, rating, status, review, poster_url,
              created_at, updated_at
       FROM movies ORDER BY created_at DESC, id DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/movies failed:", error);
    return NextResponse.json({ error: "Gagal mengambil data. Periksa konfigurasi database Aiven." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const checked = validateMovie(body);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

    const movie = checked.value;
    const [result] = await query(
      `INSERT INTO movies (title, release_year, genre, rating, status, review, poster_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [movie.title, movie.release_year, movie.genre, movie.rating, movie.status, movie.review, movie.poster_url]
    );
    const [rows] = await query("SELECT * FROM movies WHERE id = ?", [result.insertId]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/movies failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan film. Periksa koneksi database." }, { status: 500 });
  }
}
