'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="system-page">
          <div className="system-page__linework" aria-hidden="true" />
          <div>
            <p className="eyebrow eyebrow--light">Fatal error / recoverable</p>
            <h1>Application encountered a system fault.</h1>
            <p>Try refreshing the page to restart the session.</p>
            <div className="system-page__actions">
              <button
                type="button"
                onClick={() => reset()}
                className="button button--primary"
              >
                Reload application
              </button>
              <Link href="/" className="text-link text-link--light">
                Return home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
