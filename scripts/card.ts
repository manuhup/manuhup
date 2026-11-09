// Renders the profile header: an animated test run of checks on my public projects.

export type Check = { name: string; detail: string; ok: boolean; ms: number };
export type Theme = 'dark' | 'light';

const palette = {
  dark: { card: '#161B22', border: '#30363D', text: '#F0F6FC', muted: '#9198A1', pass: '#3FB950', fail: '#F85149', accent: '#A177FE' },
  light: { card: '#F6F8FA', border: '#D0D7DE', text: '#1F2328', muted: '#59636E', pass: '#1A7F37', fail: '#CF222E', accent: '#8250DF' },
} as const;

const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render(checks: Check[], theme: Theme, checkedOn: string): string {
  const c = palette[theme];
  const passed = checks.filter((check) => check.ok).length;
  const failed = checks.length - passed;
  const seconds = (checks.reduce((sum, check) => sum + check.ms, 0) / 1000).toFixed(1);

  const firstRow = 300;
  const rowStep = 46;
  const summaryY = firstRow + checks.length * rowStep + 14;
  const height = summaryY + 46;
  const rowDelay = (i: number) => 0.9 + i * 0.55;
  const summaryDelay = rowDelay(checks.length) + 0.1;

  const rows = checks
    .map((check, i) => {
      const y = firstRow + i * rowStep;
      const d = rowDelay(i);
      const mark = check.ok ? '✓' : '✗';
      return `
  <g class="row" style="animation-delay:${d}s">
    <circle class="spin" style="animation-delay:0s,${(d + 0.45).toFixed(2)}s" cx="92" cy="${y - 7}" r="8" fill="none" stroke="${c.muted}" stroke-width="2.5" stroke-dasharray="32 18"/>
    <text class="mark" style="animation-delay:${(d + 0.45).toFixed(2)}s" x="92" y="${y}" text-anchor="middle" font-family="${mono}" font-size="22" font-weight="700" fill="${check.ok ? c.pass : c.fail}">${mark}</text>
    <text x="122" y="${y}" font-family="${mono}" font-size="22" fill="${c.text}">${escapeXml(check.name)}</text>
    <text x="660" y="${y}" font-family="${mono}" font-size="22" fill="${c.muted}">${escapeXml(check.detail)}</text>
    <text x="1208" y="${y}" text-anchor="end" font-family="${mono}" font-size="20" fill="${c.muted}">${Math.round(check.ms)} ms</text>
  </g>`;
    })
    .join('');

  const summaryText = `${passed} passed${failed ? ` · ${failed} failed` : ''} · ${seconds} s · checked ${checkedOn}`;
  const summary =
    `<tspan fill="${failed ? c.fail : c.pass}" font-weight="700">${passed} passed</tspan>` +
    (failed ? `<tspan fill="${c.fail}"> · ${failed} failed</tspan>` : '') +
    `<tspan fill="${c.muted}"> · ${seconds} s · checked ${escapeXml(checkedOn)}</tspan>`;
  // Monospace glyphs are about 0.6em wide, so the cursor lands just after the summary.
  const cursorX = Math.round(72 + (summaryText.length + 1) * 22 * 0.6);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="${height}" viewBox="0 0 1280 ${height}" role="img" aria-label="Manuel Hupperich, AI engineer in Berlin. ${passed} of ${checks.length} checks on my public projects passed on ${escapeXml(checkedOn)}.">
  <style>
    .row { opacity: 0; animation: rise .45s cubic-bezier(.2,.7,.2,1) forwards; }
    .spin { transform-box: fill-box; transform-origin: center; animation: spin .7s linear infinite, hide 0s forwards; }
    .mark { opacity: 0; animation: show .25s ease-out forwards; }
    .summary { opacity: 0; animation: rise .45s ease-out ${summaryDelay.toFixed(2)}s forwards; }
    .cursor { opacity: 0; animation: blink 1.1s step-end ${(summaryDelay + 0.5).toFixed(2)}s infinite; }
    .pulse { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes hide { to { opacity: 0; } }
    @keyframes show { to { opacity: 1; } }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
    @media (prefers-reduced-motion: reduce) {
      .row, .mark, .summary { animation: none; opacity: 1; }
      .spin { display: none; }
      .cursor, .pulse { animation: none; }
    }
  </style>
  <defs>
    <clipPath id="type"><rect x="72" y="226" width="0" height="40"><animate attributeName="width" from="0" to="420" begin="0.2s" dur="0.6s" fill="freeze"/></rect></clipPath>
  </defs>
  <rect x="1" y="1" width="1278" height="${height - 2}" rx="18" fill="${c.card}" stroke="${c.border}" stroke-width="2"/>
  <rect x="72" y="62" width="56" height="6" rx="3" fill="${c.accent}"/>
  <text x="72" y="130" font-family="${sans}" font-size="60" font-weight="700" fill="${c.text}">Manuel Hupperich</text>
  <text x="72" y="176" font-family="${sans}" font-size="26" fill="${c.muted}">AI engineer in Berlin · production LLM agents · evaluation</text>
  <circle class="pulse" cx="1200" cy="94" r="7" fill="${c.pass}"/>
  <text x="1182" y="101" text-anchor="end" font-family="${mono}" font-size="18" fill="${c.muted}">runs weekly on GitHub Actions</text>
  <line x1="72" y1="206" x2="1208" y2="206" stroke="${c.border}" stroke-width="2"/>
  <text x="72" y="254" clip-path="url(#type)" font-family="${mono}" font-size="22" fill="${c.muted}"><tspan fill="${c.accent}">$</tspan> npm run check</text>
${rows}
  <text class="summary" x="72" y="${summaryY}" font-family="${mono}" font-size="22">${summary}</text>
  <rect class="cursor" x="${cursorX}" y="${summaryY - 18}" width="11" height="22" rx="1" fill="${c.muted}"/>
</svg>
`;
}
