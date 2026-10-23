"use client";

import { useMemo, MutableRefObject } from "react";
import { useERStore } from "@/lib/erStore";
import { NPCS, CAT, ROSTER, heartsFor, tasteOf, lineFor, NpcDef } from "@/lib/npcs";
import { GIFTS, TASTE_POINTS, Taste } from "@/lib/gifts";
import type { CutsceneNode, CutsceneChoice } from "@/lib/StoryManager";
import type { WorldApi, WorldNpc, WorldTarget } from "@/components/game/ClinicWorld";
import type { Phase } from "@/lib/world/maps";
import { audio } from "@/lib/audio";

type Lang = "en" | "th";
const t = (lang: Lang, en: string, th: string) => (lang === "th" ? th : en);

const PEARLS: { en: string; th: string }[] = [
  { en: "In anaphylaxis, IM adrenaline into the thigh comes before everything else.", th: "Anaphylaxis ให้ adrenaline IM ที่ต้นขาก่อนอย่างอื่น" },
  { en: "Dengue is most dangerous just after the fever breaks.", th: "ไข้เลือดออกอันตรายที่สุดช่วงหลังไข้ลง" },
  { en: "Tension pneumothorax is a clinical diagnosis. Don't wait for the X-ray.", th: "Tension pneumothorax วินิจฉัยทาง clinical อย่ารอ film" },
  { en: "Check glucose in every confused patient. Every one.", th: "คนไข้สับสนทุกคนต้องเจาะ DTX ทุกคนจริงๆ" },
  { en: "In DKA, fluids first, potassium checked, then insulin.", th: "DKA ให้ fluid ก่อน ดู K แล้วค่อยให้ insulin" },
  { en: "Magnesium, not diazepam, for eclamptic seizures.", th: "Eclampsia ชักให้ MgSO4 ไม่ใช่ diazepam" },
  { en: "Pain out of proportion to the exam: think necrotising fasciitis.", th: "ปวดเกินสัดส่วนกับที่ตรวจเจอ คิดถึง necrotizing fasciitis" },
  { en: "In paraquat poisoning, withhold oxygen unless saturations fall.", th: "Paraquat อย่าให้ O2 ยกเว้น SpO2 ตก" },
];

const NOTICES: { en: string; th: string }[] = [
  { en: "TEA ROTA: whoever empties the kettle refills the kettle. This means you.", th: "ตารางชงชา: ใครเทหมดกาต้องเติมเอง หมายถึงคุณนั่นแหละ" },
  { en: "LOST: one stethoscope, answers to 'hey'.", th: "ของหาย: หูฟังหนึ่งอัน เรียกว่า 'เฮ้' แล้วจะหันมา" },
  { en: "Please do not feed Kanom. (Kanom wrote this.)", th: "กรุณาอย่าให้อาหารขนม (ขนมเขียนเอง)" },
  { en: "Staff party Friday. Bring a dish. Not durian. We mean it.", th: "ปาร์ตี้พนักงานวันศุกร์ เอาอาหารมาคนละอย่าง ไม่เอาทุเรียน พูดจริง" },
];

