// Plays the board requests and a birthday the way a player does: tap the person on screen, pick from the menu.
// Needs a running export (see CLAUDE.md). Exits 1 if a check fails.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const LAUNCH = { args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'], ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}) };
const BASE = process.env.BASE_URL || 'http://localhost:8765';
const fs = require('fs');
const OUT = __dirname + '/out/requests'; if (!process.env.ONLY) fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const seed = JSON.parse(fs.readFileSync(__dirname + '/seed-state.json', 'utf8'));
const KEY = 'CapacitorStorage.code-rama-storage';

const GIFT_ID = Object.fromEntries([...fs.readFileSync(__dirname + '/../../lib/gifts.ts', 'utf8').matchAll(/id: "(\w+)", name: \{ en: "[^"]*", th: "([^"]*)"/g)].map((m) => [m[2], m[1]]));

const GIFT_COST = Object.fromEntries([...fs.readFileSync(__dirname + '/../../lib/gifts.ts', 'utf8').matchAll(/id: "(\w+)".*?cost: (\d+)/g)].map((m) => [m[1], +m[2]]));
const want = (tag) => !process.env.ONLY || process.env.ONLY === tag;
const NAME = { ann: 'แอน', bob: 'บ๊อบ', somchai: 'สมชาย', cat: 'ขนม' };

let fails = 0;
const check = (ok, what, extra = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}${extra ? ' | ' + extra : ''}`); if (!ok) fails++; };

async function open(b, day, extra = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(String(e)));
  const st = { ...seed, state: { ...seed.state, currentDay: day, shiftMode: 'off-duty', clockMinutes: 0, activeCases: [], tutorialCompleted: true,
    energy: 100, currency: 500, activeQuests: [], completedQuests: ['q_first_shift', 'q_kanom', 'q_social_butterfly', 'q_favourite', 'q_gear_up'], friendships: {}, npcDaily: {}, propDaily: {}, gifts: {}, requestsDone: [], heartEventsSeen: [],
    storyFlags: { FIRST_SHIFT_TIP: true }, shiftStats: { casesTreated: 0, xpEarned: 0, cashEarned: 0, patients: [], spawned: [], midPlayed: [] }, ...extra } };
  await p.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [KEY, JSON.stringify(st)]);
  await p.goto(BASE + '/hub');
  await p.waitForFunction(() => window.__codeRamaWorld && window.__codeRamaWorld.actors().length > 1);
  await clearStory(p);
  return p;
}

/** Click through whatever scene is showing, without choosing anything that matters to the test */
async function clearStory(p) {
  await p.waitForTimeout(800);
  for (let i = 0; i < 80 && await p.getByTestId('dialogue').count(); i++) {
    const ch = p.getByTestId('dialogue-choices').locator('button');
    if (await ch.count()) await ch.last().click({ force: true });
    else await p.getByTestId('dialogue').click({ force: true });
    await p.waitForTimeout(250);
  }
}

const save = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)).state, KEY);
/** Where a world point is in the page, and whether a tap there would reach the world */
const canvasPoint = (p, pt) => p.evaluate((pt) => {
  const r = document.querySelector('canvas').getBoundingClientRect();
  const x = r.left + pt.x, y = r.top + pt.y;
  const on = x > r.left + 8 && x < r.right - 8 && y > r.top + 8 && y < r.bottom - 8;
  return { x, y, on, clear: on && document.elementFromPoint(x, y)?.tagName === 'CANVAS', edge: { l: r.left + 24, r: r.right - 24, t: r.top + 90, b: r.bottom - 24 } };
}, pt);
const playerTile = (p) => p.evaluate(() => window.__codeRamaWorld.actors().find((a) => a.id === 'player').tile);

/** The camera follows the player, so someone across the room is off screen: tap floor on that side and walk */
async function walkToward(p, pt) {
  const from = await playerTile(p);
  for (const dy of [0, -64, 64, -128, 128, -192, 192]) {
    const x = Math.min(pt.edge.r, Math.max(pt.edge.l, pt.x));
    const y = Math.min(pt.edge.b, Math.max(pt.edge.t, pt.y + dy));
    // A floor tap must not land on someone else, or it starts the wrong conversation
    const blocked = await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.tagName !== 'CANVAS'
      || window.__codeRamaWorld.actors().some((a) => a.id !== 'player' && Math.hypot(a.x - x, a.y - y) < 50), [x, y]);
    if (blocked) continue;
    await p.mouse.click(x, y);
    await p.waitForTimeout(1200);
    const now = await playerTile(p);
    if (now.x !== from.x || now.y !== from.y) return true;
  }
  return false;
}

/** Tap a spot in the world until `done` is true, walking closer first when it is out of reach */
async function tapWorld(p, where, done) {
  for (let i = 0; i < 40; i++) {
    if (await done()) return true;
    // Walking past a prop can open something else: close it and carry on
    if (await p.getByTestId('dialogue').count()) { await clearStory(p); continue; }
    const w = await where();
    if (!w) return false;
    const pt = await canvasPoint(p, w);
    if (process.env.TRACE) console.log('  try', i, JSON.stringify({ w: [w.x, w.y], on: pt.on, clear: pt.clear, me: await playerTile(p), hit: await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className?.toString().slice(0, 50), [pt.x, pt.y]) }));
    if (!pt.on) { await walkToward(p, pt); continue; }
    // Under a D-pad key: walk up to it and use A, as a player would
    if (!pt.clear) {
      await walkToward(p, pt);
      if (await p.getByTestId('world-prompt').count()) await p.getByTestId('action').click({ force: true });
      await p.waitForTimeout(500);
      continue;
    }
    await p.mouse.click(pt.x, pt.y);
    for (let t = 0; t < 6 && !(await done()); t++) await p.waitForTimeout(500);
  }
  const shot = `${OUT}/gave_up_${Date.now()}.png`;
  await p.screenshot({ path: shot });
  console.log('  gave up:', shot, JSON.stringify(await p.evaluate(() => window.__codeRamaWorld?.actors())));
  return false;
}

/** Tap someone in the world until they answer. They wander, and the HUD can cover them for a moment. */
const tapActor = (p, id) => tapWorld(p,
  () => p.evaluate((id) => window.__codeRamaWorld.actors().find((x) => x.id === id), id),
  async () => (await p.getByTestId('dialogue-speaker').innerText({ timeout: 300 }).catch(() => '')).includes(NAME[id]));

/** Tap someone and wait until the whole line has typed out, so the menu is showing */
async function talkTo(p, id) {
  if (!await tapActor(p, id)) return false;
  await p.getByTestId('dialogue').click({ force: true });
  await p.waitForTimeout(400);
  return true;
}

/** Finish the conversation, ignoring any gift menu */
async function closeTalk(p) { await clearStory(p); }

async function pick(p, text) {
  const btn = p.getByTestId('dialogue-choices').locator('button').filter({ hasText: text });
  await btn.first().waitFor();
  await btn.first().click({ force: true });
  await p.waitForTimeout(400);
}

async function menu(p) {
  await p.getByTestId('dialogue-choices').waitFor();
  return (await p.getByTestId('dialogue-choices').locator('button').allInnerTexts()).map((t) => t.replace('▸', '').trim());
}

async function goal(p) {
  await p.getByRole('button', { name: 'quests' }).click({ force: true });
  await p.waitForTimeout(500);
  const text = (await p.getByTestId('daily-request').innerText()).replace(/\n/g, ' / ');
  await p.getByRole('button', { name: 'close' }).first().click({ force: true });
  await p.getByRole('button', { name: 'close' }).waitFor({ state: 'detached' });
  await p.waitForTimeout(400);
  return text;
}

(async () => {
  const b = await chromium.launch(LAUNCH);

  // Day 2: Ann wants a gift. Buy it at the supply closet, carry three other kinds, hand it over.
  if (want('gift')) {
    const others = { thai_tea: 3, energy_drink: 3, durian: 3, orchid: 2 };
    const p = await open(b, 2, { gifts: others });
    const asked = await goal(p);
    console.log('day 2:', asked);
    const m = /เอา(.+?)ไปให้/.exec(asked);
    check(!!m, 'day 2 is a gift request');
    const giftName = m[1];
    await p.screenshot({ path: `${OUT}/0_before_walk.png` });
    const reached = await tapWorld(p, () => p.evaluate(() => window.__codeRamaWorld?.tileToScreen(14, 7)), async () => p.url().includes('/hub/shop'));
    check(reached, 'walked to the supply closet and it opened');
    const giftId = GIFT_ID[giftName];
    check(!others[giftId], `the bag holds four other kinds, not ${giftId}`);
    const cashBefore = (await save(p)).currency;
    await p.screenshot({ path: `${OUT}/1_shop.png` });
    await p.getByTestId(`buy-${giftId}`).click({ force: true }); await p.waitForTimeout(400);
    const afterBuy = await save(p);
    const cost = GIFT_COST[giftId];
    check(afterBuy.currency === cashBefore - cost, `bought ${giftName} at its price`, `${cashBefore} -> ${afterBuy.currency}`);
    await p.goBack(); await p.waitForFunction(() => window.__codeRamaWorld && window.__codeRamaWorld.actors().length > 1);
    await clearStory(p);

    check(await talkTo(p, 'bob'), 'tapped Bob and he answered');
    await closeTalk(p);
    check(!(await save(p)).requestsDone.includes(2), 'talking to the wrong person does not complete it');

    check(await talkTo(p, 'ann'), 'tapped Ann and she answered');
    const list = await menu(p);
    console.log('  menu:', JSON.stringify(list));
    check(list.some((t) => t.includes(giftName)), 'the requested gift is in the menu with five kinds owned');
    check(list[0].includes(giftName), 'the requested gift is on top');
    await p.screenshot({ path: `${OUT}/2_gift_menu.png` });
    const before = await save(p);
    await pick(p, giftName);
    const after = await save(p);
    await p.screenshot({ path: `${OUT}/3_gift_given.png` });
    check(after.requestsDone.includes(2), 'request done');
    check(after.currency === before.currency + cost * 2 + 40, 'request paid twice the price plus 40', `${before.currency} -> ${after.currency}`);
    check((after.friendships.ann || 0) >= (before.friendships.ann || 0) + 18, 'friendship rose by the gift plus the request', `${before.friendships.ann || 0} -> ${after.friendships.ann}`);
    check((after.gifts[giftId] ?? 0) === 0, 'the gift left the bag');
    await closeTalk(p);
    const shown = await goal(p);
    console.log('  after:', shown);
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  // Day 5: Bob's birthday. A loved gift counts three times, Ann is off the floor.
  if (want('birthday')) {
    const p = await open(b, 5, { gifts: { coffee: 1, garland: 1 } });
    const ids = await p.evaluate(() => window.__codeRamaWorld.actors().map((a) => a.id));
    check(!ids.includes('ann'), 'Ann is not on the floor on day 5', ids.join(','));
    check(await talkTo(p, 'bob'), 'tapped Bob on his birthday');
    const line = await p.getByTestId('dialogue-text').innerText();
    check(line.includes('วันเกิด'), 'he mentions it', line);
    await pick(p, 'กาแฟ');
    const st = await save(p);
    check(st.friendships.bob === 2 + 48, 'loved birthday gift is 16 x 3 plus 2 for talking', String(st.friendships.bob));
    let cake = '';
    for (let i = 0; i < 8 && !cake.includes('ของขวัญวันเกิด'); i++) {
      await p.getByTestId('dialogue').click({ force: true }).catch(() => {});
      await p.waitForTimeout(500);
      cake = await p.getByTestId('dialogue-text').innerText().catch(() => cake);
    }
    check(cake.includes('ของขวัญวันเกิด'), 'the birthday line shows', cake);
    await p.screenshot({ path: `${OUT}/4_birthday.png` });
    await closeTalk(p);
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();

    const q = await open(b, 5, { gifts: { garland: 1 } });
    check(await talkTo(q, 'bob'), 'tapped Bob again, with a gift he hates');
    await pick(q, 'พวงมาลัย');
    check((await save(q)).friendships.bob === 2 - 8, 'a hated gift is not tripled', String((await save(q)).friendships.bob));
    await q.context().close();
  }

  // Day 4: say hello to all three. The third hello completes it.
  if (want('social')) {
    const p = await open(b, 4);
    console.log('day 4:', await goal(p));
    for (const [i, id] of ['ann', 'bob', 'somchai'].entries()) {
      check(await talkTo(p, id), `tapped ${id}`);
      await closeTalk(p);
      const done = (await save(p)).requestsDone.includes(4);
      check(done === (i === 2), `after ${i + 1} of 3 the request is ${done ? 'done' : 'open'}`);
    }
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  // Day 6: the cat will not eat. Give it dried fish.
  if (want('cat')) {
    const p = await open(b, 6, { gifts: { dried_fish: 1, coffee: 5 } });
    console.log('day 6:', await goal(p));
    check(await talkTo(p, 'cat'), 'tapped the cat');
    const list = await menu(p);
    check(list[0].includes('ปลาแห้ง'), 'the fish is on top of the menu', JSON.stringify(list));
    await pick(p, 'ปลาแห้ง');
    const st = await save(p);
    check(st.requestsDone.includes(6), 'request done');
    await p.screenshot({ path: `${OUT}/5_cat.png` });
    check(p.errors.length === 0, 'no page errors', p.errors.join(' '));
    await p.context().close();
  }

  // All ten kinds: the menu must scroll rather than run off the phone
  if (want('menu')) {
    const gifts = Object.fromEntries(['thai_tea', 'coffee', 'khanom_krok', 'mango_sticky_rice', 'garland', 'orchid', 'energy_drink', 'handbook', 'durian', 'dried_fish'].map((g) => [g, 1]));
    const p = await open(b, 3, { gifts });
    check(await talkTo(p, 'bob'), 'tapped Bob holding every kind of gift');
    const list = await menu(p);
    check(list.length === 11, 'all ten kinds and the way out are listed', String(list.length));
    const box = await p.getByTestId('dialogue-choices').evaluate((el) => ({ scrolls: el.scrollHeight > el.clientHeight, bottom: el.getBoundingClientRect().bottom, h: innerHeight, top: document.querySelector('[data-testid=dialogue]').getBoundingClientRect().top }));
    check(box.bottom <= box.h && box.top >= 0, 'the dialogue stays on the screen', JSON.stringify(box));
    await p.screenshot({ path: `${OUT}/6_all_gifts.png` });
    await p.getByTestId('dialogue-choices').locator('button').last().scrollIntoViewIfNeeded();
    await p.getByTestId('dialogue-choices').locator('button').last().click();
    await p.waitForTimeout(400);
    check(!(await p.getByTestId('dialogue').count()), 'the way out is reachable');
    await p.context().close();
  }

  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nall checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
