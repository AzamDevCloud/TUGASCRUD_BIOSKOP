import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

export async function PATCH(request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "ID film tidak valid." }, { status: 400 });
    }
    const body = await request.json();
    const checked = validateMovie(body);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });

    const movie = checked.value;
    const [result] = await query(
      `UPDATE movies
       SET title = ?, release_year = ?, genre = ?, rating = ?, status = ?, review = ?, poster_url = ?
       WHERE id = ?`,
      [movie.title, movie.release_year, movie.genre, movie.rating, movie.status, movie.review, movie.poster_url, id]
    );
    if (result.affectedRows === 0) {
      const [existing] = await query("SELECT id FROM movies WHERE id = ?", [id]);
      if (!existing.length) return NextResponse.json({ error: "Film tidak ditemukan." }, { status: 404 });
    }
    const [rows] = await query("SELECT * FROM movies WHERE id = ?", [id]);
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("PATCH /api/movies/[id] failed:", error);
    return NextResponse.json({ error: "Gagal mengubah data film." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "ID film tidak valid." }, { status: 400 });
    }
    const [result] = await query("DELETE FROM movies WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Film tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/movies/[id] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus film." }, { status: 500 });
  }
}
