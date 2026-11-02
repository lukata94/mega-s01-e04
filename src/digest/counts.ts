import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Counts = { ok: number; retry: number; fail: number };

// Counts of log lines by status for one night. Bad lines are skipped, never thrown.
// Returns null when runs/<night>.jsonl does not exist or the night is not a plain date.
export function countStatuses(runsDir: string, night: string): Counts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  const file = join(runsDir, `${night}.jsonl`);
  if (!existsSync(file)) return null;

  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const counts: Counts = { ok: 0, retry: 0, fail: 0 };
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    let v: unknown;
    try {
      v = JSON.parse(line);
    } catch {
      continue;
    }
    if (typeof v !== 'object' || v === null) continue;
    const o = v as Record<string, unknown>;
    if (typeof o.at !== 'string' || typeof o.job !== 'string') continue;
    if (o.status === 'ok' || o.status === 'retry' || o.status === 'fail') counts[o.status]++;
  }
  return counts;
}
