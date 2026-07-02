import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Not found</p>
          <h1>Lesson not found</h1>
          <p className="lede">That lesson may have been deleted.</p>
        </div>
        <Link className="button" href="/">
          Back to dashboard
        </Link>
      </header>
    </main>
  );
}
