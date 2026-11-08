// What brings friends in: the link preview, the cold-open challenge link, invites, and the feedback form.
// Feedback needs the emulators (see account.js in CLAUDE.md); with FEEDBACK=0 it is skipped. Exits 1 if a check fails.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/growth'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
const KEY = 'CapacitorStorage.code-rama-storage';
let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

async function fresh(b, { touch = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: touch, isMobile: touch });
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  await p.addInitScript(() => {
    delete Navigator.prototype.vibrate;
    // Record what the game hands to the phone's share sheet instead of opening one
    window.__shared = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => { window.__shared.push(d); } });
  });
  p.errors = [];
  p.on('pageerror', (e) => { if (!/#(418|423|425)\b/.test(String(e))) p.errors.push(String(e)); });
  return p;
}

/** Play the cold open through to the title, pressing at about 110 a minute */
async function playColdOpen(p) {
  await p.getByTestId('cold-open-right').waitFor();
  await p.getByTestId('cold-open-right').click();
  const press = async (until) => {
    for (let n = 0; n < 30 && !(await p.getByTestId(until).count()); n++) { await p.getByTestId('cold-open-press').click({ force: true }).catch(() => {}); await p.waitForTimeout(545); }
  };
  await press('cold-open-shock');
  await p.getByTestId('cold-open-shock').click({ force: true });
  await p.getByTestId('cold-open-press').waitFor();
  await press('cold-open-later');
  await p.getByTestId('cold-open-rosc').waitFor();
}

(async () => {
  const b = await chromium.launch(LAUNCH);

  // 1. What LINE and Messenger read from the page
  {
    const html = await (await fetch(BASE + '/')).text();
    const meta = (prop) => (html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`)) || [])[1];
    const img = meta('og:image');
    check(!!meta('og:title') && /Code Rama/.test(meta('og:title')), 'og:title', meta('og:title'));
    check(!!meta('og:description') && /นศพ/.test(meta('og:description')), 'og:description is Thai', (meta('og:description') || '').slice(0, 60));
    check(!!img && /^https:\/\//.test(img) && /og\.jpg$/.test(img), 'og:image is an absolute address', img);
    const local = await fetch(BASE + '/og.jpg');
    check(local.ok && (local.headers.get('content-type') || '').includes('image/jpeg'), 'the preview picture is served', String(local.status));
    check(meta('twitter:card') === 'summary_large_image', 'large card on X');
  }

  // 2. A new player finishes the cold open and challenges a friend
  let link = null;
  {
    const p = await fresh(b);
    await p.goto(BASE + '/');
    await p.locator('text=แตะเพื่อเริ่ม').click({ force: true });
    await playColdOpen(p);
    const score = await p.getByTestId('cold-open-score').innerText();
    check(/ROSC ใน \d+\.\d วินาที CPR ตรงจังหวะ \d+%/.test(score), 'the score shows at ROSC', score);
    check(!(await p.getByTestId('challenge-verdict').count()), 'no verdict without a challenge');
    await p.screenshot({ path: `${OUT}/1_score.png` });
    await p.getByTestId('cold-open-next').click();
    await p.getByTestId('challenge-share').waitFor();
    await p.waitForTimeout(2200);
    await p.screenshot({ path: `${OUT}/2_title_challenge.png` });
    await p.getByTestId('challenge-share').click();
    await p.waitForTimeout(300);
    const shared = await p.evaluate(() => window.__shared);
    link = shared[0]?.url;
    check(!!link && /\/\?vf=\d+\.\d&cpr=\d+$/.test(link), 'the challenge link carries the score (no name before setup)', link);
    check(/คุณจะเร็วกว่าไหม/.test(shared[0]?.text || ''), 'with a line that dares the friend', shared[0]?.text);
    check(await p.getByTestId('challenge-note').innerText() === 'ส่งแล้ว', 'the player is told it went');
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  // 3. The friend opens it, sees the dare, plays and gets a verdict, and can dare back
  if (link) {
    // The same dare on this server, as if สมาร์ท had sent it
    const url = BASE + '/?' + link.split('?')[1] + '&n=' + encodeURIComponent('สมาร์ท');
    const p = await fresh(b);
    await p.goto(url);
    await p.getByTestId('challenge-splash').waitFor();
    const splash = await p.getByTestId('challenge-splash').innerText();
    check(/สมาร์ทท้าคุณ!/.test(splash), 'the splash names who sent the dare', splash.replace(/\n/g, ' / '));
    await p.screenshot({ path: `${OUT}/3_splash.png` });
    await p.locator('text=แตะเพื่อรับคำท้า').click({ force: true });
    await p.getByTestId('challenge-banner').waitFor();
    check(/สมาร์ทท้าคุณ/.test(await p.getByTestId('challenge-banner').innerText()), 'the dare stays on screen in the resus');
    await p.screenshot({ path: `${OUT}/4_banner.png` });
    await playColdOpen(p);
    const v = await p.getByTestId('challenge-verdict').innerText();
    check(/(เร็วกว่า|ช้ากว่า|เสมอกับ|เวลาเท่า)สมาร์ท/.test(v), 'a verdict against the friend', v);
    await p.screenshot({ path: `${OUT}/5_verdict.png` });
    await p.getByTestId('cold-open-next').click();
    await p.getByTestId('challenge-share').waitFor();
    check((await p.getByTestId('challenge-share').innerText()).includes('ท้ากลับ'), 'and can dare back');
    await p.getByTestId('cold-open-start').click({ force: true });
    await p.waitForTimeout(800);
    check(!/vf=/.test(p.url()), 'the dare leaves the address bar afterwards', p.url());
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  // 4. A returning player opening a dare still gets it, and their name goes on the dare back
  if (link) {
    const p = await fresh(b);
    const st = { ...seed, state: { ...seed.state, playerName: 'ต้นข้าว', currentDay: 4, tutorialCompleted: true } };
    await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
    await p.goto(BASE + '/?vf=40&cpr=70');
    await p.getByTestId('challenge-splash').waitFor({ timeout: 8000 }).catch(() => {});
    check(await p.getByTestId('challenge-splash').count() > 0, 'a player with a save is not sent past the dare');
    await p.locator('text=แตะเพื่อรับคำท้า').click({ force: true });
    await playColdOpen(p);
    await p.getByTestId('cold-open-next').click();
    await p.getByTestId('challenge-share').click();
    await p.waitForTimeout(300);
    const shared = await p.evaluate(() => window.__shared);
    check(/[?&]n=%E0%B8%95/.test(shared[0]?.url || ''), 'the dare back carries their name', shared[0]?.url);
    await p.getByTestId('cold-open-start').click({ force: true });
    await p.getByTestId('continue').waitFor({ timeout: 8000 }).catch(() => {});
    check(await p.getByTestId('continue').count() > 0, 'then back to their own game, not setup');
    await p.context().close();
  }

  // 5. Nonsense in the link is ignored
  {
    const p = await fresh(b);
    await p.goto(BASE + '/?vf=-3&cpr=abc&n=<script>');
    await p.locator('text=แตะเพื่อเริ่ม').waitFor();
    check(!(await p.getByTestId('challenge-splash').count()), 'a broken dare is ignored');
    await p.context().close();
  }

  // 6. Invite from settings, on a computer without a share sheet: the link is copied
  {
    const p = await fresh(b, { touch: false });
    await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await p.addInitScript(() => { Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }); });
    const st = { ...seed, state: { ...seed.state, currentDay: 2, tutorialCompleted: true } };
    await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
    await p.goto(BASE + '/');
    await p.locator('text=ตั้งค่า').first().click();
    await p.getByTestId('invite-friends').click();
    await p.waitForTimeout(400);
    const clip = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    check(/Code Rama/.test(clip) && /https?:\/\//.test(clip), 'invite copies a message with the link', clip.replace(/\n/g, ' / '));
    await p.screenshot({ path: `${OUT}/6_settings.png` });

    // 7. Feedback from settings (needs the emulator build)
    if (process.env.FEEDBACK !== '0') {
      await p.getByTestId('open-feedback').click();
      await p.getByTestId('feedback').waitFor();
      check((await p.getByTestId('feedback-send').innerText()).includes('เลือกหัวใจก่อน'), 'asks for hearts before sending');
      await p.getByTestId('feedback-heart-4').click();
      await p.getByTestId('feedback-likes').locator('button', { hasText: 'แมว' }).click();
      await p.getByTestId('feedback-fixes').locator('button', { hasText: 'ตัวหนังสือเยอะ' }).click();
      await p.getByTestId('feedback-text').fill('น้องแมวน่ารักมาก อยากให้มีเคส snake bite');
      await p.screenshot({ path: `${OUT}/7_feedback.png` });
      await p.getByTestId('feedback-send').click();
      await p.getByTestId('feedback-sent').waitFor({ timeout: 10000 }).catch(() => {});
      check(await p.getByTestId('feedback-sent').count() > 0, 'feedback sends', await p.getByTestId('feedback-failed').innerText().catch(() => ''));
    }
    await p.context().close();
  }

  // 8. The summary asks once after the first shift
  if (process.env.FEEDBACK !== '0') {
    const p = await fresh(b);
    const st = { ...seed, state: { ...seed.state, currentDay: 2, tutorialCompleted: true, shiftStats: { casesTreated: 3, xpEarned: 120, cashEarned: 90, patients: [], spawned: [], midPlayed: [] } } };
    await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); localStorage.setItem('coderama.coldOpenSeen', '1'); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
    await p.goto(BASE + '/summary');
    await p.getByTestId('feedback-ask').waitFor({ timeout: 8000 }).catch(() => {});
    check(await p.getByTestId('feedback-ask').count() > 0, 'the day 1 summary asks for hearts');
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/8_summary_ask.png` });
    await p.getByTestId('feedback-ask').getByTestId('feedback-heart-5').click();
    await p.getByTestId('feedback').waitFor();
    check(await p.getByTestId('feedback').getByTestId('feedback-heart-5').count() > 0, 'the form opens with that rating');
    await p.getByTestId('feedback-send').click();
    await p.getByTestId('feedback-sent').waitFor({ timeout: 10000 }).catch(() => {});
    check(await p.getByTestId('feedback-sent').count() > 0, 'a heart and one tap is enough to send');
    await p.reload(); await p.waitForTimeout(3000);
    check(!(await p.getByTestId('feedback-ask').count()), 'it does not ask twice');
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
