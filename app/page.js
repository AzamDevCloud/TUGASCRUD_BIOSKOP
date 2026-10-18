"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  title: "",
  release_year: "",
  genre: "",
  rating: "0",
  status: "Watched",
  review: "",
  poster_url: ""
};

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "History",
  "Horror", "Music", "Mystery", "Romance", "Science Fiction",
  "Thriller", "War", "Western"
];

const STATUSES = ["All", "Watched", "Watching", "Watchlist"];

function Stars({ rating }) {
  return (
    <span className="stars" aria-label={`Rating ${rating} dari 5`}>
      ★ <b>{Number(rating || 0).toFixed(1)}</b>
      <small>/5</small>
    </span>
  );
}

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingPoster, setSearchingPoster] = useState(false);
  const [posterResults, setPosterResults] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [posterError, setPosterError] = useState("");

  const loadMovies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/movies", {
        cache: "no-store"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal memuat daftar film.");
      }

      setMovies(data);
    } catch (err) {
      setError(err.message || "Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, [loadMovies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch = `${movie.title} ${movie.genre} ${movie.release_year || ""
        }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" || movie.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [movies, search, filter]);

  const stats = useMemo(
    () => ({
      total: movies.length,
      watched: movies.filter((movie) => movie.status === "Watched").length,
      watchlist: movies.filter((movie) => movie.status === "Watchlist").length
    }),
    [movies]
  );

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));

    if (name === "title") {
      setPosterResults([]);
      setPosterError("");
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPosterResults([]);
    setPosterError("");
  }

  function startEdit(movie) {
    setEditingId(movie.id);

    setForm({
      title: movie.title || "",
      release_year:
        movie.release_year == null ? "" : String(movie.release_year),
      genre: movie.genre || "",
      rating: String(movie.rating ?? 0),
      status: movie.status || "Watched",
      review: movie.review || "",
      poster_url: movie.poster_url || ""
    });

    setPosterResults([]);
    setPosterError("");
    setNotice("");

    document.getElementById("movie-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function searchPoster() {
    const title = form.title.trim();

    if (!title) {
      setPosterError("Masukkan judul film terlebih dahulu.");
      return;
    }

    setSearchingPoster(true);
    setPosterError("");
    setPosterResults([]);

    try {
      const response = await fetch(
        `/api/poster?title=${encodeURIComponent(title)}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mencari poster.");
      }

      setPosterResults(data);

      if (data.length === 0) {
        setPosterError("Film tidak ditemukan. Coba judul lainnya.");
      }
    } catch (err) {
      setPosterError(err.message || "Gagal mencari poster.");
    } finally {
      setSearchingPoster(false);
    }
  }

  function selectPoster(movie) {
    setForm((current) => ({
      ...current,
      poster_url: movie.poster_url || "",
      release_year: current.release_year || (
        movie.release_year ? String(movie.release_year) : ""
      )
    }));

    setPosterResults([]);
    setPosterError(
      movie.poster_url
        ? `Poster "${movie.title}" berhasil dipilih.`
        : "Film dipilih, tetapi posternya tidak tersedia."
    );
  }

  async function submitMovie(event) {
    event.preventDefault();

    if (!form.genre) {
      setError("Genre wajib dipilih sebelum menyimpan film.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        editingId ? `/api/movies/${editingId}` : "/api/movies",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan film.");
      }

      const wasEditing = editingId !== null;

      resetForm();

      setNotice(
        wasEditing
          ? "Perubahan film berhasil disimpan."
          : "Film berhasil ditambahkan ke Cinémemo."
      );

      await loadMovies();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovie(movie) {
    if (!window.confirm(`Hapus "${movie.title}" dari Cinémemo?`)) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/movies/${movie.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus film.");
      }

      if (editingId === movie.id) {
        resetForm();
      }

      setNotice("Film berhasil dihapus.");
      await loadMovies();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    }
  }

  return (
    <main id="top">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Beranda Cinémemo">
          <span className="brand-mark">C</span>
          <span>inémemo<span className="brand-dot">.</span></span>
        </a>

        <nav className="top-navigation">
          <a className="top-link" href="#movie-form">+ Tambah Film</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            <span className="live-dot" />
            Jurnal Film Pribadi
          </p>

          <h1>
            Beberapa cerita
            <br />
            <em>selalu membekas.</em>
          </h1>

          <p className="hero-copy">
            Sebuah ruang kecil untuk film-film yang telah kamu tonton,
            kesan yang ditinggalkannya, serta cerita-cerita yang ingin kamu simpan.
          </p>

          <a className="primary-link" href="#movie-form">
            Simpan Kenangannya <span aria-hidden="true">↗</span>
          </a>

          <p className="hero-note">
            FILM-MU. PERASAANMU. KENANGANMU.
          </p>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-label">JEJAK DALAM SETIAP ADEGAN</div>

          <div className="film-ticket">
            <span>ARSIP PRIBADI · NO. 001</span>
            <strong>
              CINÉ
              <br />
              <i>MEMO</i>
            </strong>
            <div className="ticket-divider" />
            <small>SETIAP FILM MENINGGALKAN KESAN</small>
          </div>

          <span className="floating-star">✳</span>
          <span className="art-caption">Kumpulan momen yang berarti.</span>
        </div>
      </section>

      <section className="stats" aria-label="Statistik jurnal film">
        <div>
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total Koleksi Film</span>
        </div>
        <div>
          <span className="stat-number">{stats.watched}</span>
          <span className="stat-label">Sudah Ditonton</span>
        </div>
        <div>
          <span className="stat-number">{stats.watchlist}</span>
          <span className="stat-label">Antrean Tontonan</span>
        </div>
      </section>

      <section className="form-section" id="movie-form">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Simpan Kenangan Baru</p>
            <h2>{editingId ? "Edit Catatan Film" : "Tambah Film"}</h2>
          </div>
          <span className="section-index">01 / Jurnal Kamu</span>
        </div>

        <form className="movie-form" onSubmit={submitMovie}>
          <div className="field field-wide">
            <label className="field-label" htmlFor="movie-title">
              Judul Film <span>*</span>
            </label>

            <div className="poster-search-row">
              <input
                id="movie-title"
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Masukkan judul film."
                maxLength={255}
                required
              />

              <button
                className="button-quiet"
                type="button"
                onClick={searchPoster}
                disabled={searchingPoster}
              >
                {searchingPoster ? "Sedang mencari..." : "Cari Poster"}
              </button>
            </div>

            <p className="field-hint">
              Cari film untuk menemukan posternya.
            </p>

            {posterError && (
              <p className="poster-search-message">{posterError}</p>
            )}

            {posterResults.length > 0 && (
              <div className="poster-results">
                {posterResults.map((movie) => (
                  <button
                    type="button"
                    className="poster-result"
                    key={movie.id}
                    onClick={() => selectPoster(movie)}
                  >
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt="" />
                    ) : (
                      <span className="poster-result-empty">Tanpa Poster</span>
                    )}

                    <span>
                      <b>{movie.title}</b>
                      <small>{movie.release_year || "Tahun tidak diketahui"}</small>
                      <small>
                        {form.poster_url === movie.poster_url && movie.poster_url
                          ? "Dipilih"
                          : "Pilih film ini"}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {form.poster_url && (
              <div className="poster-preview">
                <img src={form.poster_url} alt="Poster film yang dipilih" />
                <div>
                  <p className="poster-preview-label">POSTER TERPILIH</p>
                  <p className="poster-preview-copy">
                    Poster ini akan ditampilkan di koleksi film kamu.
                  </p>
                  <button
                    type="button"
                    className="button-quiet"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        poster_url: ""
                      }))
                    }
                  >
                    Hapus Poster
                  </button>
                </div>
              </div>
            )}
          </div>

          <label className="field">
            Tahun Rilis
            <input
              name="release_year"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={form.release_year}
              onChange={updateField}
              placeholder="Opsional"
            />
          </label>

          <label className="field">
            Genre <span>*</span>
            <select
              name="genre"
              value={form.genre}
              onChange={updateField}
              required
            >
              <option value="">Pilih Genre</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Rating Kamu
            <select name="rating" value={form.rating} onChange={updateField}>
              {Array.from({ length: 11 }, (_, index) => (
                <option key={index} value={(index / 2).toFixed(1)}>
                  {(index / 2).toFixed(1)} / 5
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Status Tontonan
            <select name="status" value={form.status} onChange={updateField}>
              <option value="Watched">Sudah Ditonton</option>
              <option value="Watching">Sedang Ditonton</option>
              <option value="Watchlist">Daftar Tontonan</option>
            </select>
          </label>

          <label className="field field-wide">
            Ulasan Pribadi
            <textarea
              name="review"
              value={form.review}
              onChange={updateField}
              rows="3"
              placeholder="Apa yang kamu rasakan setelah film ini berakhir?"
            />
          </label>

          <div className="form-actions">
            <button className="button-primary" type="submit" disabled={saving}>
              {saving
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan ↗"
                  : "Tambahkan ke Cinémemo ↗"}
            </button>

            {editingId && (
              <button
                className="button-quiet"
                type="button"
                onClick={resetForm}
              >
                Batal Mengedit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="collection-section" id="collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ARSIP FILM PRIBADI</p>
            <h2>
              Film &amp; <em>kenangan</em><span className="heading-dot">.</span>
            </h2>
          </div>

          <span className="section-index">
            {filteredMovies.length} FILM
          </span>
        </div>

        <div className="collection-tools">
          <label className="search-box">
            <span>Cari Film</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari film dalam jurnalmu..."
              aria-label="Cari film"
            />
          </label>

          <div className="filter-tabs" aria-label="Filter berdasarkan status">
            {STATUSES.map((status) => {
              const statusLabels = {
                All: "Semua",
                Watched: "Sudah Ditonton",
                Watching: "Sedang Ditonton",
                Watchlist: "Daftar Tontonan"
              };

              return (
                <button
                  key={status}
                  className={filter === status ? "filter-tab active" : "filter-tab"}
                  onClick={() => setFilter(status)}
                  type="button"
                >
                  {statusLabels[status]}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="message message-error" role="alert">
            {error}
            <button type="button" onClick={loadMovies}>Coba Lagi</button>
          </div>
        )}

        {notice && (
          <div className="message message-success" role="status">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <span className="loader" />
            Memuat koleksi film...
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">✳</span>
            <h3>{movies.length ? "Film tidak ditemukan" : "Halaman kosong, untuk saat ini."}</h3>
            <p>
              {movies.length
                ? "Coba kata kunci atau filter status lainnya."
                : "Film pertamamu siap untuk dikenang. Tambahkan satu film untuk memulai."}
            </p>
            {!movies.length && (
              <a className="primary-link" href="#movie-form">
                Tambahkan Film Pertama ↗
              </a>
            )}
          </div>
        ) : (
          <div className="movie-grid">
            {filteredMovies.map((movie) => (
              <article className="movie-card" key={movie.id}>
                <div className="poster-wrap">
                  {movie.poster_url && (
                    <img
                      src={movie.poster_url}
                      alt={`Poster ${movie.title}`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const placeholder = event.currentTarget.nextElementSibling;
                        if (placeholder) placeholder.style.display = "flex";
                      }}
                    />
                  )}

                  <div
                    className="poster-placeholder"
                    style={{ display: movie.poster_url ? "none" : "flex" }}
                  >
                    <span>✳</span>
                    <b>{movie.title}</b>
                    <small>{movie.release_year || "FILM DALAM JURNALMU"}</small>
                  </div>

                  <span
                    className={`status-chip ${(movie.status || "Watched").toLowerCase()}`}
                  >
                    {{
                      Watched: "Sudah Ditonton",
                      Watching: "Sedang Ditonton",
                      Watchlist: "Daftar Tontonan"
                    }[movie.status] || "Sudah Ditonton"}
                  </span>
                </div>

                <div className="movie-info">
                  <div className="movie-title-row">
                    <h3>{movie.title}</h3>
                    <Stars rating={movie.rating} />
                  </div>

                  <p className="movie-meta">
                    {movie.release_year || "Tahun tidak diketahui"}
                    {movie.genre ? ` · ${movie.genre}` : ""}
                  </p>

                  {movie.review && (
                    <p className="movie-review">{movie.review}</p>
                  )}

                  <div className="card-actions">
                    <button type="button" onClick={() => startEdit(movie)}>
                      Edit Catatan
                    </button>
                    <button
                      type="button"
                      className="delete-action"
                      onClick={() => deleteMovie(movie)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>
        <a className="brand footer-brand" href="#top">
          <span className="brand-mark">C</span>
          <span>cinémemo<span className="brand-dot">.</span></span>
        </a>

        <p>DIBUAT UNTUK PECINTA FILM · CERITAMU, TERSIMPAN DI SINI</p>
        <a href="#top">KEMBALI KE ATAS ↑</a>
      </footer>
    </main>
  );
}