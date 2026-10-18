import "./globals.css";

export const metadata = {
  title: "Movie Diary — Your personal film journal",
  description: "A personal diary to track movies, ratings, and reviews."
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
