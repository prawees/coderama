// เคสประจำวัน: a friend's dare lands on /daily, a visitor with no save plays today's case, gets a result with
// no diagnosis in it, can dare back and share, and the streak follows the calendar. Exits 1 if a check fails.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const { workup, pickDx, dxAnswer } = require('./workup');
const OUT = __dirname + '/out/daily'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

/** A page whose clock runs `days` ahead, with the phone's share sheet recorded instead of opened */
async function open(b, { days = 0, save = null, storage = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  p.errors = [];
  p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) p.errors.push(String(e)); });
  await p.addInitScript(([off, v, st]) => {
    delete Navigator.prototype.vibrate;
    const now = Date.now; Date.now = () => now() + off;
    window.__shared = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared.push(d); } });
    if (!sessionStorage.getItem('s')) {
      localStorage.setItem('coderama.coldOpenSeen', '1');
      if (v) localStorage.setItem('CapacitorStorage.code-rama-storage', v);
      if (st) localStorage.setItem('coderama.daily', st);
      sessionStorage.setItem('s', '1');
    }
  }, [days * 86400000, save, storage]);
  return p;
}

/** The title menu, tapping through the splash when there is no save to skip it */
async function toMenu(p) {
  await p.goto(BASE + '/');
  for (let i = 0; i < 40 && !(await p.getByTestId('daily-link').count()); i++) {
    const tap = p.locator('text=แตะเพื่อเริ่ม');
    if (await tap.count()) await tap.click({ force: true }).catch(() => {});
    await p.waitForTimeout(400);
  }
}

