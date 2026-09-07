import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 / route not found</p>
      <h1>That page does not exist.</h1>
      <p>The portfolio is still here. Use the link below to return to the main page.</p>
      <Link className="button button-primary" href="/">Back to portfolio</Link>
    </main>
  );
}
