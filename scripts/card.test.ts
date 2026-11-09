import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeXml, render } from './card.ts';
import type { Check } from './card.ts';

const passing: Check = { name: 'forecasting repo is public', detail: '★ 170 · 39 forks', ok: true, ms: 312 };
const failing: Check = { name: 'profile links resolve', detail: '2/3 resolve', ok: false, ms: 418 };

test('counts passed and failed checks in the summary', () => {
  const svg = render([passing, failing], 'dark', '10 Nov 2026');
  assert.match(svg, /1 passed/);
  assert.match(svg, /1 failed/);
  assert.match(svg, /✗/);
});

test('leaves out the failed count when everything passes', () => {
  const svg = render([passing], 'light', '10 Nov 2026');
  assert.match(svg, /1 passed/);
  assert.doesNotMatch(svg, /failed/);
});

test('escapes text so a check detail cannot break the SVG', () => {
  assert.equal(escapeXml('<a & "b">'), '&lt;a &amp; &quot;b&quot;&gt;');
  const svg = render([{ ...passing, detail: '<script>' }], 'dark', '10 Nov 2026');
  assert.doesNotMatch(svg, /<script>/);
});

test('grows the card with the number of checks', () => {
  const height = (svg: string) => Number(/height="(\d+)"/.exec(svg)?.[1]);
  assert.ok(height(render([passing, passing, passing], 'dark', 'x')) > height(render([passing], 'dark', 'x')));
});
