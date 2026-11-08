// The first minute and the share cards: cold open, one-screen setup, returning player, summary and chapter screens,
// and every Story card with awkward data. Pictures of each card land in out/hook. Exits 1 if a check fails.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/hook'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
const KEY = 'CapacitorStorage.code-rama-storage';
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

async function fresh(b, size = { width: 390, height: 844 }) {
  const ctx = await b.newContext({ viewport: size, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  // Behave like Safari on iPhone, which has no vibration API: a tap must never depend on it
  await p.addInitScript(() => { delete Navigator.prototype.vibrate; });
  p.errors = [];
  // React 418/423/425: a page loaded directly can race the saved game during hydration and recovers by itself.
  // Players reach these screens by navigating inside the game, so only other errors count.
  p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) p.errors.push(String(e)); });
  return p;
}

async function seeded(b, state, size) {
  const p = await fresh(b, size);
  const st = { ...seed, state: { ...seed.state, shiftMode: 'off-duty', clockMinutes: 0, activeCases: [], tutorialCompleted: true, energy: 100, currency: 500,
    activeQuests: [], completedQuests: ['q_first_shift', 'q_kanom', 'q_social_butterfly', 'q_favourite', 'q_gear_up'], storyFlags: { FIRST_SHIFT_TIP: true },
    shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0, patients: [], spawned: [], midPlayed: [] }, ...state } };
  await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
  return p;
}

/** Saves the picture the sheet is showing and checks it is a full-size Story */
async function grabCard(p, name) {
  await p.getByTestId('share-image').waitFor({ timeout: 20000 });
  const info = await p.getByTestId('share-image').evaluate(async (img) => {
    const blob = await (await fetch(img.src)).blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = ''; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
    return { w: img.naturalWidth, h: img.naturalHeight, type: blob.type, data: btoa(bin) };
  });
  fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(info.data, 'base64'));
  check(info.w === 1080 && info.h === 1920 && info.type === 'image/png', `${name} is a 1080x1920 PNG`, `${info.w}x${info.h}`);
  await p.screenshot({ path: `${OUT}/${name}_sheet.png` });
}

const LONG = 'กิตติพิชญ์ภูมิวัฒน';

