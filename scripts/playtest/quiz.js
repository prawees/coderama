// หมอ ER สายไหน: six taps to a result, a Story card, a friend's link, and a match line.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/quiz'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };
(async () => {
  const b = await chromium.launch(LAUNCH);
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  const errors = []; p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) errors.push(String(e)); });
  await p.addInitScript(() => { delete Navigator.prototype.vibrate; window.__shared = []; Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared.push(d); } }); });
  await p.goto(BASE + '/quiz');
  await p.getByTestId('quiz-question').waitFor();
  await p.screenshot({ path: `${OUT}/1_question.png` });
  // answer "calm" (the 4th option) four times and "heart" twice
  for (let i = 0; i < 6; i++) { await p.getByTestId('quiz-answer').nth(i < 4 ? 3 : 2).click(); await p.waitForTimeout(80); }
  await p.getByTestId('quiz-result').waitFor();
  const type = await p.getByTestId('quiz-type').innerText();
  check(type === 'สายนิ่งสยบโค้ด', 'six answers give the type answered most', type);
  await p.screenshot({ path: `${OUT}/2_result.png`, fullPage: true });
  await p.getByTestId('quiz-story').click();
  await p.getByTestId('share-image').waitFor({ timeout: 20000 });
  const card = await p.getByTestId('share-image').evaluate(async (img) => { const bytes = new Uint8Array(await (await (await fetch(img.src)).blob()).arrayBuffer()); let bin = ''; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(bin); });
  fs.writeFileSync(`${OUT}/3_card.png`, Buffer.from(card, 'base64'));
  check(card.length > 20000, 'the Story card is drawn');
  await p.getByTestId('share-close').click();
  await p.getByTestId('quiz-send').click(); await p.waitForTimeout(300);
  const shared = (await p.evaluate(() => window.__shared))[0];
  check(/\/quiz\?t=calm$/.test(shared?.url || ''), 'the link carries the type', shared?.url);
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await q.goto(BASE + '/quiz?t=calm'); await q.getByTestId('quiz-friend').waitFor();
  check(/สายนิ่งสยบโค้ด/.test(await q.getByTestId('quiz-friend').innerText()), 'a friend sees the sender\'s type');
  for (let i = 0; i < 6; i++) { await q.getByTestId('quiz-answer').nth(2).click(); await q.waitForTimeout(60); }
  check(/คู่หูที่ใช่/.test(await q.getByTestId('quiz-match').innerText()), 'and is told they are the partner type', await q.getByTestId('quiz-match').innerText());
  check(errors.length === 0, 'no page errors', errors.join(' '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
