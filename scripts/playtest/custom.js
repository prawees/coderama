// Checks the case library, practice mode, the 3D bedside, the designer and custom-case play.
// Needs a served export (`npm run build`, `node scripts/playtest/serve.js out 8765`) and Playwright. Prints PASS or FAIL per check.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const OUT = __dirname + '/out/custom'; require('fs').mkdirSync(OUT, { recursive: true });
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' | ' + extra : '')); };

const SEEDED = {
  title: 'เคสทดสอบ', age: '40', sex: 'Female', chiefComplaint: 'เจ็บหน้าอก', background: 'ทดสอบ', diagnoses: ['STEMI'],
  vitals: { hr: { value: '110', abnormal: true }, sbp: { value: '100', abnormal: false } },
  exam: [{ id: 'e1', system: 'Respiratory', finding: 'clear', abnormal: false }, { id: 'e2', system: 'Neurological', finding: 'GCS 15', abnormal: false }],
  investigations: [{ id: 'ecg', kind: 'imaging', category: 'Imaging', name: '12-lead ECG', value: '', unit: '', normalRange: '', abnormal: true, report: 'ST elevation II III aVF', imageUrl: '/assets/logo_new.jpg' }],
  historyGraph: {
    nodes: [{ id: 'h1', x: 0, y: 0, data: { category: 'signs_symptoms', question: 'เจ็บมานานไหม', answer: '2 ชั่วโมง' } }, { id: 'h2', x: 0, y: 0, data: { category: 'allergy', question: 'แพ้ยาไหม', answer: 'ไม่แพ้' } }],
    edges: [{ id: 'x', source: 'h1', target: 'h2' }],
  },
  managementGraph: {
    nodes: [
      { id: 'start', type: 'start', x: 0, y: 0, data: {} },
      { id: 'r1', type: 'required', x: 0, y: 0, data: { choice: 'ให้ aspirin', label: 'ให้ antiplatelet', actions: [{ or: ['Aspirin 300 mg'] }], doseMap: {}, distractors: [{ label: 'ให้ pethidine', feedback: 'ไม่ใช่' }] } },
      { id: 't1', type: 'timer', x: 0, y: 0, data: { minutes: 5, note: '' } },
      { id: 'iv', type: 'intervention', x: 0, y: 0, data: { actions: ['กลับบ้าน'] } },
      { id: 'bad', type: 'outcome', x: 0, y: 0, data: { outcomeType: 'deteriorated', narrative: 'แย่ลง', vitalChanges: {} } },
      { id: 'o1', type: 'outcome', x: 0, y: 0, data: { outcomeType: 'improved', narrative: 'ดีขึ้น', vitalChanges: { hr: '90' } } },
    ],
    edges: [{ id: 'a', source: 'start', target: 'r1' }, { id: 'b', source: 'r1', target: 'o1' }, { id: 'c', source: 'start', target: 't1' }, { id: 'd', source: 't1', target: 'bad' }, { id: 'e', source: 'start', target: 'iv' }, { id: 'f', source: 'iv', target: 'bad' }],
  },
};

