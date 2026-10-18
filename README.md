# 🎬 Cinémemo

### *Some stories stay with us.*

A personal movie diary to keep track of the films you watch, the stories you love, and the feelings they leave behind.

Cinémemo is a movie collection web app built for people who see cinema as more than just entertainment. Save your watched films, organize your watchlist, rate movies, and write personal reviews in one place.

> Every film leaves something behind. This is where you keep it.

---

## ✦ Preview

<!-- Replace these placeholders with screenshots of your actual application -->

| Home & Collection | Movie Details |
|:---:|:---:|
| *Add your homepage screenshot here* | *Add your movie details screenshot here* |

---

## 🍿 Features

- **Personal Movie Archive** — Keep your movies organized in one collection.
- **Movie Status Tracking** — Separate films into `Watched`, `Watching`, and `Watchlist`.
- **Movie Ratings** — Give each film your own rating.
- **Personal Reviews** — Write down your thoughts, opinions, and favorite moments.
- **Movie Posters** — Search for movie posters using the TMDB API.
- **Search & Filter** — Find movies and filter your collection by status.
- **Movie Management** — Add, view, edit, and delete movie entries.
- **Responsive Design** — A dark, minimal interface designed for desktop and mobile screens.
- **Movie Statistics** — Get an overview of your personal movie collection.

---

## 🎞️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| JavaScript | Application logic |
| CSS | Custom styling and responsive layouts |
| MySQL | Persistent movie data storage |
| Aiven | Hosted MySQL database |
| TMDB API | Movie poster search and image data |
| Vercel | Application deployment |
| Git & GitHub | Version control and source code hosting |

---

## 🖤 Design Philosophy

Cinémemo uses a dark editorial aesthetic inspired by the atmosphere of independent cinema and personal film journals.

- **Black & charcoal** for a calm viewing experience.
- **Muted red** for subtle accents.
- **Serif typography** for a cinematic editorial feel.
- **Separated movie cards** to keep the collection organized.
- **Responsive layouts** to make the experience comfortable across devices.

The goal is simple: make a movie diary that feels personal, not like another generic movie database.

---

## ⚙️ Getting Started

### Requirements

- Node.js
- npm
- A MySQL database
- A TMDB API access token

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

Replace the placeholders with your actual GitHub repository URL and project folder name.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
DB_HOST=your_database_host
DB_PORT=your_database_port
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
TMDB_READ_ACCESS_TOKEN=your_tmdb_access_token
```

Use the variable names expected by your existing `lib/db.js` and poster API implementation. If your project uses different database variable names, keep those names unchanged.

**Important:** Never commit `.env.local` or publish your database credentials and API tokens.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database

Cinémemo stores movie entries in a MySQL database.

Each movie can contain:

| Field | Description |
|---|---|
| `id` | Unique movie identifier |
| `title` | Movie title |
| `release_year` | Year of release |
| `genre` | Movie genre |
| `rating` | Personal rating |
| `status` | Watched, Watching, or Watchlist |
| `review` | Personal movie review |
| `poster_url` | Movie poster URL |
| `created_at` | Record creation timestamp |
| `updated_at` | Last update timestamp |

The database keeps movie entries persistent, so the collection is not limited to temporary browser data.

---

## 🔌 API Routes

The application uses Next.js API routes to manage movie data.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/movies` | Retrieve the movie collection |
| `POST` | `/api/movies` | Add a movie |
| `GET` | `/api/movies/:id` | Retrieve a movie by ID |
| `PUT` | `/api/movies/:id` | Update a movie |
| `DELETE` | `/api/movies/:id` | Delete a movie |
| `GET` | `/api/poster` | Search for movie posters |

The exact behavior and supported parameters depend on the implementation of each route.

---

## 🌐 Deployment

Cinémemo is designed to run with the following setup:

- **Frontend & API:** Vercel
- **Database:** Aiven MySQL
- **Movie poster data:** TMDB API
- **Source code:** GitHub

Production environment variables must be configured in the Vercel project settings. The Aiven database must also allow the deployed application to connect securely.

---

## 🎥 Why Cinémemo?

Movies are not just titles on a screen. Some change how we see the world, some stay in our minds for years, and some become memories of a certain time in our lives.

Cinémemo was created as a place to collect those experiences, one film at a time.

**Watch a film. Keep a memory.**

---

## 📌 Credits

- Movie data and poster imagery powered by [The Movie Database (TMDB)](https://www.themoviedb.org/).
- Built with [Next.js](https://nextjs.org/), [MySQL](https://www.mysql.com/), and [Vercel](https://vercel.com/).

This product uses the TMDB API but is not endorsed or certified by TMDB.

---

<p align="center">
  <i>Made with curiosity and a love for cinema.</i>
  <br />
  <b>CINÉMEMO © 2026</b>
</p>