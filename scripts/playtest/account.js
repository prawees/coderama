// Accounts against the Firebase emulators: sign in, cloud save, a second device, a save conflict,
// the leaderboard row and the security rules. Needs:
//   firebase emulators:start --only auth,firestore --project demo-coderama
//   a build made with NEXT_PUBLIC_FIREBASE_EMULATOR=1 NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-coderama, served on BASE_URL
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const PROJECT = 'demo-coderama';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const fs = require('fs');
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
const KEY = 'CapacitorStorage.code-rama-storage';
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

const owner = { Authorization: 'Bearer owner' };
const asUser = (uid) => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return { Authorization: 'Bearer ' + b64({ alg: 'none', typ: 'JWT' }) + '.' + b64({ sub: uid, user_id: uid, aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`, iat: now, exp: now + 3600, auth_time: now }) + '.' };
};
const getDoc = async (path) => { const r = await fetch(`${FS}/${path}`, { headers: owner }); return r.ok ? r.json() : null; };
const writeAs = async (headers, path, fields) => (await fetch(`${FS}/${path}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }) })).status;
const num = (d, k) => Number(d?.fields?.[k]?.integerValue ?? d?.fields?.[k]?.doubleValue ?? NaN);

async function device(b, state) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  p.errors = [];
  p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) p.errors.push(String(e)); });
  if (state) {
    const st = { ...seed, state: { ...seed.state, shiftMode: 'off-duty', activeCases: [], tutorialCompleted: true, ...state } };
    await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
  } else {
    await p.addInitScript(() => localStorage.setItem('coderama.coldOpenSeen', '1'));
  }
  return p;
}

async function signIn(p, email) {
  await p.goto(BASE + '/login');
  await p.getByTestId('email').fill(email);
  await p.getByTestId('emulator-sign-in').click();
}
const local = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, KEY);

