import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
      <p style={{ color: '#a3a3a3' }}>Page not found</p>
      <Link href="/" style={{ color: '#3b82f6' }}>
        Go home
      </Link>
    </main>
  );
}