export function useWorldSocial(opts: {
  phase: Phase;
  language: Lang;
  currentDay: number;
  setDialogueQueue: (q: CutsceneNode[]) => void;
  setIsCinematic: (b: boolean) => void;
  worldApi: MutableRefObject<WorldApi | null>;
  openLeaderboard: () => void;
  openConsults: () => void;
  openShop: () => void;
  openCase: (caseId: string, instanceId: string) => void;
  toast: (msg: string) => void;
  addLog: (msg: string) => void;
}) {
  const { phase, language: lang, currentDay: day } = opts;

  const npcs: WorldNpc[] = useMemo(
    () => ROSTER[phase].map((r) => ({ id: r.id, name: NPCS[r.id].name[lang], look: NPCS[r.id].look, map: r.map, home: r.home, spots: r.spots })),
    [phase, lang]
  );

  const speakerNode = (def: NpcDef, text: string): CutsceneNode => ({ speaker: def.name[lang], text, voice: def.voice });

  /** Heart scenes the friendship just unlocked */
  function heartScenes(def: NpcDef, heartsAfter: number): CutsceneNode[] {
    const st = useERStore.getState();
    const out: CutsceneNode[] = [];
    for (const ev of def.heartEvents ?? []) {
      const key = `${def.id}:${ev.hearts}`;
      if (heartsAfter >= ev.hearts && !st.heartEventsSeen.includes(key)) {
        st.markHeartEvent(key);
        out.push(...ev.lines.map((ln) => speakerNode(def, ln[lang])));
        out.push({ speaker: "System", text: t(lang, `♥ ${def.name.en} and you are closer now.`, `♥ คุณกับ${def.name.th}สนิทกันมากขึ้นแล้ว`) });
      }
    }
    if (heartsAfter >= 2 && st.activeQuests.includes("q_social_butterfly")) st.completeQuest("q_social_butterfly");
    return out;
  }

  function giftChoices(onGive: (giftId: string) => void, onSkip: () => void): CutsceneChoice[] | undefined {
    const owned = Object.entries(useERStore.getState().gifts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
    if (!owned.length) return undefined;
    return [
      ...owned.slice(0, 3).map(([id, n]) => ({
        text: t(lang, `Give ${GIFTS[id]?.name.en ?? id} (${n})`, `ให้${GIFTS[id]?.name.th ?? id} (${n})`),
        onPick: () => onGive(id),
      })),
      { text: t(lang, "Just saying hi", "แค่แวะมาทัก"), onPick: onSkip },
    ];
  }

  function talk(id: string) {
    const def = NPCS[id];
    if (!def) return;
    const st = useERStore.getState();
    const before = st.friendships[id] || 0;
    const daily = st.npcDaily[id] || {};
    const firstToday = daily.talkDay !== day;
    if (firstToday) { st.updateFriendship(id, 2); st.markNpc(id, "talkDay", day); }
    const after = before + (firstToday ? 2 : 0);
    opts.worldApi.current?.emote(id, heartsFor(after) >= 6 ? "heart" : firstToday ? "note" : "dots");
    const node = speakerNode(def, lineFor(def, heartsFor(after), day, lang));
    const scenes = heartScenes(def, heartsFor(after));
    if (daily.giftDay !== day) {
      node.choices = giftChoices((g) => give(id, g), () => opts.setDialogueQueue(scenes));
    }
    if (scenes.length) opts.setIsCinematic(true);
    opts.setDialogueQueue(node.choices ? [node] : [node, ...scenes]);
  }

  function reactionEmote(taste: Taste) {
    return taste === "love" ? "heart" : taste === "like" ? "star" : taste === "neutral" ? "dots" : "angry";
  }

  function give(id: string, giftId: string) {
    const def = NPCS[id];
    const st = useERStore.getState();
    if (!def || !st.useGift(giftId)) return;
    const before = st.friendships[id] || 0;
    const taste = tasteOf(def, giftId);
    st.updateFriendship(id, TASTE_POINTS[taste]);
    st.markNpc(id, "giftDay", day);
    st.learnTaste(id, giftId, taste);
    const after = before + TASTE_POINTS[taste];
    opts.worldApi.current?.emote(id, reactionEmote(taste));
    if (taste === "love") {
      opts.worldApi.current?.sparkle(id);
      audio.playCashRegister();
      if (st.activeQuests.includes("q_favourite")) st.completeQuest("q_favourite");
    }
    opts.addLog(`${def.name.en}: ${GIFTS[giftId]?.name.en} (${taste})`);
    const scenes = heartScenes(def, heartsFor(after));
    if (scenes.length) opts.setIsCinematic(true);
    opts.setDialogueQueue([speakerNode(def, def.gift[taste][lang]), ...scenes]);
  }

  function petCat() {
    const st = useERStore.getState();
    const daily = st.npcDaily.cat || {};
    const node: CutsceneNode = { speaker: CAT.name[lang], text: "", voice: 1500 };
    if (daily.talkDay !== day) {
      st.markNpc("cat", "talkDay", day);
      st.restoreEnergy(5);
      st.updateFriendship("cat", 2);
      node.text = CAT.pet[lang];
      if (st.activeQuests.includes("q_kanom")) st.completeQuest("q_kanom");
      opts.worldApi.current?.emote("cat", "heart");
    } else {
      node.text = CAT.lines[(day + Math.floor(Date.now() / 7000)) % CAT.lines.length][lang];
      opts.worldApi.current?.emote("cat", "note");
    }
    if (daily.giftDay !== day) {
      node.choices = giftChoices((g) => {
        const s = useERStore.getState();
        if (!s.useGift(g)) return;
        const taste = tasteOf({ loves: CAT.loves, hates: CAT.hates }, g);
        s.markNpc("cat", "giftDay", day);
        s.updateFriendship("cat", TASTE_POINTS[taste]);
        s.learnTaste("cat", g, taste);
        opts.worldApi.current?.emote("cat", reactionEmote(taste));
        if (taste === "love") opts.worldApi.current?.sparkle("cat");
        opts.setDialogueQueue([{ speaker: CAT.name[lang], text: CAT.gift[taste][lang], voice: 1500 }]);
      }, () => opts.setDialogueQueue([]));
    }
    opts.setDialogueQueue([node]);
  }

  /** Small once-a-day comforts around the clinic */
  function onceToday(key: string): boolean {
    const st = useERStore.getState();
    if (st.propDaily[key] === day) return false;
    st.useProp(key, day);
    return true;
  }

  function useProp(id: string, kind: string) {
    const st = useERStore.getState();
    const say = (text: string) => opts.setDialogueQueue([{ speaker: "System", text }]);
    switch (kind) {
      case "computer":
        if (id === "leaderboard") opts.openLeaderboard(); else opts.openConsults();
        return;
      case "vending":
        opts.openShop();
        return;
      case "kettle":
        if (onceToday("kettle")) { st.restoreEnergy(8); opts.worldApi.current?.emote("player", "heart"); say(t(lang, "You make a cup of tea and drink it while it's still too hot. Worth it. (+8 energy)", "คุณชงชาแล้วดื่มทั้งที่ยังร้อนเกินไป คุ้มค่า (+8 พลังงาน)")); }
        else say(t(lang, "The kettle is still warm. Someone else's turn now.", "กาต้มน้ำยังอุ่นอยู่ ตาคนอื่นบ้างแล้ว"));
        return;
      case "bookshelf": {
        const pearl = PEARLS[day % PEARLS.length][lang];
        if (onceToday("bookshelf")) { st.addXp(10); opts.worldApi.current?.emote("player", "star"); say(t(lang, `You flip through a well-loved handbook. "${pearl}" (+10 XP)`, `คุณเปิดหนังสือคู่มือเล่มเก่า "${pearl}" (+10 XP)`)); }
        else say(t(lang, `You've read enough for today. One line sticks: "${pearl}"`, `วันนี้อ่านพอแล้ว แต่มีประโยคหนึ่งติดอยู่ในหัว "${pearl}"`));
        return;
      }
      case "notice": {
        // the board leaks gift hints about whoever works here now
        const here = ROSTER[phase];
        const npc = NPCS[here[day % here.length].id];
        const gift = GIFTS[npc.loves[day % npc.loves.length]];
        const hint = t(lang, `Someone has pinned a note: "${npc.name.en} would do anything for ${gift.name.en}."`, `มีคนแปะโน้ตไว้: "${npc.name.th}ยอมทำทุกอย่างเพื่อ${gift.name.th}"`);
        const other = NOTICES[day % NOTICES.length][lang];
        opts.setDialogueQueue([{ speaker: "System", text: other }, { speaker: "System", text: hint }]);
        return;
      }
      case "pond":
        say(onceToday("pond")
          ? t(lang, "The koi gather, convinced you are food. You make a small wish. Nobody needs to know what it was.", "ปลาคาร์ปมารวมกัน คิดว่าคุณเป็นอาหาร คุณอธิษฐานเบาๆ ไม่ต้องมีใครรู้ว่าขออะไร")
          : t(lang, "The koi have lost interest in you. Fair.", "ปลาคาร์ปเลิกสนใจคุณแล้ว ก็สมควร"));
        return;
      case "bench":
        if (onceToday("bench")) { st.restoreEnergy(6); say(t(lang, "You sit for a moment. A breeze moves through the frangipani. (+6 energy)", "คุณนั่งพักสักครู่ ลมพัดผ่านต้นลีลาวดี (+6 พลังงาน)")); }
        else say(t(lang, "The bench is warm from the sun. You can't sit all day, though.", "ม้านั่งอุ่นแดด แต่จะนั่งทั้งวันก็ไม่ได้"));
        return;
      case "tree":
        say(t(lang, "Frangipani. Lan thom. Someone has tucked a flower behind the signpost.", "ลีลาวดี มีคนเหน็บดอกไม้ไว้หลังป้าย"));
        return;
      case "ambulance":
        say(t(lang, "The ambulance ticks as it cools. 1669 is painted on the side, slightly crooked.", "รถพยาบาลมีเสียงติ๊กๆ ตอนเครื่องเย็น เลข 1669 ทาไว้ข้างรถ เอียงนิดหน่อย"));
        return;
      case "catbed":
        say(t(lang, "Kanom's bed. Warm, and roughly forty percent cat hair.", "ที่นอนของขนม อุ่น และเป็นขนแมวราวสี่สิบเปอร์เซ็นต์"));
        return;
      case "window": {
        const m = st.clockMinutes;
        say(st.shiftMode === "off-duty"
          ? t(lang, "Pink dawn over the car park. The day hasn't decided what it is yet.", "ฟ้ารุ่งสีชมพูเหนือลานจอดรถ วันนี้ยังไม่ตัดสินใจว่าจะเป็นวันแบบไหน")
          : m < 240 ? t(lang, "Morning light. A street vendor is setting up across the road.", "แสงยามเช้า แม่ค้าฝั่งตรงข้ามกำลังตั้งร้าน")
          : m < 420 ? t(lang, "Blazing afternoon. The car park shimmers.", "บ่ายร้อนจัด ลานจอดรถระยิบระยับ")
          : t(lang, "Golden hour. The sky looks like a mango.", "แสงทองยามเย็น ท้องฟ้าเหมือนมะม่วงสุก"));
        return;
      }
    }
  }

  function onInteract(target: WorldTarget) {
    switch (target.type) {
      case "npc": talk(target.id); return;
      case "cat": petCat(); return;
      case "bed": {
        const c = useERStore.getState().activeCases.find((x) => x.bedIndex === target.bedIndex);
        if (c) { audio.playClick(); opts.openCase(c.caseDataId, c.id); }
        else opts.toast(t(lang, "This bed is empty, freshly made and smoothed flat.", "เตียงนี้ว่าง ปูใหม่เรียบกริบ"));
        return;
      }
      case "prop": useProp(target.id, target.kind); return;
    }
  }

  function describe(target: WorldTarget): string | null {
    switch (target.type) {
      case "npc": {
        const def = NPCS[target.id];
        return def ? t(lang, `Talk to ${def.name.en}`, `คุยกับ${def.name.th}`) : null;
      }
      case "cat": return t(lang, "Pet Kanom", "ลูบหัวขนม");
      case "bed": {
        const has = useERStore.getState().activeCases.some((c) => c.bedIndex === target.bedIndex);
        return has ? t(lang, `Treat patient (bed ${target.bedIndex + 1})`, `ดูคนไข้ (เตียง ${target.bedIndex + 1})`) : t(lang, `Bed ${target.bedIndex + 1}`, `เตียง ${target.bedIndex + 1}`);
      }
      case "prop": {
        const labels: Record<string, [string, string]> = {
          computer: target.id === "leaderboard" ? ["Leaderboard", "กระดานอันดับ"] : ["Consults", "ขอคำปรึกษา"],
          kettle: ["Make tea", "ชงชา"], notice: ["Read the board", "อ่านบอร์ด"], bookshelf: ["Browse books", "หยิบหนังสือ"],
          vending: ["Supply closet", "ห้องเก็บของ"], pond: ["Look at the koi", "ดูปลาคาร์ป"], bench: ["Sit down", "นั่งพัก"],
          tree: ["Smell the flowers", "ดมดอกไม้"], ambulance: ["Ambulance", "รถพยาบาล"], catbed: ["Kanom's bed", "ที่นอนขนม"], window: ["Look outside", "มองออกไปข้างนอก"],
        };
        const lbl = labels[target.kind];
        return lbl ? (lang === "th" ? lbl[1] : lbl[0]) : null;
      }
    }
  }

  return { npcs, onInteract, describe };
}
