export interface Quest {
  id: string;
  title: string;
  description: string;
  title_th: string;
  description_th: string;
  rewardText: string;
  rewardCash: number;
  rewardXp: number;
}

export const QUEST_DATABASE: Record<string, Quest> = {
  q_first_shift: {
    id: "q_first_shift",
    title: "The First Shift",
    description: "Finish a shift having treated at least one patient.",
    title_th: "เวรแรก",
    description_th: "จบเวรโดยได้ดูคนไข้อย่างน้อยหนึ่งคน",
    rewardText: "+200 เหรียญ +50 XP",
    rewardCash: 200,
    rewardXp: 50,
  },
  q_social_butterfly: {
    id: "q_social_butterfly",
    title: "Social Butterfly",
    description: "Reach 2 hearts with anyone you work with. Chat every day, bring treats.",
    title_th: "ผีเสื้อสังคม",
    description_th: "สนิทกับเพื่อนร่วมงานคนใดคนหนึ่งจนได้ 2 หัวใจ คุยทุกวัน เอาขนมไปฝาก",
    rewardText: "+100 เหรียญ +20 XP",
    rewardCash: 100,
    rewardXp: 20,
  },
  q_favourite: {
    id: "q_favourite",
    title: "Just What I Wanted",
    description: "Give someone a gift they love. The notice board drops hints.",
    title_th: "ของที่อยากได้พอดี",
    description_th: "ให้ของขวัญที่ใครสักคนชอบมาก บอร์ดประกาศมีคำใบ้",
    rewardText: "+150 เหรียญ",
    rewardCash: 150,
    rewardXp: 0,
  },
  q_kanom: {
    id: "q_kanom",
    title: "Clinic Cat",
    description: "Find Kanom and give the cat a pet.",
    title_th: "แมวประจำคลินิก",
    description_th: "ตามหาขนมแล้วลูบหัวสักที",
    rewardText: "+30 เหรียญ +10 XP",
    rewardCash: 30,
    rewardXp: 10,
  },
  q_gear_up: {
    id: "q_gear_up",
    title: "Gear Up",
    description: "Buy anything from the Supply Closet.",
    title_th: "เตรียมพร้อม",
    description_th: "ซื้ออะไรก็ได้จากห้องเก็บของ",
    rewardText: "+300 เหรียญ",
    rewardCash: 300,
    rewardXp: 0,
  },
};

export const STARTER_QUESTS = ["q_first_shift", "q_kanom", "q_social_butterfly", "q_favourite", "q_gear_up"];
