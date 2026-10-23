import { STORY_CAMPAIGN, CutsceneNode } from "@/lib/StoryManager";
import { STORY_CAMPAIGN_TH } from "@/lib/StoryManagerTH";

/**
 * Days 1-10 store their scenes as startOfDayCutscene / endOfDayCutscene.
 * Days 11-31 use startShiftEvents / midShiftEvents / endShiftEvents.
 * Everything in the hub reads a day through this helper so both schemas play,
 * and so Thai players stay in the Thai campaign for branching and mid-shift events.
 */
export interface MidShiftEvent {
  triggerMinute: number;
  cutscene: CutsceneNode[];
  injectCase?: string;
}

export interface DayStory {
  start: CutsceneNode[];
  end: CutsceneNode[];
  mid: MidShiftEvent[];
  cases: string[];
}

/**
 * Clock time the shift starts, in minutes after midnight. The opening scene often names it
 * ("ER รามาเซ็นทรัล 03:12 น."), and the clock should agree with the story. Defaults to 08:00.
 */
/** The first "HH:MM น." in a scene's opening lines, as minutes after midnight */
export function timeInScene(scene: CutsceneNode[]): number | null {
  // Look past an opening flag check, which carries no text worth reading
  for (const n of scene.filter((x) => !x.text?.startsWith("[ROUTER]")).slice(0, 8)) {
    const m = (n.text || "").match(/(\d{1,2})[:.](\d{2})\s*น/);
    if (m) {
      const h = Number(m[1]), min = Number(m[2]);
      if (h < 24 && min < 60) return h * 60 + min;
    }
  }
  return null;
}

export function shiftStartMinutes(story: DayStory): number {
  return timeInScene(story.start) ?? 8 * 60;
}

/**
 * The world's light runs on "minutes since 08:00" from dawn (0) to night (600).
 * Map a real time of day onto that: early morning is dawn, evening and night are night.
 */
export function worldLightMinutes(timeOfDay: number): number {
  const t = ((timeOfDay % 1440) + 1440) % 1440;
  if (t >= 480 && t < 1080) return t - 480;
  if (t >= 300 && t < 480) return 0;
  return 600;
}

/** Minute of the shift at which a plain list of mid-shift nodes plays (12:00). */
export const DEFAULT_MID_SHIFT_MINUTE = 240;

export function getCampaign(language: string) {
  return language === "th" ? STORY_CAMPAIGN_TH : STORY_CAMPAIGN;
}

export function getDayStory(day: number, language: string): DayStory {
  const raw: any = (getCampaign(language) as any)[day] ?? (STORY_CAMPAIGN as any)[day];
  if (!raw) return { start: [], end: [], mid: [], cases: [] };

  const start: CutsceneNode[] = raw.startOfDayCutscene ?? raw.startShiftEvents ?? [];
  const end: CutsceneNode[] = raw.endOfDayCutscene ?? raw.endShiftEvents ?? [];

  const rawMid: any[] = raw.midShiftEvents ?? [];
  let mid: MidShiftEvent[] = [];
  if (rawMid.length > 0) {
    if ("text" in rawMid[0]) {
      mid = [{ triggerMinute: DEFAULT_MID_SHIFT_MINUTE, cutscene: rawMid as CutsceneNode[] }];
    } else {
      mid = rawMid
        .filter((e) => Array.isArray(e?.cutscene))
        .map((e) => ({ triggerMinute: e.triggerMinute ?? DEFAULT_MID_SHIFT_MINUTE, cutscene: e.cutscene, injectCase: e.injectCase }));
    }
  }

  return { start, end, mid, cases: raw.cases ?? [] };
}

/** Find a node by id anywhere in the day's scenes and return the queue starting at it. */
export function sliceFromNode(story: DayStory, nodeId: string): CutsceneNode[] | null {
  const lists: CutsceneNode[][] = [story.start, story.end, ...story.mid.map((m) => m.cutscene)];
  for (const arr of lists) {
    const idx = arr.findIndex((n) => n.id === nodeId);
    if (idx !== -1) return arr.slice(idx);
  }
  return null;
}

/**
 * Prepare the head of a dialogue queue before it is shown:
 * - flag-check router nodes ("System" speaker, id ending in _check) jump to the branch the flags select;
 * - lines tagged "[IF_FLAG:X]" / "[IF_NOT_FLAG:X]" play only when the condition holds. Text before the
 *   tag always plays; text after it plays only when the condition holds.
 * Runs whenever a scene starts and after every advance, because some days open on a router node.
 */
export function resolveRouters(
  queue: CutsceneNode[],
  story: DayStory,
  flags: Record<string, unknown>
): CutsceneNode[] {
  let next = queue;
  let guard = 0;
  const holds = (negated: string | undefined, flag: string) => (negated ? !flags[flag] : Boolean(flags[flag]));
  // Skipping a line follows its nextId; a story line with no nextId ends the scene (see advanceQueue)
  const skip = (node: CutsceneNode, rest: CutsceneNode[]) =>
    node.nextId ? sliceFromNode(story, node.nextId) ?? rest : node.id ? [] : rest;

  while (next.length > 0 && guard++ < 100) {
    const head = next[0];

    if (head.speaker === "System" && head.id?.endsWith("_check")) {
      let chosenNextId: string | undefined;
      for (const c of head.choices || []) {
        const m = c.text.match(/^\[IF_(NOT_)?FLAG:(.*?)\]/);
        if (m) {
          if (holds(m[1], m[2])) { chosenNextId = c.nextId; break; }
        } else if (c.text.startsWith("[ELSE]")) {
          chosenNextId = c.nextId;
          break;
        }
      }
      next = (chosenNextId && sliceFromNode(story, chosenNextId)) || next.slice(1);
      continue;
    }

    const m = head.text?.match(/\[IF_(NOT_)?FLAG:(.*?)\]\s*/);
    if (m && m.index !== undefined) {
      const before = head.text.slice(0, m.index).trim();
      const after = head.text.slice(m.index + m[0].length).trim();
      const text = holds(m[1], m[2]) ? [before, after].filter(Boolean).join(" ") : before;
      next = text ? [{ ...head, text }, ...next.slice(1)] : skip(head, next.slice(1));
      continue;
    }
    break;
  }
  return next;
}

/**
 * Advance past the current line. A line with an id but no nextId is the end of its branch,
 * so the scene ends there instead of falling into the next array entry (often a sibling branch).
 * Lines without ids (built inline in the hub) play in array order.
 */
export function advanceQueue(queue: CutsceneNode[], story: DayStory, nextNodeId?: string): CutsceneNode[] {
  if (nextNodeId) return sliceFromNode(story, nextNodeId) ?? queue.slice(1);
  const current = queue[0];
  if (current?.id && !(current.choices && current.choices.length)) return [];
  return queue.slice(1);
}

/**
 * Player-facing choices can carry a condition prefix, e.g. "[IF_FLAG:CORRUPT_DOC] Accept the fellowship."
 * Hide the ones whose condition fails and strip the prefix from the rest.
 */
export function visibleChoices<T extends { text: string }>(choices: T[] | undefined, flags: Record<string, unknown>): T[] | undefined {
  if (!choices) return choices;
  const out: T[] = [];
  for (const c of choices) {
    const m = c.text.match(/^\[IF_(NOT_)?FLAG:(.*?)\]\s*/);
    if (!m) { out.push(c); continue; }
    const isSet = Boolean(flags[m[2]]);
    if (m[1] ? !isSet : isSet) out.push({ ...c, text: c.text.slice(m[0].length) });
  }
  return out;
}
