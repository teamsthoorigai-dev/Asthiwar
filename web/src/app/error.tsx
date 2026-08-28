'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root application error:', error);
  }, [error]);

  return (
    <div className="system-page">
      <div className="system-page__linework" aria-hidden="true" />
      <div>
        <p className="eyebrow eyebrow--light">Loading error / recoverable</p>
        <h1>This page did not resolve.</h1>
        <p>
          Try loading the current route again. If the problem remains, return to the project
          archive.
        </p>
        <div className="system-page__actions">
          <button
            type="button"
            onClick={() => reset()}
            className="button button--primary"
          >
            Reload this page
          </button>
          <Link href="/projects" className="text-link text-link--light">
            View projects
          </Link>
        </div>
      </div>
    </div>
  );
}