/** Play the case on screen to its end: workup, the right diagnosis, then the first option at each step */
async function playCase(p) {
  await p.getByTestId('patient-card').waitFor();
  const caseId = p.url().split('/play/')[1].split('?')[0];
  await workup(p);
  await p.getByRole('button', { name: 'รักษา', exact: true }).click({ force: true });
  for (let s = 0; s < 60 && !(await p.getByTestId('finish-case').count()); s++) {
    if (await p.getByTestId('dx-option').count()) { await pickDx(p, caseId, true); continue; }
    if (await p.getByTestId('cpr-minigame').count()) { for (let i = 0; i < 16; i++) { await p.getByTestId('cpr-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(545); } await p.waitForTimeout(1500); continue; }
    const btns = p.getByTestId('action-tab').locator('button.cozy-btn:not(.cozy-btn-berry):not(.cozy-btn-sky)');
    if (!(await btns.count())) { await p.waitForTimeout(300); continue; }
    await btns.first().click({ force: true }); await p.waitForTimeout(350);
  }
  return caseId;
}

(async () => {
  const b = await chromium.launch(LAUNCH);

  // 1. A friend's dare, opened by someone who has never played
  const p = await open(b);
  await p.goto(BASE + '/daily');
  await p.getByTestId('daily-number').waitFor();
  const n = Number((await p.getByTestId('daily-number').innerText()).replace('#', ''));
  await p.goto(`${BASE}/daily?d=${n}&s=2&t=200&x=0&n=${encodeURIComponent('สมาร์ท')}`);
  await p.getByTestId('daily-dare-banner').waitFor();
  const banner = await p.getByTestId('daily-dare-banner').innerText();
  check(/สมาร์ทท้าคุณ!/.test(banner) && /2 ดาว ใน 3:20/.test(banner), 'the dare names the friend and their result', banner.replace(/\n/g, ' / '));
  check(await p.getByTestId('daily-play').count() === 1, 'one button to start, no save needed');
  const pageText = await p.getByTestId('daily').innerText();
  await p.screenshot({ path: `${OUT}/1_dare.png` });

  await p.getByTestId('daily-play').click();
  const caseId = await (async () => { await p.waitForURL(/\/simulator\/play\//); return p.url().split('/play/')[1].split('?')[0]; })();
  const answer = dxAnswer(caseId);
  check(!!answer && !pageText.includes(answer), 'the page does not name the diagnosis', `${caseId}`);
  await p.getByTestId('patient-card').waitFor();
  check((await p.getByTestId('practice-tag').innerText()).includes('เคสประจำวัน'), 'the case is marked as the case of the day');
  await playCase(p);
  await p.getByTestId('daily-result').waitFor();
  const result = await p.getByTestId('daily-result').innerText();
  check(/เล่นติดกัน 1 วัน/.test(result) && /\d:\d\d/.test(result), 'the result shows stars, the clock and a streak of one', result.replace(/\n/g, ' / ').slice(0, 120));
  check(/วินิจฉัยถูกตั้งแต่ครั้งแรก/.test(result), 'and that the diagnosis was right first time');
  check(await p.getByTestId('daily-verdict').count() === 1, 'with a verdict against the friend', await p.getByTestId('daily-verdict').innerText().catch(() => ''));
  check(!(await p.getByTestId('daily-coins').count()), 'no coins without a story save');
  await p.getByTestId('daily-result').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/2_result.png` });

  await p.getByTestId('daily-dare').click(); await p.waitForTimeout(300);
  const shared = await p.evaluate(() => window.__shared);
  check(new RegExp(`/daily\\?d=${n}&s=\\d&t=\\d+&x=1$`).test(shared[0]?.url || ''), 'the dare back carries the result and no name', shared[0]?.url);
  check(!!shared[0]?.text && !shared[0].text.includes(answer), 'and its text does not name the diagnosis', shared[0]?.text);
  await p.getByTestId('daily-share').click();
  await p.getByTestId('share-image').waitFor({ timeout: 20000 });
  const card = await p.getByTestId('share-image').evaluate(async (img) => { const bytes = new Uint8Array(await (await (await fetch(img.src)).blob()).arrayBuffer()); let bin = ''; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(bin); });
  fs.writeFileSync(`${OUT}/3_card.png`, Buffer.from(card, 'base64'));
  check(card.length > 20000, 'the Story card is drawn');
  await p.getByTestId('share-close').click();
  await p.getByTestId('finish-case').click();
  await p.waitForURL(/\/daily/);
  await p.getByTestId('daily-done').waitFor();
  check(/\d\d:\d\d:\d\d/.test(await p.getByTestId('daily-countdown').innerText()), 'back on the page: done, with a countdown to the next patient');
  await p.screenshot({ path: `${OUT}/4_done.png` });
  const stored = await p.evaluate(() => localStorage.getItem('coderama.daily'));
  await toMenu(p);
  check(/เล่นแล้ว ติดกัน 1 วัน/.test(await p.getByTestId('daily-link').innerText()), 'the title menu knows it is done');
  await p.screenshot({ path: `${OUT}/5_title.png` });
  check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
  await p.context().close();

  // 2. Tomorrow: a new patient, the streak still alive; a missed day ends it
  const t = await open(b, { days: 1, storage: stored });
  await t.goto(BASE + '/daily'); await t.getByTestId('daily-play').waitFor();
  check(Number((await t.getByTestId('daily-number').innerText()).replace('#', '')) === n + 1, 'the next day has the next number');
  check(/เล่นติดกัน 1 วัน/.test(await t.getByTestId('daily-page-streak').innerText()), 'yesterday\'s streak is still alive');
  await toMenu(t);
  check(/ยังไม่ได้เล่นวันนี้ ติดกันมา 1 วัน/.test(await t.getByTestId('daily-link').innerText()), 'the title menu says today is still waiting');
  await t.context().close();
  const late = await open(b, { days: 3, storage: stored });
  await late.goto(BASE + '/daily'); await late.getByTestId('daily-play').waitFor();
  check(/เล่นติดกัน 0 วัน/.test(await late.getByTestId('daily-page-streak').innerText()), 'after a missed day the streak is back to zero');
  await late.goto(`${BASE}/daily?d=${n}&s=3&t=90&x=1`); await late.getByTestId('daily-dare-banner').waitFor();
  check(/เคสวันก่อน/.test(await late.getByTestId('daily-dare-banner').innerText()), 'an old dare says so and offers today\'s case');
  await late.context().close();

  // 3. With a story save: coins once, and a second day in a row makes the streak two
  const save = JSON.stringify({ ...seed, state: { ...seed.state, currentDay: 4, playerName: 'บิ๊ก', tutorialCompleted: true, currency: 100 } });
  const s2 = await open(b, { days: 1, save, storage: stored });
  await s2.goto(BASE + '/daily'); await s2.getByTestId('daily-play').click();
  await playCase(s2);
  await s2.getByTestId('daily-result').waitFor();
  check(/เล่นติดกัน 2 วัน/.test(await s2.getByTestId('daily-streak').innerText()), 'a second day in a row makes two');
  const coins = Number(((await s2.getByTestId('daily-coins').innerText().catch(() => '')).match(/\+(\d+)/) || [])[1] || 0);
  const cash = await s2.evaluate(() => JSON.parse(localStorage.getItem('CapacitorStorage.code-rama-storage')).state.currency);
  check(coins >= 20 && cash === 100 + coins, 'the story save gets the coins', `${coins} -> ${cash}`);
  await s2.getByTestId('daily-dare').click(); await s2.waitForTimeout(300);
  check(/[?&]n=%E0%B8%9A/.test((await s2.evaluate(() => window.__shared))[0]?.url || ''), 'a player with a save signs the dare');
  await s2.getByTestId('finish-case').click(); await s2.waitForURL(/\/daily/);
  await s2.getByTestId('daily-replay').click(); await playCase(s2); await s2.getByTestId('daily-result').waitFor();
  const cash2 = await s2.evaluate(() => JSON.parse(localStorage.getItem('CapacitorStorage.code-rama-storage')).state.currency);
  check(cash2 === cash && !(await s2.getByTestId('daily-coins').count()), 'playing it again pays nothing and keeps the first result');
  check(s2.errors.length === 0, 'no page errors', s2.errors.join(' '));
  await s2.context().close();

  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
