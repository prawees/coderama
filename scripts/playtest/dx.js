// Workup before treatment: a case opens on the history, treatment waits for some gathering and a working
// diagnosis from the case's own differential, a wrong first pick is one slip, and the debrief shows the call.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const { dxAnswer, pickDx } = require('./workup');
const OUT = __dirname + '/out/dx'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

(async () => {
  const b = await chromium.launch(LAUNCH);
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  const errors = []; p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) errors.push(String(e)); });
  await p.addInitScript((v) => { delete Navigator.prototype.vibrate; if (!sessionStorage.getItem('s')) { localStorage.setItem('CapacitorStorage.code-rama-storage', v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('s', '1'); } },
    JSON.stringify({ ...seed, state: { ...seed.state, currentDay: 9, tutorialCompleted: true } }));
  const CASE = 'case_09';
  const answer = dxAnswer(CASE);
  await p.goto(`${BASE}/simulator/play/${CASE}?practice=1`);
  await p.getByTestId('patient-card').waitFor();
  const tab = (name) => p.getByRole('button', { name, exact: true });

  check(await p.getByText('ซักประวัติเพิ่ม').count() > 0 || await p.locator('text=CC').count() > 0, 'the case opens on the history');
  check(await p.getByTestId('tab-hint-exam').count() > 0 && await p.getByTestId('tab-hint-labs').count() > 0, 'the exam and lab tabs pulse');
  await p.screenshot({ path: `${OUT}/1_history.png` });

  await tab('รักษา').click();
  check(await p.getByTestId('dx-gate').count() > 0, 'treatment waits for a workup');
  check((await p.getByTestId('dx-progress').innerText()).includes('0/2'), 'and says how much is gathered', await p.getByTestId('dx-progress').innerText());
  check(!(await p.getByTestId('dx-option').count()), 'no diagnosis to pick yet');
  await p.screenshot({ path: `${OUT}/2_gate.png` });

  await p.getByTestId('dx-go-exam').click();
  await p.getByTestId('exam-tab').waitFor();
  const firstExam = p.locator('[data-testid^=examine-]').first();
  await firstExam.click(); await p.waitForTimeout(200);
  await p.getByRole('button', { name: 'แล็บ' }).click();
  await p.locator('[data-testid^=order-]').first().click(); await p.waitForTimeout(200);
  await p.screenshot({ path: `${OUT}/3_labs_raw.png` });
  const firstResult = await p.locator('[data-testid^=result-]').first().innerText();
  check(!/เข้าเกณฑ์|consistent with/i.test(firstResult), 'a numeric result shows the number, not the reading', firstResult.replace(/\n/g, ' / '));

  await tab('รักษา').click();
  const opts = await p.getByTestId('dx-option').allInnerTexts();
  check(opts.length >= 4 && opts.includes(answer), 'the differential is offered', opts.join(' | '));
  check(opts[0] !== answer, 'the answer is not always first');
  await p.screenshot({ path: `${OUT}/4_dx_options.png` });

  const wrong = opts.find((o) => o !== answer);
  await p.getByTestId('dx-option').filter({ hasText: wrong }).click(); await p.waitForTimeout(300);
  check((await p.getByTestId('action-tab').innerText()).includes(`ยังไม่ใช่ ${wrong}`), 'a wrong pick is answered, not revealed');
  check((await p.getByTestId('slip-count').innerText().catch(() => '')).includes('1'), 'and counts as one slip');
  check(await p.getByTestId('dx-gate').count() > 0, 'the player thinks again');
  await p.screenshot({ path: `${OUT}/5_wrong.png` });

  const picked = await pickDx(p, CASE, true);
  check(picked === answer, 'the right one goes through', picked);
  check(!(await p.getByTestId('dx-gate').count()), 'treatment opens');
  check((await p.getByTestId('slip-count').innerText().catch(() => '')).includes('1'), 'still one slip, not two');
  await p.screenshot({ path: `${OUT}/6_treat.png` });

  for (let s = 0; s < 40 && !(await p.getByTestId('finish-case').count()); s++) {
    if (await p.getByTestId('cpr-minigame').count()) { for (let i = 0; i < 16; i++) { await p.getByTestId('cpr-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(545); } await p.waitForTimeout(1500); continue; }
    const btns = p.getByTestId('action-tab').locator('button.cozy-btn:not(.cozy-btn-berry):not(.cozy-btn-sky)');
    if (!(await btns.count())) { await p.waitForTimeout(300); continue; }
    await btns.first().click({ force: true }); await p.waitForTimeout(350);
  }
  const debrief = await p.getByTestId('dx-debrief').innerText().catch(() => '');
  check(debrief.includes(`เริ่มจาก ${wrong}`) && debrief.includes(answer), 'the debrief shows the first call and the answer', debrief.replace(/\n/g, ' / '));
  await p.getByTestId('dx-debrief').scrollIntoViewIfNeeded().catch(() => {});
  await p.screenshot({ path: `${OUT}/7_debrief.png` });

  // A case whose diagnoses are a problem list, not a differential, treats as before
  await p.goto(`${BASE}/simulator/play/case_03_cardiac?practice=1`);
  await p.getByTestId('patient-card').waitFor();
  await tab('รักษา').click();
  check(!(await p.getByTestId('dx-gate').count()), 'the VF arrest is treated straight away');

  check(errors.length === 0, 'no page errors', errors.join(' '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
