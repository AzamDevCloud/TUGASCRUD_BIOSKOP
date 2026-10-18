import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const required = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const caPath = path.join(process.cwd(), "certs", "ca.pem");

if (!fs.existsSync(caPath)) {
  throw new Error("File certs/ca.pem tidak ditemukan.");
}

const ca = fs.readFileSync(caPath, "utf8");

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 60000,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: {
    ca,
    rejectUnauthorized: true
  }
};

const globalForMysql = globalThis;
const pool =
  globalForMysql.movieDiaryPool ?? mysql.createPool(config);

if (process.env.NODE_ENV !== "production") {
  globalForMysql.movieDiaryPool = pool;
}

let tableReady;

export async function ensureMoviesTable() {
  if (!tableReady) {
    tableReady = pool.execute(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        release_year SMALLINT UNSIGNED NULL,
        genre VARCHAR(100) NOT NULL DEFAULT '',
        rating DECIMAL(2,1) NOT NULL DEFAULT 0.0,
        status ENUM('Watched', 'Watching', 'Watchlist')
          NOT NULL DEFAULT 'Watched',
        review TEXT NULL,
        poster_url VARCHAR(2048) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_movies_title (title),
        INDEX idx_movies_status (status)
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_unicode_ci
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }

  await tableReady;
}

export async function query(sql, values = []) {
  await ensureMoviesTable();
  return pool.execute(sql, values);
}

export default pool;
