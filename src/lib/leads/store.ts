import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { StoredEnquiry, StoredEstimateReport } from './types';

/**
 * Durable lead storage. Server only — importing this from a client component is
 * a build error, because of the `node:` imports above.
 *
 * Append-only JSONL on the local filesystem. This is deliberately the simplest
 * thing that actually persists: a lead written here survives a restart and can
 * be read back by the admin screens, which is the whole point — the previous
 * implementation reported success and kept nothing.
 *
 * Each record is written as one `appendFile` call of a single line, which the OS
 * treats as atomic for writes of this size under O_APPEND. That is sufficient
 * for a site at this volume; swapping in a real database means replacing this
 * file and nothing else.
 *
 * On a read-only or ephemeral filesystem (most serverless hosts), writes fail and
 * the route reports the failure rather than swallowing it. Point
 * ASTHIWAR_DATA_DIR at a mounted volume, or replace this module.
 */

const DATA_DIR = process.env.ASTHIWAR_DATA_DIR ?? path.join(process.cwd(), '.data');

const FILES = {
  enquiries: 'enquiries.jsonl',
  estimates: 'estimate-reports.jsonl',
} as const;

type Collection = keyof typeof FILES;

async function append(collection: Collection, record: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await appendFile(path.join(DATA_DIR, FILES[collection]), `${JSON.stringify(record)}\n`, 'utf8');
}

async function readAll<T>(collection: Collection): Promise<T[]> {
  let raw: string;
  try {
    raw = await readFile(path.join(DATA_DIR, FILES[collection]), 'utf8');
  } catch (error) {
    // Nothing recorded yet is a normal state, not a failure.
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as T];
      } catch {
        // One corrupt line must not hide every other lead in the file.
        return [];
      }
    });
}

/** Human-readable and sortable: ENQ-20260904-4F2A. */
function referenceId(prefix: string): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `${prefix}-${stamp}-${suffix}`;
}

export async function saveEnquiry(
  draft: Omit<StoredEnquiry, 'id' | 'receivedAt'>,
): Promise<StoredEnquiry> {
  const record: StoredEnquiry = {
    ...draft,
    id: referenceId('ENQ'),
    receivedAt: new Date().toISOString(),
  };
  await append('enquiries', record);
  return record;
}

export async function saveEstimateReport(
  draft: Omit<StoredEstimateReport, 'id' | 'receivedAt'>,
): Promise<StoredEstimateReport> {
  const record: StoredEstimateReport = {
    ...draft,
    id: referenceId('EST'),
    receivedAt: new Date().toISOString(),
  };
  await append('estimates', record);
  return record;
}

/** Newest first, for the admin screens. */
export async function listEnquiries(): Promise<StoredEnquiry[]> {
  const all = await readAll<StoredEnquiry>('enquiries');
  return all.reverse();
}

export async function listEstimateReports(): Promise<StoredEstimateReport[]> {
  const all = await readAll<StoredEstimateReport>('estimates');
  return all.reverse();
}