(async () => {
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  const b = await chromium.launch(LAUNCH);

  // Phone A has eight days of progress and signs in for the first time: it goes up
  const a = await device(b, { currentDay: 8, xp: 900, lifetimeXp: 900, playerName: 'ต้นข้าว', university: 'Rama', savedTotal: 21, bestStreak: 6,
    patientLog: { case_01: { day: 1, good: true, star: true }, case_07: { day: 2, good: true, star: false } } });
  await signIn(a, 'tonkao@example.com');
  await a.getByTestId('account-email').waitFor();
  await a.getByText('เซฟในคลาวด์แล้ว').waitFor({ timeout: 20000 });
  await a.screenshot({ path: __dirname + '/out/account_signed_in.png' });
  const saves = await fetch(`${FS}/saves`, { headers: owner }).then((r) => r.json());
  const save = saves.documents?.[0];
  const myUid = save?.name.split('/').pop();
  check(!!save && num({ fields: save.fields.summary.mapValue.fields }, 'day') === 8, 'phone A uploaded its save', myUid);
  const row = await getDoc(`leaderboards/${myUid}`);
  check(row && num(row, 'savedTotal') === 21 && num(row, 'stars') === 1 && row.fields.displayName.stringValue === 'ต้นข้าว', 'and its leaderboard row', JSON.stringify(row?.fields || {}).slice(0, 160));
  check(!JSON.stringify(row || {}).includes('example.com'), 'the leaderboard never holds the email');


  // A fresh phone B signs in to the same account: the game comes down
  const bb = await device(b, null);
  await signIn(bb, 'tonkao@example.com');
  await bb.getByTestId('account-email').waitFor();
  await bb.waitForTimeout(1500);
  const sb = await local(bb);
  check(sb.currentDay === 8 && sb.savedTotal === 21 && sb.playerName === 'ต้นข้าว', 'a new phone gets the cloud save', `day ${sb.currentDay}`);

  // Phone C has its own different game: nothing is overwritten until the player chooses
  const c = await device(b, { currentDay: 3, xp: 200, lifetimeXp: 200, playerName: 'มะปราง', savedTotal: 5 });
  await signIn(c, 'tonkao@example.com');
  await c.getByTestId('keep-cloud').waitFor();
  await c.screenshot({ path: __dirname + '/out/account_conflict.png' });
  const before = await getDoc(`saves/${myUid}`);
  check(num({ fields: before.fields.summary.mapValue.fields }, 'day') === 8, 'the cloud save is untouched while the player decides');
  check((await local(c)).currentDay === 3, 'and so is the phone');
  await c.getByTestId('keep-cloud').click();
  await c.getByTestId('cloud-status').waitFor();
  await c.waitForTimeout(800);
  check((await local(c)).currentDay === 8, 'choosing the cloud save brings day 8 down');

  // Leaving the leaderboard removes the row
  await c.getByTestId('board-toggle').click();
  await c.waitForTimeout(2500);
  check(!(await getDoc(`leaderboards/${myUid}`)), 'opting out of the leaderboard removes the row');
  await c.getByTestId('board-toggle').click();
  await c.waitForTimeout(2500);
  check(!!(await getDoc(`leaderboards/${myUid}`)), 'opting back in restores it');

  // Signing out keeps the game on the phone
  await c.getByTestId('sign-out').click();
  await c.getByTestId('sign-in-google').waitFor();
  check((await local(c)).currentDay === 8, 'signing out keeps the game on the phone');

  // Rules: nobody can write someone else's save or a fake leaderboard row
  const good = { uid: { stringValue: 'mallory' }, displayName: { stringValue: 'M' }, university: { stringValue: 'X' }, day: { integerValue: 5 }, savedTotal: { integerValue: 10 }, stars: { integerValue: 1 }, bestStreak: { integerValue: 1 }, updatedAt: { integerValue: 1 } };
  check(await writeAs({}, 'leaderboards/mallory', good) === 403, 'rules: signed out cannot write the leaderboard');
  check(await writeAs(asUser('mallory'), `leaderboards/${myUid}`, { ...good, uid: { stringValue: myUid } }) === 403, "rules: cannot write someone else's row");
  check(await writeAs(asUser('mallory'), 'leaderboards/mallory', { ...good, savedTotal: { integerValue: 999999 } }) === 403, 'rules: an impossible score is refused');
  check(await writeAs(asUser('mallory'), 'leaderboards/mallory', good) === 200, 'rules: a normal row of your own is accepted');
  check((await fetch(`${FS}/saves/${myUid}`, { headers: asUser('mallory') })).status === 403, "rules: cannot read someone else's save");
  check((await fetch(`${FS}/leaderboards/${myUid}`)).status === 200, 'rules: anyone can read the leaderboard');

  // The leaderboard in the clinic shows both doctors, ranked by patients saved
  const d = await device(b, { currentDay: 8, playerName: 'ต้นข้าว' });
  await d.goto(BASE + '/hub');
  await d.getByTestId('start-shift').waitFor();
  // Walk over to the computer on the desk, then tap it
  for (let i = 0; i < 12 && !(await d.getByTestId('leaderboard').count()); i++) {
    const [tx, ty] = i < 2 ? [5, 5] : [3, 6];
    const at = await d.evaluate(([x, y]) => window.__codeRamaWorld.tileToScreen(x, y), [tx, ty]);
    if (at.x > 10 && at.x < 380) await d.mouse.click(at.x, at.y);
    await d.waitForTimeout(1500);
    for (let k = 0; k < 4 && (await d.getByTestId('dialogue').count()); k++) { await d.getByTestId('dialogue').click({ force: true }); await d.waitForTimeout(300); }
  }
  await d.getByTestId('leaderboard').waitFor({ timeout: 20000 });
  await d.getByTestId('leaderboard-row').first().waitFor({ timeout: 15000 });
  const rows = (await d.getByTestId('leaderboard').innerText()).replace(/\n/g, ' | ');
  check(rows.indexOf('ต้นข้าว') > -1 && rows.indexOf('ต้นข้าว') < rows.indexOf('M |'), 'the clinic leaderboard lists doctors by patients saved', rows.slice(0, 200));
  await d.screenshot({ path: __dirname + '/out/account_leaderboard.png' });

  for (const p of [a, bb, c, d]) check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
