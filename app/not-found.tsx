import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <h1 className="text-6xl font-bold mb-4 text-ink">404</h1>
      <h2 className="text-2xl font-semibold mb-4 text-ink">
        Page Not Found
      </h2>
      <p className="text-ink-muted mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-accent text-ink-inverse rounded-md hover:bg-accent-hover transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}

