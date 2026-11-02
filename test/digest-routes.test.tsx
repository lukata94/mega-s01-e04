import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

// runs/ is read-only: every case that needs its own data writes to a temp dir.
function tempRuns(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

const ok = (job: string, at: string) => JSON.stringify({ at, job, status: 'ok', owner: 'rook' });

describe('GET /digest/:night', () => {
  it('200: renders the real night', async () => {
    const res = await createApp({ ...base, runsDir: 'runs' }).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    for (const job of ['digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs']) {
      expect(html).toContain(job);
    }
  });

  it('404: a night with no file', async () => {
    const res = await createApp({ ...base, runsDir: tempRuns({}) }).request('/digest/2026-01-01');
    expect(res.status).toBe(404);
  });

  it('empty night: says nothing ran', async () => {
    const runsDir = tempRuns({ '2026-01-02.jsonl': '' });
    const res = await createApp({ ...base, runsDir }).request('/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('a bad line is counted, the night still renders', async () => {
    const runsDir = tempRuns({
      '2026-01-03.jsonl': `${ok('a/job', '2026-01-03T01:00:00+01:00')}\n{"at":"2026-01-03T0\n`,
    });
    const res = await createApp({ ...base, runsDir }).request('/digest/2026-01-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('a/job');
    expect(html).toContain('1 unreadable line');
  });
});

describe('GET /api/digest/:night', () => {
  it('200: same jobs, same order as the page', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    const json = (await (await app.request('/api/digest/2026-10-28')).json()) as {
      rows: { job: string }[];
      badLines: number;
    };
    const html = await (await app.request('/digest/2026-10-28')).text();
    const jobs = json.rows.map((r) => r.job);
    expect(jobs).toHaveLength(5);
    expect(json.badLines).toBe(1);
    const positions = jobs.map((j) => html.indexOf(j));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('404: a night with no file', async () => {
    const res = await createApp({ ...base, runsDir: tempRuns({}) }).request('/api/digest/2026-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such night' });
  });

  it('empty night: no rows', async () => {
    const runsDir = tempRuns({ '2026-01-02.jsonl': '' });
    const res = await createApp({ ...base, runsDir }).request('/api/digest/2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('a bad line is counted in the JSON too', async () => {
    const runsDir = tempRuns({ '2026-01-03.jsonl': `${ok('a/job', '2026-01-03T01:00:00+01:00')}\nnot json\n` });
    const body = (await (await createApp({ ...base, runsDir }).request('/api/digest/2026-01-03')).json()) as {
      rows: unknown[];
      badLines: number;
    };
    expect(body.rows).toHaveLength(1);
    expect(body.badLines).toBe(1);
  });
});
