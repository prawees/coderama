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
 * Skip over flag-check router nodes ("System" speaker, id ending in _check) and jump to
 * the branch the flags select. Must run whenever a scene starts, not only on advance,
 * because some days open on a router node.
 */
export function resolveRouters(
  queue: CutsceneNode[],
  story: DayStory,
  flags: Record<string, unknown>
): CutsceneNode[] {
  let next = queue;
  let guard = 0;
  while (next.length > 0 && next[0].speaker === "System" && next[0].id?.endsWith("_check") && guard++ < 50) {
    let chosenNextId: string | undefined;
    for (const c of next[0].choices || []) {
      const flagMatch = c.text.match(/^\[IF_(NOT_)?FLAG:(.*?)\]/);
      if (flagMatch) {
        const isSet = Boolean(flags[flagMatch[2]]);
        if (flagMatch[1] ? !isSet : isSet) { chosenNextId = c.nextId; break; }
      } else if (c.text.startsWith("[ELSE]")) {
        chosenNextId = c.nextId;
        break;
      }
    }
    next = (chosenNextId && sliceFromNode(story, chosenNextId)) || next.slice(1);
  }
  return next;
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
