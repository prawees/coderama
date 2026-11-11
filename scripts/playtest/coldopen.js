// The cold open's defib steps, shared by the bots: drag both pads onto the chest, call everyone clear, shock.
/** Drag a pad from the tray to a point on the page, the way a finger would */
async function dragTo(p, from, to) {
  await p.mouse.move(from.x, from.y);
  await p.mouse.down();
  await p.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await p.mouse.move(to.x, to.y, { steps: 4 });
  await p.mouse.up();
  await p.waitForTimeout(250);
}
const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

/** Put pad `pad` on zone `zone` (0 under the right collarbone, 1 left side under the armpit) */
async function placePad(p, pad, zone) {
  const from = centre(await p.getByTestId(`pad-${pad}`).boundingBox());
  const to = centre(await p.getByTestId(`pad-zone-${zone}`).boundingBox());
  await dragTo(p, from, to);
}

/** From the pads step to the shock: both pads, everyone clear, wait for the button, shock */
async function padsClearShock(p) {
  await p.getByTestId('cold-open-pads').waitFor();
  await placePad(p, 0, 0);
  await placePad(p, 1, 1);
  await p.getByTestId('cold-open-clear').waitFor({ timeout: 8000 });
  await p.getByTestId('cold-open-clear').click();
  await p.getByTestId('cold-open-shock').waitFor({ timeout: 4000 });
  await p.getByTestId('cold-open-shock').click({ force: true });
}

module.exports = { dragTo, placePad, padsClearShock, centre };
