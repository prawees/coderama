// Needs Playwright: `npm i -D playwright && npx playwright install chromium`, or set PW_MODULE / PW_CHROMIUM
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const base = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
fs.mkdirSync(__dirname + '/out/feat', { recursive: true });
(async () => {
  const b = await chromium.launch(LAUNCH);
  for (const day of [3, 4]) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
    const st = { ...base, state: { ...base.state, currentDay: day, shiftMode: 'off-duty', clockMinutes: 0, activeCases: [], tutorialCompleted: true, storyFlags: { FIRST_SHIFT_TIP: true } } };
    await p.addInitScript((v) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('CapacitorStorage.code-rama-storage', v); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(st));
    await p.goto(BASE + '/hub.html'); await p.waitForTimeout(2500);
    for (let i = 0; i < 6 && await p.getByTestId('dialogue').count(); i++) { await p.getByTestId('dialogue').click({ force: true }); await p.waitForTimeout(300); }
    await p.keyboard.down('ArrowDown'); await p.waitForTimeout(2600); await p.keyboard.up('ArrowDown');
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${__dirname}/out/feat/out_day${day}.png` });
    console.log(day, 'errors', JSON.stringify(errs));
    await p.context().close();
  }
  await b.close();
})();