(async () => {
  const b = await chromium.launch(LAUNCH);

  // A new player, start to first shift
  {
    const p = await fresh(b);
    const t0 = Date.now();
    await p.goto(BASE + '/');
    await p.locator('text=แตะเพื่อเริ่ม').waitFor();
    await p.locator('text=แตะเพื่อเริ่ม').click({ force: true });
    await p.getByTestId('cold-open').waitFor();
    console.log(`  in the resus ${((Date.now() - t0) / 1000).toFixed(1)} s after the page opened`);
    await p.getByTestId('cold-open-wrong').first().waitFor();
    await p.screenshot({ path: `${OUT}/co_1_order.png` });
    await p.getByTestId('cold-open-wrong').first().click();
    const why = await p.getByTestId('cold-open-line').getAttribute('data-text');
    check(why.includes('atropine'), 'a wrong order is corrected, not failed', why);
    await p.screenshot({ path: `${OUT}/co_2_wrong.png` });
    await p.getByTestId('cold-open-right').click();
    // Far too fast: coached to slow down, and it still counts a little; nothing to start over
    for (let i = 0; i < 6; i++) { await p.getByTestId('cold-open-press').click({ force: true }); await p.waitForTimeout(150); }
    await p.waitForTimeout(400);
    const told = await p.getByTestId('cold-open-line').getAttribute('data-text');
    check(/ช้าลง/.test(told) && /recoil/.test(told), 'too fast is coached to slow down', told);
    check(await p.getByTestId('cold-open-press').count() === 1, 'and never sent back to start over');
    await p.screenshot({ path: `${OUT}/co_2b_too_fast.png` });
    // Then about 110 a minute, a little uneven like real hands, until the shock is ready
    const press = async (until, max) => {
      let n = 0;
      for (; n < max && !(await p.getByTestId(until).count()); n++) { await p.getByTestId('cold-open-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(n % 2 ? 500 : 560); }
      return n;
    };
    const steady = await press('cold-open-shock', 20);
    check(steady <= 8, 'a steady rhythm gets there in a handful of presses', `${steady} more presses`);
    await p.screenshot({ path: `${OUT}/co_2c_steady.png` });
    await p.getByTestId('cold-open-shock').waitFor();
    await p.screenshot({ path: `${OUT}/co_3_shock.png` });
    await p.getByTestId('cold-open-shock').click({ force: true });
    await p.getByTestId('cold-open-press').waitFor();
    check((await p.getByTestId('cold-open-line').innerText()).includes('กดต่อ'), 'back on the chest straight after the shock');
    const second = await press('cold-open-later', 20);
    check(second <= 6, 'after the shock, a few presses', `${second}`);
    await p.getByTestId('cold-open-later').waitFor();
    await p.getByTestId('cold-open-rosc').waitFor();
    check((await p.getByTestId('cold-open-HR').innerText()) === '88', 'the monitor shows the pulse back');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/co_4_rosc.png` });
    await p.getByTestId('cold-open-next').click();
    await p.getByTestId('cold-open-start').waitFor();
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/co_5_title.png` });
    await p.getByTestId('cold-open-start').click({ force: true });
    await p.getByTestId('start-game').waitFor();
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/co_6_setup.png` });
    // Year 5 wears the long coat; the rest are shown, locked, with when they open
    await p.getByTestId('customize').click();
    await p.getByTestId('uniform-scrubs').click({ force: true });
    const lockWhy = await p.getByTestId('uniform-note').innerText();
    check(/intern/.test(lockWhy), 'scrubs are locked in year 5 and say when they open', lockWhy);
    check((await p.getByTestId('uniform-gown_long').getAttribute('class')).includes('cozy-btn-sky'), 'year 5 wears the long coat');
    await p.screenshot({ path: `${OUT}/co_7_wardrobe.png` });
    await p.getByRole('button', { name: 'กลับ' }).first().click();
    await p.getByTestId('start-game').waitFor();
    check(await p.locator('select').count() === 1 && await p.locator('input').count() === 1, 'name, gender and school are on one screen');
    await p.locator('input').fill(LONG);
    await p.getByTestId('start-game').click();
    await p.waitForURL('**/hub');
    await p.getByTestId('start-shift').waitFor();
    console.log(`  in the clinic ${((Date.now() - t0) / 1000).toFixed(1)} s after the page opened (bot speed)`);
    check((await p.evaluate(() => localStorage.getItem('coderama.coldOpenSeen'))) === '1', 'the cold open will not replay');
    check(p.errors.length === 0, 'no page errors in the first minute', p.errors.join(' '));
    await p.context().close();
  }

  // Skipping works from the first second
  {
    const p = await fresh(b);
    await p.goto(BASE + '/');
    await p.locator('text=แตะเพื่อเริ่ม').click({ force: true });
    await p.getByTestId('cold-open-skip').click();
    await p.getByTestId('start-game').waitFor();
    check(true, 'the cold open can be skipped');
    await p.context().close();
  }

  // Someone coming back lands on their game
  {
    const p = await seeded(b, { currentDay: 7, xp: 900, lifetimeXp: 900 });
    await p.goto(BASE + '/');
    await p.getByTestId('continue').waitFor({ timeout: 5000 });
    const card = (await p.getByTestId('continue-card').innerText()).replace(/\n/g, ' ');
    check(card.includes('เวร 2/5'), 'the menu says where you are, not how far is left in total', card);
    check(card.length > 30, 'and what is waiting');
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/menu_returning.png` });
    // The opening can be watched again from the menu, and leads back to it
    await p.getByTestId('replay-intro').click();
    await p.getByTestId('cold-open').waitFor();
    await p.getByTestId('cold-open-skip').click();
    await p.getByTestId('continue').waitFor();
    check(true, 'the opening replays from the menu and returns to it');
    await p.context().close();
  }

  // A title must match the chapter, however much XP a save carries
  for (const [day, want, not] of [[3, 'นศพ.', 'extern'], [6, 'Ext.', 'R1'], [12, 'Ext.', 'R'], [16, 'Int.', 'R1'], [28, 'R1', 'R3'], [31, 'อ.', 'ผศ.']]) {
    const p = await seeded(b, { currentDay: day, playerName: 'ต้นข้าว', lifetimeXp: 11000, xp: 11000 });
    await p.goto(BASE + '/hub');
    await p.getByTestId('start-shift').waitFor();
    await p.waitForTimeout(700);
    const desk = await p.locator('.cozy-panel', { hasText: 'XP' }).first().innerText();
    const name = desk.split('\n')[0];
    check(name.startsWith(want) && !name.includes(not + ' '), `day ${day} with 11000 XP reads ${want}`, name);
    if (day <= 30) {
      const bar = await p.getByTestId('chapter-bar').innerText();
      check(/อีก \d+ เวร/.test(bar), `day ${day} shows shifts to the next promotion`, bar);
    }
    if (day === 6) await p.screenshot({ path: `${OUT}/hub_day6.png` });
    await p.context().close();
  }

  // Summary screen and shift cards, including a long name, a long title and an empty shift
  const SHIFTS = [
    { name: 'shift_gold', day: 8, grades: ['clean', 'clean', 'clean'], extra: { savedTotal: 21, goodStreak: 9, bestStreak: 9 }, playerName: 'ต้นข้าว' },
    { name: 'shift_bad_long', day: 13, grades: ['critical', 'minor', 'poor'], extra: { savedTotal: 128, goodStreak: 0 }, playerName: LONG },
    { name: 'shift_empty', day: 2, grades: [], extra: { savedTotal: 0, goodStreak: 0 }, playerName: 'A' },
    { name: 'shift_lovely', day: 21, grades: ['minor', 'clean', 'poor'], extra: { savedTotal: 60, goodStreak: 1 }, playerName: 'มะปราง' },
    { name: 'shift_after_end', day: 33, grades: ['clean', 'minor'], extra: { savedTotal: 96, goodStreak: 2 }, playerName: 'มะปราง' },
  ];
  for (const s of SHIFTS) {
    const cases = ['case_01', 'case_07', 'case_09'];
    const patients = s.grades.map((grade, i) => ({ caseId: cases[i], grade, mistakes: 0 }));
    const p = await seeded(b, { currentDay: s.day, playerName: s.playerName, ...s.extra, shiftStats: { casesTreated: s.grades.length, xpEarned: 250, cashEarned: 120, patients, spawned: [], midPlayed: [] } });
    await p.goto(BASE + '/summary');
    await p.getByTestId('share-shift').waitFor();
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/${s.name}_screen.png` });
    await p.getByTestId('share-shift').click();
    await grabCard(p, s.name);
    if (s.name === 'shift_gold') {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }).catch(() => null), p.getByTestId('share-go').click()]);
      check(!!dl && dl.suggestedFilename().endsWith('.png'), 'without a share sheet the picture is saved instead', dl?.suggestedFilename());
      check(await p.getByTestId('share-note').count() === 1, 'and the player is told what to do next');
      await p.getByTestId('share-close').click();
      check(await p.getByTestId('share-sheet').count() === 0, 'closing the sheet returns to the screen');
    }
    check(p.errors.length === 0, `no page errors on ${s.name}`, p.errors.join(' '));
    await p.context().close();
  }

  // The smallest phone in use: the way home has to stay reachable
  {
    const patients = ['case_01', 'case_07', 'case_09', 'case_15', 'case_08'].map((caseId) => ({ caseId, grade: 'minor', mistakes: 1 }));
    const p = await seeded(b, { currentDay: 8, savedTotal: 12, goodStreak: 3, shiftStats: { casesTreated: 5, xpEarned: 300, cashEarned: 200, patients, spawned: [], midPlayed: [] } }, { width: 320, height: 568 });
    await p.goto(BASE + '/summary');
    await p.getByTestId('summary-next').waitFor();
    await p.waitForTimeout(600);
    await p.getByTestId('summary-next').scrollIntoViewIfNeeded();
    const r = await p.getByTestId('summary-next').boundingBox();
    check(r && r.y + r.height <= 568, 'the summary button is reachable on a 320x568 phone', JSON.stringify(r));
    await p.screenshot({ path: `${OUT}/summary_small.png` });
    await p.context().close();
  }

  // Chapter cards at every break
  for (const day of [6, 11, 16, 26, 31]) {
    const log = Object.fromEntries(['case_01', 'case_02_fluids', 'case_07', 'case_09', 'case_15'].map((c, i) => [c, { day: 1, good: true, letterRead: false, star: i < day % 5 }]));
    const p = await seeded(b, { currentDay: day, playerName: day === 26 ? LONG : 'ต้นข้าว', lifetimeXp: day * 500, xp: day * 500, savedTotal: day * 2, patientLog: log, friendships: day === 11 ? { cat: 30 } : { bob: 80 } });
    await p.goto(BASE + '/summary/year-end');
    await p.getByTestId('share-chapter').waitFor();
    await p.screenshot({ path: `${OUT}/chapter_${day}_screen.png` });
    await p.getByTestId('share-chapter').click();
    await grabCard(p, `chapter_${day}`);
    check(p.errors.length === 0, `no page errors on chapter ${day}`, p.errors.join(' '));
    await p.context().close();
  }

  // Case cards: play to the end in practice, every grade comes from how it was played
  for (const id of (process.env.CASES || 'case_01,case_05_asthma,case_33').split(',')) {
    const p = await seeded(b, { currentDay: 9 });
    await p.goto(`${BASE}/simulator/play/${id}?practice=1`);
    await p.getByRole('button', { name: 'รักษา', exact: true }).click({ force: true });
    for (let s = 0; s < 40 && !(await p.getByTestId('finish-case').count()); s++) {
      if (await p.getByTestId('cpr-minigame').count()) { for (let i = 0; i < 16; i++) { await p.getByTestId('cpr-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(545); } await p.waitForTimeout(1500); continue; }
      const btns = p.getByTestId('action-tab').locator('button.cozy-btn:not(.cozy-btn-berry):not(.cozy-btn-sky)');
      if (!(await btns.count())) { await p.waitForTimeout(300); continue; }
      await btns.first().click({ force: true }); await p.waitForTimeout(350);
    }
    await p.getByTestId('result-stamp').waitFor();
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/case_${id}_result.png` });
    await p.getByTestId('share-case').click();
    await grabCard(p, `case_${id}`);
    check(p.errors.length === 0, `no page errors on ${id}`, p.errors.join(' '));
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
