import Link from 'next/link';
import { css } from 'styled-system/css';

export default function NotFound() {
  return (
    <main
      className={css({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minH: '100vh',
        gap: 'space.04',
      })}
    >
      <h1 className={css({ textStyle: 'heading.01' })}>404</h1>
      <p className={css({ textStyle: 'body.01', color: 'ink.text-secondary' })}>Page not found</p>
      <Link href="/" className={css({ textStyle: 'label.01', color: 'accent.text' })}>
        Go home
      </Link>
    </main>
  );
}
