// Targeted check of the new systems: rain day, notice-board request, review patient, casebook, birthdays
// Needs Playwright: `npm i -D playwright && npx playwright install chromium`, or set PW_MODULE / PW_CHROMIUM
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/feat'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const base = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
const LOC = __dirname + '/../../public/locales/th/';
const log = (...a) => console.log(a.join(' '));

/** Texts of the right buttons for a case */
function correctTexts(caseId) {
  const d = JSON.parse(fs.readFileSync(LOC + caseId + '.json', 'utf8'));
  const nodes = d.managementGraph.nodes;
  const out = new Set();
  if (Array.isArray(nodes)) {
    for (const n of nodes) if (n.type !== 'start' && n.data) {
      const offPath = n.data.outcomeType === 'worsened';
      if (!offPath) out.add((n.data.choice || n.data.label || '').trim());
    }
  } else {
    for (const v of Object.values(nodes)) for (const o of v.options || []) {
      const t = nodes[o.targetNode];
      if (t && !t.slip && t.outcomeType !== 'worsened') out.add(o.text.trim());
    }
  }
  return out;
}

(async () => {
  const b = await chromium.launch(LAUNCH);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  const met = ['case_01', 'case_02_fluids', 'case_05_asthma', 'case_07', 'case_03_cardiac', 'case_09', 'case_15', 'case_04_svt', 'case_08', 'case_10'];
  const patientLog = Object.fromEntries(met.map((c, i) => [c, { day: i < 4 ? 1 : 2, good: i !== 4, letterRead: true, star: i % 3 === 0 }]));
  const st = { ...base, state: { ...base.state, currentDay: 3, shiftMode: 'off-duty', clockMinutes: 0, activeCases: [], tutorialCompleted: true, energy: 100, currency: 500,
    patientLog, requestsDone: [], casebookClaimed: [], storyFlags: { FIRST_SHIFT_TIP: true }, gifts: {},
    shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0, patients: [], spawned: [], midPlayed: [] } } };
  await p.addInitScript((v) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('CapacitorStorage.code-rama-storage', v); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(st));
  await p.goto(BASE + '/hub.html'); await p.waitForTimeout(2500);
  for (let i = 0; i < 6 && await p.getByTestId('dialogue').count(); i++) { await p.getByTestId('dialogue').click({ force: true }); await p.waitForTimeout(300); }
  log('HUD', (await p.getByTestId('hud-day').innerText()).replace(/\n/g, ' '));
  await p.screenshot({ path: `${OUT}/1_hub_rain.png` });

  // quest log with today's request, then the casebook from it
  await p.getByRole('button', { name: 'quests' }).click({ force: true }); await p.waitForTimeout(500);
  log('REQUEST', (await p.getByTestId('daily-request').innerText()).replace(/\n/g, ' / '));
  log('QUEST BTN', await p.getByRole('button', { name: 'quests' }).innerText().catch(() => '?'));
  await p.screenshot({ path: `${OUT}/2_quests.png` });
  await p.getByTestId('open-casebook').click({ force: true }); await p.waitForTimeout(500);
  log('CASEBOOK', (await p.getByTestId('casebook-progress').innerText()).replace(/\n/g, ' / '));
  await p.screenshot({ path: `${OUT}/3_casebook.png` });
  const cash0 = await p.getByTestId('hud-cash').innerText();
  await p.getByTestId('casebook-claim-5').click({ force: true }); await p.waitForTimeout(400);
  log('CLAIM', (await p.getByTestId('casebook-progress').innerText()).replace(/\n/g, ' / '), '| cash', cash0, '->', await p.getByTestId('hud-cash').innerText());
  await p.getByTestId('casebook-case_09').click({ force: true }); await p.waitForTimeout(1200);
  log('PAGE', (await p.getByTestId('casebook-page').innerText()).replace(/\n/g, ' / ').slice(0, 600));
  await p.screenshot({ path: `${OUT}/4_casebook_page.png` });
  await p.mouse.click(5, 5); await p.waitForTimeout(400);

  // friends with birthdays
  const fb = p.getByRole('button', { name: /friends|เพื่อน/ });
  if (await fb.count()) { await fb.first().click({ force: true }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/5_friends.png` }); log('FRIENDS', (await p.getByTestId('friends-modal').innerText()).replace(/\n/g, ' / ').slice(0, 400)); await p.mouse.click(5, 5); await p.waitForTimeout(300); }
  else log('no friends button');

  // start the shift; day card shows the weather
  await p.getByTestId('start-shift').click({ force: true }); await p.waitForTimeout(700);
  log('DAYCARD', (await p.getByTestId('day-card').innerText().catch(() => '-')).replace(/\n/g, ' / '));
  await p.screenshot({ path: `${OUT}/6_daycard.png` });
  for (let i = 0; i < 80 && await p.getByTestId('dialogue').count(); i++) {
    const ch = p.getByTestId('dialogue-choices').locator('button');
    if (await ch.count()) { await ch.first().click({ force: true }); await p.waitForTimeout(250); continue; }
    if (await p.getByTestId('dialogue-skip').count()) { await p.getByTestId('dialogue-skip').click({ force: true }); await p.waitForTimeout(250); continue; }
    await p.getByTestId('dialogue').click({ force: true }); await p.waitForTimeout(200);
  }
  const busy = p.getByTestId('bed-chips').locator('button:not(:has-text("ว่าง"))');
  for (let i = 0; i < 30 && !(await busy.count()); i++) await p.waitForTimeout(500);
  log('PAGER', (await p.getByTestId('pager').innerText().catch(() => '-')).replace(/\n/g, ' / '));
  log('CHIP', (await busy.first().innerText()).replace(/\n/g, ' '));
  await p.screenshot({ path: `${OUT}/7_review_pager.png` });
  await busy.first().click({ force: true }); await p.waitForTimeout(1500);
  const caseId = p.url().split('/play/')[1].split('?')[0];
  log('CASE', caseId, await p.getByTestId('patient-name').innerText(), '| review tag', await p.getByTestId('review-tag').count());
  await p.screenshot({ path: `${OUT}/8_review_case.png` });
  // play it right
  const good = correctTexts(caseId);
  await p.getByRole('button', { name: 'รักษา', exact: true }).click({ force: true });
  for (let s = 0; s < 40 && !(await p.getByTestId('finish-case').count()); s++) {
    if (await p.getByTestId('cpr-minigame').count()) { for (let i = 0; i < 16; i++) { await p.getByTestId('cpr-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(545); } await p.waitForTimeout(1500); continue; }
    const btns = p.getByTestId('action-tab').locator('button.cozy-btn:not(.cozy-btn-berry):not(.cozy-btn-sky)');
    const texts = (await btns.allInnerTexts()).map((t) => t.replace(/อาจารย์คุม/, '').trim());
    let idx = texts.findIndex((t) => good.has(t));
    if (idx < 0) { log('  no known-correct among', JSON.stringify(texts).slice(0, 300)); idx = 0; }
    await btns.nth(idx).click({ force: true }); await p.waitForTimeout(400);
  }
  log('RESULT', (await p.getByTestId('finish-case').innerText()).replace(/\n/g, ' '), '| board', await p.getByTestId('board-request-done').innerText().catch(() => '-'));
  log('DX', (await p.getByTestId('diagnosis').innerText().catch(() => '-')).replace(/\n/g, ' '));
  await p.screenshot({ path: `${OUT}/9_result.png`, fullPage: true });
  await p.getByTestId('finish-case').click({ force: true }); await p.waitForTimeout(1800);
  for (let i = 0; i < 20 && await p.getByTestId('dialogue').count(); i++) { await p.getByTestId('dialogue').click({ force: true }); await p.waitForTimeout(250); }
  await p.getByRole('button', { name: 'quests' }).click({ force: true }); await p.waitForTimeout(500);
  log('REQUEST AFTER', (await p.getByTestId('daily-request').innerText()).replace(/\n/g, ' / '), '| quest btn', await p.getByRole('button', { name: 'quests' }).innerText().catch(() => '?'));
  const saved = JSON.parse(await p.evaluate(() => localStorage.getItem('CapacitorStorage.code-rama-storage')));
  log('SAVED requestsDone', JSON.stringify(saved.state.requestsDone), 'claimed', JSON.stringify(saved.state.casebookClaimed), 'log', JSON.stringify(saved.state.patientLog[caseId]), 'shift', JSON.stringify(saved.state.shiftStats.patients));
  log('ERRORS', JSON.stringify(errs));
  await b.close();
})();
