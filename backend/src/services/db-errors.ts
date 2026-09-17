import { DrizzleQueryError } from '@asthiwar/database';

/** The fields node-postgres puts on a server error. */
export interface PostgresError extends Error {
  code?: string;
  severity?: string;
  constraint?: string;
  detail?: string;
}

/**
 * The Postgres error behind a failed query, or null if there is none.
 *
 * From drizzle-orm 0.44, a driver error arrives wrapped in DrizzleQueryError,
 * with the original on `cause`. Code that read `error.code` off the thrown value
 * — the quotation-number retry, the error handler's bad-input check — silently
 * stopped matching after the upgrade.
 */
export function postgresErrorOf(error: unknown): PostgresError | null {
  const candidate = error instanceof DrizzleQueryError ? error.cause : error;
  if (!candidate || typeof candidate !== 'object') return null;
  const pgError = candidate as PostgresError;
  return typeof pgError.code === 'string' && typeof pgError.severity === 'string' ? pgError : null;
}

/**
 * A failed query described without its bound parameters.
 *
 * DrizzleQueryError's own message is `Failed query: <sql>\nparams: <values>`, and
 * the values are whatever was being written — customer names, phone numbers,
 * emails. That message must not reach audit_logs (readable by every admin role)
 * or the server log. The SQL text is kept; it names tables and columns only.
 */
export function describeQueryFailure(error: unknown): string | null {
  if (!(error instanceof DrizzleQueryError)) return null;
  const cause = error.cause instanceof Error ? error.cause.message : 'unknown driver error';
  return `${cause} (query: ${error.query})`;
}

/** A stack trace for a failed query that does not start with its parameters. */
export function safeStackOf(error: unknown): string | undefined {
  if (error instanceof DrizzleQueryError) {
    const cause = error.cause instanceof Error ? error.cause.stack : undefined;
    return `${describeQueryFailure(error)}\n${cause ?? ''}`.trim();
  }
  return error instanceof Error ? error.stack : undefined;
}

/** What to hand console.error: the error itself, unless it would print query parameters. */
export function loggableError(error: unknown): unknown {
  return error instanceof DrizzleQueryError ? safeStackOf(error) : error;
}
