import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-base text-muted-foreground">Page not found</p>
      <Link href="/" className="text-sm font-semibold text-primary">
        Go home
      </Link>
    </main>
  );
}
