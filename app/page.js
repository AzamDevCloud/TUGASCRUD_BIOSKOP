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

const STATUS_LABELS = {
  All: "Semua",
  Watched: "Sudah ditonton",
  Watching: "Sedang ditonton",
  Watchlist: "Daftar tontonan"
};

function Bolt() {
  return (
    <svg
      className="bolt-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path d="M13.5 2 4 13.5h6.2L9 22l10-12.5h-6.4L13.5 2Z" fill="currentColor" />
    </svg>
  );
}

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
          : "Film berhasil ditambahkan ke Moviezam."
      );

      await loadMovies();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMovie(movie) {
    if (!window.confirm(`Hapus "${movie.title}" dari Moviezam?`)) {
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
        <a className="brand" href="#top" aria-label="Beranda Moviezam">
          <span className="brand-mark"><Bolt /></span>
          <span className="brand-name">
            <span className="brand-light">movie</span>zam
          </span>
        </a>

        <nav className="top-navigation">
          <a className="top-link" href="#movie-form">Tambah film</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            <span className="live-dot" />
            Jurnal film pribadi
          </p>

          <h1>
            Setiap film punya
            <br />
            momen yang layak
            <br />
            disimpan.
          </h1>

          <p className="hero-copy">
            Catat film yang sudah kamu tonton, beri rating, dan tulis kesan
            yang tertinggal setelah kreditnya habis.
          </p>

          <a className="primary-link" href="#movie-form">
            Catat film pertama
          </a>
        </div>

        <div className="hero-art" aria-hidden="true">
          <span className="floating-star" />

          <div className="film-ticket">
            <span>Tiket masuk jurnal</span>
            <strong>
              movie
              <br />
              <i>zam!</i>
            </strong>
            <div className="ticket-divider" />
            <small>Tonton, catat, simpan.</small>
          </div>
        </div>
      </section>

      <section className="stats" aria-label="Statistik jurnal film">
        <div>
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">film tersimpan</span>
        </div>
        <div>
          <span className="stat-number">{stats.watched}</span>
          <span className="stat-label">sudah ditonton</span>
        </div>
        <div>
          <span className="stat-number">{stats.watchlist}</span>
          <span className="stat-label">antre ditonton</span>
        </div>
      </section>

      <section className="form-section" id="movie-form">
        <div className="section-heading">
          <div>
            <h2>{editingId ? "Edit catatan film" : "Tambah film baru"}</h2>
            <p>Judul dan genre wajib diisi, sisanya boleh menyusul.</p>
          </div>
        </div>

        <form className="movie-form" onSubmit={submitMovie}>
          <div className="field field-wide">
            <label className="field-label" htmlFor="movie-title">
              Judul film <span>*</span>
            </label>

            <div className="poster-search-row">
              <input
                id="movie-title"
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Contoh: Parasite"
                maxLength={255}
                required
              />

              <button
                className="button-quiet"
                type="button"
                onClick={searchPoster}
                disabled={searchingPoster}
              >
                {searchingPoster ? "Mencari..." : "Cari poster"}
              </button>
            </div>

            <p className="field-hint">
              Ketik judulnya, lalu cari poster dan tahun rilisnya otomatis.
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
                      <span className="poster-result-empty">Tanpa poster</span>
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
                  <p className="poster-preview-label">Poster terpilih</p>
                  <p className="poster-preview-copy">
                    Poster ini akan tampil di koleksi filmmu.
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
                    Hapus poster
                  </button>
                </div>
              </div>
            )}
          </div>

          <label className="field">
            Tahun rilis
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
              <option value="">Pilih genre</option>
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Rating kamu
            <select name="rating" value={form.rating} onChange={updateField}>
              {Array.from({ length: 11 }, (_, index) => (
                <option key={index} value={(index / 2).toFixed(1)}>
                  {(index / 2).toFixed(1)} / 5
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Status tontonan
            <select name="status" value={form.status} onChange={updateField}>
              <option value="Watched">Sudah ditonton</option>
              <option value="Watching">Sedang ditonton</option>
              <option value="Watchlist">Daftar tontonan</option>
            </select>
          </label>

          <label className="field field-wide">
            Ulasan pribadi
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
                  ? "Simpan perubahan"
                  : "Tambahkan ke Moviezam"}
            </button>

            {editingId && (
              <button
                className="button-quiet"
                type="button"
                onClick={resetForm}
              >
                Batal mengedit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="collection-section" id="collection">
        <div className="section-heading">
          <div>
            <h2>Koleksi filmmu</h2>
          </div>

          <span className="section-index">
            {filteredMovies.length} film
          </span>
        </div>

        <div className="collection-tools">
          <label className="search-box">
            <span>Cari film</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Judul, genre, atau tahun"
              aria-label="Cari film"
            />
          </label>

          <div className="filter-tabs" aria-label="Filter berdasarkan status">
            {STATUSES.map((status) => (
              <button
                key={status}
                className={filter === status ? "filter-tab active" : "filter-tab"}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                type="button"
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="message message-error" role="alert">
            {error}
            <button type="button" onClick={loadMovies}>Coba lagi</button>
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
            <span className="empty-icon" aria-hidden="true">⚡</span>
            <h3>{movies.length ? "Film tidak ditemukan" : "Belum ada film di sini"}</h3>
            <p>
              {movies.length
                ? "Coba kata kunci atau filter status lainnya."
                : "Tambahkan film pertamamu untuk mulai membangun koleksi."}
            </p>
            {!movies.length && (
              <a className="primary-link" href="#movie-form">
                Tambah film pertama
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
                    <span aria-hidden="true">⚡</span>
                    <b>{movie.title}</b>
                    <small>{movie.release_year || "Belum ada poster"}</small>
                  </div>

                  <span
                    className={`status-chip ${(movie.status || "Watched").toLowerCase()}`}
                  >
                    {STATUS_LABELS[movie.status] || STATUS_LABELS.Watched}
                  </span>
                </div>

                <div className="movie-info">
                  <div className="movie-title-row">
                    <h3>{movie.title}</h3>
                    <Stars rating={movie.rating} />
                  </div>

                  <p className="movie-meta">
                    <span>{movie.release_year || "Tahun tidak diketahui"}</span>
                    {movie.genre && <span className="genre-pill">{movie.genre}</span>}
                  </p>

                  {movie.review && (
                    <p className="movie-review">{movie.review}</p>
                  )}

                  <div className="card-actions">
                    <button type="button" onClick={() => startEdit(movie)}>
                      Edit catatan
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
        <a className="brand footer-brand" href="#top" aria-label="Kembali ke atas">
          <span className="brand-mark"><Bolt /></span>
          <span className="brand-name">
            <span className="brand-light">movie</span>zam
          </span>
        </a>

        <p>Dibuat untuk pecinta film. Ceritamu tersimpan di sini.</p>
        <a href="#top">Kembali ke atas</a>
      </footer>
    </main>
  );
}