// Runs live checks on my public projects and writes the profile header for both themes.
// Usage: node scripts/check.ts            (live, uses GITHUB_TOKEN if set)
//        node scripts/check.ts --sample   (no network, for previews)

import { readFile, writeFile } from 'node:fs/promises';
import { render } from './card.ts';
import type { Check } from './card.ts';

const userAgent = 'manuhup-profile-check';
const token = process.env.GITHUB_TOKEN;

function github(path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': userAgent };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`https://api.github.com${path}`, { headers });
}

// Times one check. Returning null means there is nothing to report, so the row is left out.
async function timed(name: string, run: () => Promise<string | null>): Promise<Check | null> {
  const start = performance.now();
  try {
    const detail = await run();
    return detail === null ? null : { name, detail, ok: true, ms: performance.now() - start };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { name, detail, ok: false, ms: performance.now() - start };
  }
}

async function forecastingRepo(): Promise<string> {
  const res = await github('/repos/manuhup/LSTM-XGBoost-Hybrid-Forecasting');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const repo = (await res.json()) as { private: boolean; stargazers_count: number; forks_count: number };
  if (repo.private) throw new Error('repository is private');
  return `★ ${repo.stargazers_count} · ${repo.forks_count} forks`;
}

async function montyExamples(): Promise<string | null> {
  const query = encodeURIComponent('repo:pydantic/monty author:manuhup is:pr is:merged');
  const res = await github(`/search/issues?q=${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { total_count: count } = (await res.json()) as { total_count: number };
  return count > 0 ? `${count} merged PR${count === 1 ? '' : 's'}` : null;
}

async function profileLinks(): Promise<string> {
  const readme = await readFile('README.md', 'utf8');
  // LinkedIn blocks automated requests, so its link is not checked.
  const urls = [...new Set([...readme.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)].map((m) => m[1]))].filter(
    (url) => !url.includes('linkedin.com'),
  );
  const results = await Promise.all(
    urls.map(async (url) => (await fetch(url, { redirect: 'follow', headers: { 'User-Agent': userAgent } })).ok),
  );
  const ok = results.filter(Boolean).length;
  if (ok !== urls.length) throw new Error(`${ok}/${urls.length} resolve`);
  return `${ok}/${urls.length} resolve`;
}

const sample = process.argv.includes('--sample');

const checks: Check[] = sample
  ? [
      { name: 'forecasting repo is public', detail: '★ 170 · 39 forks', ok: true, ms: 312 },
      { name: 'profile links resolve', detail: '3/3 resolve', ok: true, ms: 418 },
    ]
  : (
      await Promise.all([
        timed('forecasting repo is public', forecastingRepo),
        timed('monty examples are merged', montyExamples),
        timed('profile links resolve', profileLinks),
      ])
    ).filter((check): check is Check => check !== null);

const failed = checks.filter((check) => !check.ok);
console.log(`${checks.length - failed.length} passed, ${failed.length} failed`);
for (const check of failed) console.log(`✗ ${check.name}: ${check.detail}`);

// If every check failed, the network or the token is the likely problem, not the projects:
// keep the previous header and fail the run instead of publishing a red card.
if (checks.length > 0 && failed.length === checks.length) {
  console.error('Every check failed, so the header was left unchanged.');
  process.exit(1);
}

const checkedOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

for (const theme of ['dark', 'light'] as const) {
  await writeFile(`Images/banner-${theme}.svg`, render(checks, theme, checkedOn));
}
