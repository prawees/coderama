// Continuous playthrough from a fresh save: N days, logging the player's view of every day
// Needs Playwright: `npm i -D playwright && npx playwright install chromium`, or set PW_MODULE / PW_CHROMIUM
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/long'; fs.mkdirSync(OUT, { recursive: true });
const LOG = OUT + '/log.txt'; fs.writeFileSync(LOG, '');
const DAYS = +(process.argv[2] || 13);
const T0 = Date.now(); const log = (...a) => fs.appendFileSync(LOG, ((Date.now() - T0) / 1000).toFixed(0).padStart(5) + 's ' + a.join(' ') + '\n');
(async () => {
  const b = await chromium.launch(LAUNCH);
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  p.setDefaultTimeout(5000);
  p.on('pageerror', e => log('PAGEERROR', String(e).slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error') log('CONSOLE', m.text().slice(0, 200)); });
  const snap = (n) => p.screenshot({ path: `${OUT}/${n}.png` }).catch(() => {});
  let choiceSeed = 0;
  // Read a scene line by line; pick choices in rotation so different branches get exercised
  const scene = async (tag, max = 120) => {
    const dlg = p.getByTestId('dialogue');
    for (let i = 0; i < max && await dlg.count(); i++) {
      const ch = p.getByTestId('dialogue-choices').locator('button');
      // the first tap finishes the typing, the second moves on
      for (let k = 0; k < 20; k++) {
        const t = await p.getByTestId('dialogue-text').innerText().catch(() => '');
        if (t.includes('▼') || await ch.count() || !(await dlg.count())) break;
        if (k === 1) await dlg.click({ force: true, timeout: 2000 }).catch(() => {});
        await p.waitForTimeout(100);
      }
      if (!(await dlg.count())) break;
      const sp = await p.getByTestId('dialogue-speaker').innerText().catch(() => '');
      const tx = (await p.getByTestId('dialogue-text').innerText().catch(() => '')).replace('▼', '').trim();
      log(`  [${tag}] ${sp || '~'}: ${tx}`);
      if (await ch.count()) {
        const opts = await ch.allInnerTexts();
        const idx = choiceSeed++ % opts.length;
        log(`  [${tag}] >> ${opts.map((o, j) => (j === idx ? '*' : '') + o.replace(/\n/g, ' ')).join(' | ')}`);
        await ch.nth(idx).click({ force: true }); await p.waitForTimeout(250);
        continue;
      }
      await dlg.click({ force: true, timeout: 2000 }).catch(() => {}); await p.waitForTimeout(120);
    }
  };
  const hud = async () => (await p.getByTestId('hud-day').innerText().catch(() => '?')).replace(/\n/g, ' ');
  const playCase = async (day, k) => {
    await p.getByRole('button', { name: 'แล็บ', exact: true }).click({ force: true }).catch(() => {});
    const orders = p.locator('[data-testid^="order-"]');
    const n0 = await orders.count();
    for (let i = 0; i < Math.min(2, n0); i++) { await orders.first().click({ force: true }).catch(() => {}); await p.waitForTimeout(150); }
    await p.getByRole('button', { name: 'รักษา', exact: true }).click({ force: true });
    for (let s = 0; s < 50 && !(await p.getByTestId('finish-case').count()); s++) {
      if (await p.getByTestId('cpr-minigame').count()) { for (let i = 0; i < 16; i++) { await p.getByTestId('cpr-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(525); } await p.waitForTimeout(1500); continue; }
      const btns = p.getByTestId('action-tab').locator('button.cozy-btn:not(.cozy-btn-berry):not(.cozy-btn-sky)');
      const n = await btns.count(); if (n) await btns.nth((s + day) % n).click({ force: true }); await p.waitForTimeout(350);
    }
    if (k === 0) await snap(`d${String(day).padStart(2, '0')}_case_end`);
    const dx = await p.getByTestId('diagnosis').innerText().catch(() => '');
    const fin = await p.getByTestId('finish-case').innerText().catch(() => '');
    const nm = await p.getByTestId('patient-name').innerText().catch(() => '');
    const rv = await p.getByTestId('review-tag').count();
    log(`  CASE ${p.url().split('/play/')[1]?.split('?')[0]} ${nm}${rv ? ' [REVIEW]' : ''} | ${dx.replace(/\n/g, ' ').slice(0, 80)} | ${fin.replace(/\n/g, ' ')}`);
    await p.getByTestId('finish-case').click({ force: true }).catch(() => {}); await p.waitForTimeout(1500);
  };

  await p.goto(BASE + '/'); await p.waitForTimeout(1200);
  await p.locator('text=เกมจาก Rama G7 Club').click({ force: true }); await p.waitForTimeout(300);
  await p.locator('text=แตะเพื่อเริ่ม').click({ force: true }); await p.waitForTimeout(300);
  await p.getByTestId('new-game').click({ force: true }); await p.waitForTimeout(400);
  await p.locator('input[placeholder="มะปราง"]').fill('ต้นข้าว');
  await p.locator('button:has-text("ต่อไป")').last().click({ force: true }); await p.waitForTimeout(250);
  await p.locator('button:has-text("หญิง")').first().click({ force: true }); await p.waitForTimeout(150);
  await p.locator('button:has-text("ต่อไป")').last().click({ force: true }); await p.waitForTimeout(250);
  await p.locator('button:has-text("เข้าเวรเลย")').click({ force: true }); await p.waitForTimeout(2500);

  for (let day = 1; day <= DAYS; day++) {
    const t0 = Date.now();
    log(`\n===== DAY ${day} | ${await hud()} | ${p.url()}`);
    const card = await p.getByTestId('day-card').innerText().catch(() => '');
    if (card) log(`  DAYCARD ${card.replace(/\n/g, ' / ')}`);
    await scene(`d${day}pre`, 20);
    const bar = await p.locator('text=/XP \\d+/').first().innerText().catch(() => '');
    log(`  HUB rank/xp: ${(await p.locator('text=/XP \\d+/').first().locator('xpath=../..').innerText().catch(() => bar)).replace(/\n/g, ' ').slice(0, 80)}`);
    await snap(`d${String(day).padStart(2, '0')}_hub`);
    if (!(await p.getByTestId('start-shift').count())) { log('  NO START BUTTON'); await snap(`d${day}_nostart`); }
    await p.getByRole('button', { name: 'quests' }).click({ force: true }).catch(() => {}); await p.waitForTimeout(400);
    log(`  REQUEST ${(await p.getByTestId('daily-request').innerText().catch(() => '-')).replace(/\n/g, ' / ')}`);
    await p.mouse.click(5, 5); await p.waitForTimeout(300);
    await p.getByTestId('start-shift').click({ force: true }).catch(() => {}); await p.waitForTimeout(900);
    const card2 = await p.getByTestId('day-card').innerText().catch(() => '');
    if (card2) log(`  DAYCARD ${card2.replace(/\n/g, ' / ')}`);
    await scene(`d${day}start`);
    let seen = 0;
    for (let loop = 0; loop < 40 && seen < 3; loop++) {
      await scene(`d${day}mid`);
      const busy = p.getByTestId('bed-chips').locator('button:not(:has-text("ว่าง"))');
      if (!(await busy.count())) { await p.waitForTimeout(600); continue; }
      await busy.first().click({ force: true }); await p.waitForTimeout(1500);
      if (!p.url().includes('/play/')) { log('  chip did not open a case'); continue; }
      await playCase(day, seen); seen++;
      await scene(`d${day}mid`);
    }
    log(`  before end: ${await hud()}`);
    const es = p.getByTestId('end-shift');
    await es.click({ force: true }).catch(() => {}); await p.waitForTimeout(400);
    if (await es.count() && (await es.innerText()).includes('อีกครั้ง')) await es.click({ force: true });
    await p.waitForTimeout(800);
    await scene(`d${day}end`, 200);
    try { await p.getByTestId('summary-next').waitFor({ timeout: 8000 }); } catch { log('  NO SUMMARY', p.url()); await snap(`d${day}_nosummary`); }
    log(`  SUMMARY ${(await p.getByTestId('summary').innerText().catch(() => '')).replace(/\n+/g, ' / ').slice(0, 400)}`);
    await snap(`d${String(day).padStart(2, '0')}_summary`);
    await p.getByTestId('summary-next').click({ force: true }).catch(() => {}); await p.waitForTimeout(2500);
    if (await p.getByTestId('year-end').count()) {
      log(`  CHAPTER ${(await p.getByTestId('year-end').innerText()).replace(/\n+/g, ' / ').slice(0, 300)}`);
      await snap(`d${String(day).padStart(2, '0')}_chapter`);
      // the continue button appears after the chapter text, about 3.6 s in
      await p.getByTestId('year-end-next').waitFor({ timeout: 8000 }).catch(() => log('  NO YEAR-END BUTTON'));
      await p.getByTestId('year-end-next').click({ force: true }).catch(() => {}); await p.waitForTimeout(2500);
    }
    log(`  day took ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  const st = await p.evaluate(() => localStorage.getItem('CapacitorStorage.code-rama-storage'));
  fs.writeFileSync(OUT + '/state.json', st || '');
  log('DONE');
  await b.close();
})();
