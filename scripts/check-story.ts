/**
 * Walks every scene of every day in both languages under several flag combinations,
 * taking each visible choice in turn, and checks that:
 *  - no "[IF_..." or "[ELSE]" markup ever reaches the player (line text or choice text),
 *  - every scene terminates,
 *  - every choice and nextId resolves.
 * Usage: npm run check:story
 */
import { STORY_CAMPAIGN, CutsceneNode } from "../lib/StoryManager";
import { getDayStory, resolveRouters, advanceQueue, visibleChoices, sliceFromNode } from "../lib/story";

const FLAG_SETS: Record<string, boolean>[] = [
  {},
  { WHISTLEBLOWER: true },
  { CORRUPT_DOC: true },
  { WHISTLEBLOWER: true, KIT_ALLY: true, CALLED_BACK_PRASIT: true, COVERED_BOB_Y1: true },
  { CORRUPT_DOC: true, DEFIED_SOMCHAI_Y1: true, SCAPEGOATED_ANN: true, NAMED_BOB_AT_REVIEW: true },
];
const MARKUP = /\[(IF_|ELSE)/;
let problems = 0;
let walks = 0;
const report = (m: string) => { problems++; if (problems <= 40) console.log("!", m); };

for (const lang of ["en", "th"]) {
  for (const day of Object.keys(STORY_CAMPAIGN).map(Number)) {
    const story = getDayStory(day, lang);
    const scenes: Array<[string, CutsceneNode[]]> = [["start", story.start], ["end", story.end], ...story.mid.map((m, i): [string, CutsceneNode[]] => [`mid${i}`, m.cutscene])];
    for (const flags of FLAG_SETS) {
      for (const [sceneName, scene] of scenes) {
        if (!scene.length) continue;
        // explore each choice branch: a choice path is a list of choice indices
        const pending: number[][] = [[]];
        while (pending.length) {
          const path = pending.pop()!;
          walks++;
          let queue = resolveRouters(scene, story, flags);
          let steps = 0, choiceDepth = 0;
          while (queue.length) {
            if (++steps > 300) { report(`${lang} day ${day} ${sceneName}: does not terminate`); break; }
            const head = queue[0];
            const where = `${lang} day ${day} ${sceneName} ${head.id ?? "(inline)"}`;
            if (MARKUP.test(head.text)) report(`${where}: markup shown in text`);
            const choices = visibleChoices(head.choices, flags) ?? [];
            for (const c of choices) {
              if (MARKUP.test(c.text)) report(`${where}: markup shown in choice "${c.text.slice(0, 40)}"`);
              if (c.nextId && !sliceFromNode(story, c.nextId)) report(`${where}: choice -> ${c.nextId} missing`);
            }
            if (head.nextId && !sliceFromNode(story, head.nextId)) report(`${where}: nextId ${head.nextId} missing`);
            let pick: (typeof choices)[number] | undefined;
            if (choices.length) {
              const idx = path[choiceDepth] ?? 0;
              if (path[choiceDepth] === undefined) for (let i = 1; i < choices.length; i++) pending.push([...path.slice(0, choiceDepth), i]);
              pick = choices[idx];
              choiceDepth++;
            }
            queue = resolveRouters(advanceQueue(queue, story, pick?.nextId ?? head.nextId), story, flags);
          }
        }
      }
    }
  }
}
console.log(`${walks} scene walks, ${problems} problem(s)`);
process.exit(problems ? 1 : 0);
