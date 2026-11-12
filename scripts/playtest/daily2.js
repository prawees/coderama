// The two quick daily challenges: ทายโรค (guess the diagnosis from clues) and ลำดับชีวิต (order an algorithm).
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/daily2'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

(async () => {
  const b = await chromium.launch(LAUNCH);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  const errors = []; p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) errors.push(String(e)); });
  await p.addInitScript(() => { delete Navigator.prototype.vibrate; window.__shared = []; Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared.push(d); } }); });

  // ทายโรค
  await p.goto(BASE + '/daily'); await p.getByTestId('daily-dx-link').click();
  await p.getByTestId('dxdle').waitFor();
  check(await p.getByTestId('dx-clue').count() === 1, 'it starts with one clue');
  const guessOf = async (q, nth = 0) => { await p.getByTestId('dx-input').fill(q); await p.getByTestId('dx-pick').nth(nth).click(); await p.waitForTimeout(150); };
  // Find the answer and a look-alike the way the page knows them, without showing them
  const first = await p.getByTestId('dx-clue').first().innerText();
  await guessOf('gout');
  check(await p.getByTestId('dx-clue').count() === 2, 'a miss opens the next clue');
  check(!(await p.getByTestId('dx-end').count()), 'and the answer stays hidden');
  await p.reload(); await p.getByTestId('dxdle').waitFor();
  check(await p.getByTestId('dx-guess').count() === 1, 'guesses survive a reload');
  // keep missing until the end: six tries in all
  const misses = ['pertussis', 'renal colic', 'cellulitis', 'epilepsy', 'uraemia', 'malaria', 'typhoid', 'hypoglyc'];
  for (const m of misses) { if (await p.getByTestId('dx-end').count()) break; await p.getByTestId('dx-input').fill(m); if (await p.getByTestId('dx-pick').count()) { await p.getByTestId('dx-pick').first().click(); await p.waitForTimeout(150); } }
  await p.getByTestId('dx-end').waitFor();
  const answer = await p.getByTestId('dx-answer').innerText();
  check(!!answer && !first.includes(answer), 'at the end the answer and its look-alikes are shown', answer);
  await p.screenshot({ path: `${OUT}/1_dx_end.png`, fullPage: true });
  await p.getByTestId('dx-share').click(); await p.waitForTimeout(300);
  const shared = (await p.evaluate(() => window.__shared))[0];
  check(/Dx Guess #\d+ (X|\d)\/\d\n[🟩🟨🟥]+$/u.test(shared?.text || '') && !shared.text.includes(answer), 'the share text is the grid, with no diagnosis', (shared?.text || '').replace(/\n/g, ' / '));
  check(/\/daily\/dx\?d=\d+&g=(x|\d)$/.test(shared?.url || ''), 'and a link that carries the result', shared?.url);
  const day = Number(shared.url.match(/d=(\d+)/)[1]);
  // a second visitor wins on the first try and sees the friend's line
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await q.goto(`${BASE}/daily/dx?d=${day}&g=3&n=${encodeURIComponent('สมาร์ท')}`); await q.getByTestId('dx-friend').waitFor();
  check(/สมาร์ท 3\/6/.test(await q.getByTestId('dx-friend').innerText()), 'a dare shows how the friend did');
  await q.getByTestId('dx-input').fill(answer.slice(0, 12)); await q.getByTestId('dx-pick').filter({ hasText: answer }).first().click();
  await q.getByTestId('dx-end').waitFor();
  check(/1\/6/.test(await q.getByTestId('dx-end').innerText()), 'the right name ends it at once');
  await q.screenshot({ path: `${OUT}/2_dx_win.png` });
  await q.context().close();

  // ลำดับชีวิต
  await p.goto(BASE + '/daily/algo'); await p.getByTestId('algo-start').click();
  const total = await p.getByTestId('algo-chip').count();
  // one deliberate wrong tap: the last step first
  await p.locator(`[data-testid=algo-chip][data-step="${total - 1}"]`).click(); await p.waitForTimeout(100);
  check(/ผิด 1/.test(await p.getByTestId('algo').innerText()), 'a step out of order is counted, not placed');
  await p.screenshot({ path: `${OUT}/3_algo_play.png` });
  for (let i = 0; i < total; i++) { await p.locator(`[data-testid=algo-chip][data-step="${i}"]`).click(); await p.waitForTimeout(80); }
  await p.getByTestId('algo-end').waitFor();
  const score = Number(await p.getByTestId('algo-score').innerText());
  check(score > total * 100 - 40 && score <= total * 100 - 40 + 300, 'the score is steps, less the miss, plus speed', String(score));
  check(/Ref:/.test(await p.getByTestId('algo-end').innerText()), 'the guideline is named');
  await p.screenshot({ path: `${OUT}/4_algo_end.png`, fullPage: true });
  await p.getByTestId('algo-share').click(); await p.waitForTimeout(300);
  const s2 = (await p.evaluate(() => window.__shared)).pop();
  check(new RegExp(`/daily/algo\\?d=${day}&s=${score}$`).test(s2?.url || ''), 'the dare carries the score', s2?.url);
  await p.getByTestId('algo-again').click();
  for (let i = 0; i < total; i++) { await p.locator(`[data-testid=algo-chip][data-step="${i}"]`).click(); await p.waitForTimeout(60); }
  await p.getByTestId('algo-end').waitFor();
  check(Number(await p.getByTestId('algo-score').innerText()) === score, 'a second run does not replace the day\'s score');
  await p.getByTestId('algo-pick-atls').click(); await p.getByTestId('algo-start').waitFor();
  check((await p.getByTestId('algo-title').innerText()).includes('ATLS'), 'other algorithms can be practised');
  await p.goto(BASE + '/daily'); await p.getByTestId('daily-algo-link').waitFor();
  check((await p.getByTestId('daily-algo-link').innerText()).includes(String(score)) && /Done/.test(await p.getByTestId('daily-dx-link').innerText()), 'the daily page shows both as done');
  await p.screenshot({ path: `${OUT}/5_daily.png`, fullPage: true });
  check(errors.length === 0, 'no page errors', errors.join(' '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