(async () => {
  const b = await chromium.launch(LAUNCH);
  const errs = [];
  const page = async (w, h) => {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.setDefaultTimeout(8000); p.setDefaultNavigationTimeout(30000);
    p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
    p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
    return p;
  };
  const tab = (p, name) => p.getByRole('button', { name, exact: true });
  const playToDebrief = async (p) => {
    await tab(p, 'รักษา').click(); await p.waitForTimeout(300);
    for (let i = 0; i < 80 && !(await p.getByTestId('finish-case').count()); i++) {
      const btns = p.locator('[data-testid=action-tab] button.cozy-btn'); const n = await btns.count();
      if (!n) break;
      await btns.nth(i % n).click({ force: true }); await p.waitForTimeout(200);
    }
  };

  // Library and a story case in practice mode
  const p = await page(390, 844);
  await p.addInitScript(() => localStorage.setItem('coderama.coldOpenSeen', '1'));
  await p.goto(BASE + '/');
  for (let k = 0; k < 30 && !(await p.getByTestId('new-game').count()); k++) {
    await p.locator('text=เกมจาก Rama G7 Club').click({ force: true, timeout: 300 }).catch(() => {});
    await p.locator('text=แตะเพื่อเริ่ม').click({ force: true, timeout: 300 }).catch(() => {});
    await p.waitForTimeout(300);
  }
  await p.getByTestId('case-library-link').click(); await p.getByTestId('case-library').waitFor();
  await p.getByTestId('tab-story').click(); await p.waitForTimeout(300);
  ok('51 story cases listed', (await p.getByTestId('story-case').count()) === 51);
  const save = () => p.evaluate(() => localStorage.getItem('CapacitorStorage.code-rama-storage'));
  const before = await save();
  await p.getByTestId('practice-case_12').click(); await p.getByTestId('practice-tag').waitFor({ timeout: 20000 });
  await p.waitForTimeout(4000);
  ok('3D canvas renders, no fallback', (await p.locator('[data-testid=bedside-3d] canvas').count()) === 1 && (await p.getByTestId('bedside-fallback').count()) === 0);
  await p.screenshot({ path: OUT + '/bedside.png' });
  await p.getByTestId('region-chest').click(); await p.waitForTimeout(500);
  ok('chest region reveals some findings, not all', (await p.locator('[data-testid^=finding-]').count()) >= 1 && (await p.locator('[data-testid^=examine-]').count()) >= 1);
  await p.getByTestId('exam-all').click(); await p.waitForTimeout(300);
  ok('examine all reveals the rest', (await p.locator('[data-testid^=examine-]').count()) === 0);
  await playToDebrief(p);
  ok('story practice reaches the debrief', (await p.getByTestId('debrief').count()) === 1);
  await p.getByTestId('finish-case').click(); await p.waitForTimeout(1200);
  ok('returns to the library', p.url().includes('/cases'), p.url());
  ok('practice leaves the save unchanged', (await save()) === before);

  // Designer: template, save, playtest
  const d = await page(1280, 800);
  await d.goto(BASE + '/designer?template=case_12'); await d.locator('input').first().waitFor({ timeout: 20000 }); await d.waitForTimeout(800);
  ok('designer opens a story case as a template', (await d.locator('input').first().inputValue()).includes('(copy)'));
  await d.getByRole('button', { name: 'Save', exact: true }).click(); await d.waitForURL(/id=local_/, { timeout: 12000 }); await d.waitForTimeout(1500);
  ok('saved on the device', d.url().includes('id=local_'));
  await d.getByRole('button', { name: 'Management & outcomes' }).first().click(); await d.waitForTimeout(1500);
  await d.screenshot({ path: OUT + '/designer_graph.png' });
  await d.getByRole('button', { name: '▶ Playtest' }).click(); await d.waitForURL(/play\/custom/, { timeout: 12000 }); await d.getByTestId('practice-tag').waitFor({ timeout: 25000 });
  await playToDebrief(d);
  ok('custom case reaches the debrief with a diagnosis', (await d.getByTestId('diagnosis').innerText().catch(() => '')).includes('Dx'));
  await d.goto(BASE + '/simulator/play/custom?caseId=nope'); await d.getByTestId('case-missing').waitFor();
  ok('a missing case is handled', true);

  // A seeded case: history unlocks, images, timers, wrong branches
  await d.evaluate((c) => localStorage.setItem('coderama.customCases.v1', JSON.stringify({ t1: { id: 't1', title: c.title, updatedAt: 1, data: c } })), SEEDED);
  await d.goto(BASE + '/simulator/play/custom?caseId=t1'); await d.getByTestId('practice-tag').waitFor({ timeout: 20000 });
  await tab(d, 'ประวัติ').click(); await d.waitForTimeout(200);
  ok('only the open history question shows', (await d.getByTestId('history-question').count()) === 1);
  await d.getByTestId('history-question').click(); await d.waitForTimeout(200);
  ok('answering unlocks the follow-up', (await d.getByTestId('history-answer').count()) === 1 && (await d.getByTestId('history-question').count()) === 1);
  await tab(d, 'แล็บ').click(); await d.waitForTimeout(200);
  await d.getByTestId('order-ecg').click(); await d.waitForTimeout(800);
  ok('result image loads', await d.evaluate(() => { const i = document.querySelector('[data-testid=image-ecg] img'); return !!i && i.complete && i.naturalWidth > 0; }));
  await d.getByTestId('image-ecg').click(); await d.waitForTimeout(200);
  ok('result image zooms', (await d.getByTestId('image-zoom').count()) === 1);
  await d.getByTestId('image-zoom').click();
  await tab(d, 'รักษา').click(); await d.waitForTimeout(200);
  const txt = await d.getByTestId('action-tab').innerText();
  ok('right, wrong and branch options are offered', txt.includes('ให้ aspirin') && txt.includes('ให้ pethidine') && txt.includes('กลับบ้าน'));
  ok('timer branch is not offered', !txt.includes('แย่ลง'));
  await d.getByRole('button', { name: 'กลับบ้าน' }).click(); await d.getByTestId('finish-case').waitFor();
  ok('a harmful branch ends badly with a slip', (await d.getByTestId('finish-case').innerText()).includes('แย่ลง') && (await d.getByTestId('slip-count').count()) === 1);

  ok('no page errors', errs.length === 0, errs.slice(0, 4).join(' || '));
  await b.close();
  console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.log('CRASH', e.message.slice(0, 400)); process.exit(1); });
