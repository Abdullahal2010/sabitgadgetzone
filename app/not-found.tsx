import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="rounded-xl2 border border-dashed border-border bg-white p-10 text-center">
      <p className="text-3xl">🔎</p>
      <h1 className="mt-2 text-lg font-extrabold text-navy">Page not found</h1>
      <p className="mt-1 text-muted">The page you're looking for doesn't exist.</p>
      <Link href="/" className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 font-semibold text-white">
        Back to shop
      </Link>
    </div>
  );
}
