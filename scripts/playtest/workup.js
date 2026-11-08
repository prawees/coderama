// The case screen asks for a workup and a working diagnosis before treatment (CaseEngineClient, dxGate).
// Bots that play cases call workup() before the treatment tab, and pickDx() whenever diagnosis options show.
const fs = require('fs');
const LOC = __dirname + '/../../public/locales/th/';

/** The answer a case expects: the first entry of its `diagnoses` */
function dxAnswer(caseId) {
  try { return JSON.parse(fs.readFileSync(LOC + caseId + '.json', 'utf8')).diagnoses?.[0] ?? null; } catch { return null; }
}

/** Examine every system, which is enough gathering to unlock the diagnosis */
async function workup(p) {
  await p.getByRole('button', { name: 'PE', exact: true }).click({ force: true }).catch(() => {});
  await p.waitForTimeout(200);
  await p.getByTestId('exam-all').click({ force: true, timeout: 1500 }).catch(() => {});
  await p.waitForTimeout(200);
}

/** Pick a diagnosis: the right one when `right` and the case is known, else the first one not yet tried */
async function pickDx(p, caseId, right = true) {
  const opts = p.getByTestId('dx-option');
  const texts = (await opts.allInnerTexts()).map((t) => t.trim());
  const ans = right && caseId ? dxAnswer(caseId) : null;
  let i = ans ? texts.indexOf(ans) : -1;
  if (i < 0) for (let k = 0; k < texts.length; k++) if (await opts.nth(k).isEnabled()) { i = k; break; }
  if (i < 0) return null;
  await opts.nth(i).click({ force: true });
  await p.waitForTimeout(300);
  return texts[i];
}

module.exports = { dxAnswer, workup, pickDx };
