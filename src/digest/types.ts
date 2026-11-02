export type Status = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null; // null in the log; views show it as —
  runs: number;
  retries: number;
  lastStatus: Status;
  lastError: string | null;
  first: string;
  last: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse, counted not thrown
};

// Returns null when runs/<night>.jsonl does not exist (routes answer 404).
// An empty file returns { rows: [], badLines: 0 }. Never throws on a bad line.
export type ReadNight = (runsDir: string, night: string) => Night | null;
