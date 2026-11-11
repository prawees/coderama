// Calm reading mode (lib/calm.ts): switched on from the title menu, lines appear whole, nothing keeps moving,
// and the clinic's top rows never overlap. Exits 1 if a check fails.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/calm'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };
const overlap = (a, b) => a && b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = []; p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) errors.push(String(e)); });
  const st = { ...seed, state: { ...seed.state, currentDay: 1, playerName: 'บิ๊ก', shiftMode: 'off-duty', clockMinutes: 0, activeCases: [], tutorialCompleted: true, energy: 100,
    heartEventsSeen: [], guide: [], storyFlags: {}, shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0, patients: [], spawned: [], midPlayed: [] } } };
  await p.addInitScript((v) => { delete Navigator.prototype.vibrate; if (!sessionStorage.getItem('s')) { localStorage.setItem('CapacitorStorage.code-rama-storage', v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('s', '1'); } }, JSON.stringify(st));

  // The switch is on the title menu, in plain sight
  await p.goto(BASE + '/');
  await p.getByTestId('calm-menu').waitFor({ timeout: 15000 });
  check((await p.getByTestId('calm-menu').innerText()).includes('ปิด'), 'calm mode starts off');
  await p.getByTestId('calm-menu').click();
  check((await p.getByTestId('calm-menu').innerText()).includes('เปิด'), 'one tap turns it on');
  check(await p.evaluate(() => document.documentElement.classList.contains('calm')), 'the page knows');

  // In the clinic nothing loops; once the shift starts, story lines show whole at once
  await p.goto(BASE + '/hub'); await p.waitForTimeout(2500);
  for (let i = 0; i < 60 && await p.getByTestId('dialogue').count(); i++) { await p.getByTestId('dialogue').click({ force: true }); await p.waitForTimeout(120); }
  await p.waitForTimeout(500);
  const moving = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length);
  check(moving === 0, 'nothing keeps bobbing or pulsing', String(moving));

  // The top rows of the clinic do not cover each other
  const box = async (id) => p.getByTestId(id).boundingBox().catch(() => null);
  const day = await box('hud-day'), cash = await box('hud-cash'), guide = (await box('guide')) || (await box('guide-mini')), share = await box('hud-share');
  check(day && cash && guide && share, 'day, coins, guide and share are all on screen');
  check(![[day, guide], [day, share], [cash, share], [guide, share], [day, cash]].some(([a, c]) => overlap(a, c)), 'and none of them overlap',
    JSON.stringify({ day, cash, guide, share }, (k, v) => (typeof v === 'number' ? Math.round(v) : v)));
  await p.screenshot({ path: `${OUT}/1_clinic_calm.png` });

  await p.getByTestId('start-shift').click({ force: true });
  for (let i = 0; i < 20 && !(await p.getByTestId('dialogue').count()); i++) {
    if (await p.getByTestId('day-card').count()) await p.getByTestId('day-card').click({ force: true }).catch(() => {});
    await p.waitForTimeout(400);
  }
  if (await p.getByTestId('dialogue').count()) {
    const full = await p.getByTestId('dialogue-text').locator('[data-text]').first().getAttribute('data-text').catch(() => null);
    const text = await p.getByTestId('dialogue-text').innerText();
    check(!!full && text.replace(/\s|▼/g, '').length >= full.replace(/\s/g, '').length - 1, 'a story line shows whole, without typing', text.slice(0, 50).replace(/\n/g, ' '));
    await p.screenshot({ path: `${OUT}/2_dialogue_calm.png` });
  } else check(false, 'the shift opens with a story line');

  // Turned off again from settings
  await p.goto(BASE + '/'); await p.getByTestId('calm-menu').waitFor();
  await p.getByText('ตั้งค่า', { exact: true }).first().click();
  await p.getByTestId('calm-toggle').click();
  check(!(await p.evaluate(() => document.documentElement.classList.contains('calm'))), 'settings turns it off');
  check(errors.length === 0, 'no page errors', errors.join(' '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
