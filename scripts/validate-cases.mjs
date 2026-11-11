#!/usr/bin/env node
/**
 * Validates every case file in public/locales/<lang>/.
 *
 * Errors (exit 1): broken edges, missing start node, unreachable endings,
 * a start node with no options, distractors without a label or feedback,
 * a distractor whose label matches a correct step in the same case.
 * Warnings: required steps with no distractors (the step becomes a one-button click),
 * unreachable nodes.
 *
 * Usage: npm run validate
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "locales");
let errors = 0;
let warnings = 0;
const err = (f, m) => { errors++; console.log(`ERROR ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`warn  ${f}: ${m}`); };

for (const lang of readdirSync(root)) {
  for (const file of readdirSync(join(root, lang)).filter((f) => /^case_.*\.json$/.test(f))) {
    const name = `${lang}/${file}`;
    let data;
    try {
      data = JSON.parse(readFileSync(join(root, lang, file), "utf8"));
    } catch (e) {
      err(name, `invalid JSON: ${e.message}`);
      continue;
    }
    const g = data.managementGraph;
    if (!g?.nodes) { err(name, "no managementGraph.nodes"); continue; }

    // Normalise both graph styles to id -> { type, label, distractors, out[] }
    const nodes = new Map();
    if (Array.isArray(g.nodes)) {
      for (const n of g.nodes) {
        if (nodes.has(n.id)) err(name, `duplicate node id ${n.id}`);
        nodes.set(n.id, { type: n.type, label: n.data?.label ?? "", distractors: n.data?.distractors ?? [], out: [] });
      }
      for (const e of g.edges ?? []) {
        if (!nodes.has(e.source)) err(name, `edge ${e.id} source ${e.source} missing`);
        if (!nodes.has(e.target)) err(name, `edge ${e.id} target ${e.target} missing`);
        nodes.get(e.source)?.out.push(e.target);
      }
    } else {
      for (const [id, n] of Object.entries(g.nodes)) {
        nodes.set(id, { type: n.type, label: "", distractors: [], out: (n.options ?? []).map((o) => o.targetNode) });
      }
      for (const [id, n] of nodes) for (const t of n.out) if (!nodes.has(t)) err(name, `option ${id} -> ${t} missing`);
    }

    const start = nodes.has("start") ? "start" : nodes.has("start1") ? "start1"
      : [...nodes.keys()].find((id) => nodes.get(id).type === "start" || id.toLowerCase().includes("start"));
    if (!start) { err(name, "no start node"); continue; }
    if (nodes.get(start).out.length === 0) err(name, "start node has no options");

    const seen = new Set();
    const stack = [start];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id) || !nodes.has(id)) continue;
      seen.add(id);
      stack.push(...nodes.get(id).out);
    }
    const unreachable = [...nodes.keys()].filter((id) => !seen.has(id));
    if (unreachable.length) warn(name, `unreachable nodes: ${unreachable.join(", ")}`);
    if (![...seen].some((id) => nodes.get(id).out.length === 0)) err(name, "no reachable ending");

    const correctLabels = new Set([...nodes.values()].map((n) => n.label.trim().toLowerCase()).filter(Boolean));
    for (const [id, n] of nodes) {
      if (n.type !== "required") continue;
      if (!n.distractors.length) {
        warn(name, `${id} has no distractors (one-button step)`);
        continue;
      }
      for (const d of n.distractors) {
        if (!d?.label?.trim() || !d?.feedback?.trim()) err(name, `${id} has a distractor without label or feedback`);
        else if (correctLabels.has(d.label.trim().toLowerCase())) err(name, `${id} distractor "${d.label}" is also a correct step in this case`);
      }
    }
  }
}

// Review patients take a name of the right sex from lib/review.ts, which keeps its own copy of each case's sex
{
  const review = readFileSync(join(root, "..", "..", "lib", "review.ts"), "utf8");
  for (const file of readdirSync(join(root, "en")).filter((f) => /^case_.*\.json$/.test(f))) {
    const id = file.slice(0, -5);
    const sex = JSON.parse(readFileSync(join(root, "en", file), "utf8")).sex;
    const m = review.match(new RegExp(`\\b${id}: "([MF])"`));
    if (!m) err(`lib/review.ts`, `no sex for ${id}`);
    else if (m[1] !== sex) err(`lib/review.ts`, `${id} is ${m[1]} but the case says ${sex}`);
  }
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
