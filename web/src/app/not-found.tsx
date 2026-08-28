import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="system-page">
      <div className="system-page__linework" aria-hidden="true" />
      <div>
        <p className="eyebrow eyebrow--light">404 / Outside the drawing set</p>
        <h1>There is no page at this coordinate.</h1>
        <p>
          The address may have changed. Return to the project archive or begin again at the site.
        </p>
        <div className="system-page__actions">
          <Link href="/" className="button button--primary">
            Return home
          </Link>
          <Link href="/projects" className="text-link text-link--light">
            View projects
          </Link>
        </div>
      </div>
    </div>
  );
}
