export interface Quest {
  id: string;
  title: string;
  description: string;
  rewardText: string;
  rewardCash: number;
  rewardXp: number;
}

export const QUEST_DATABASE: Record<string, Quest> = {
  'q_first_shift': {
    id: 'q_first_shift',
    title: 'The First Shift',
    description: 'Complete your first shift successfully by treating at least 1 patient.',
    rewardText: '+$200, +50 XP',
    rewardCash: 200,
    rewardXp: 50,
  },
  'q_social_butterfly': {
    id: 'q_social_butterfly',
    title: 'Social Butterfly',
    description: 'Talk to Nurse Ann and reach 2 Hearts of friendship.',
    rewardText: '+$100, +20 XP',
    rewardCash: 100,
    rewardXp: 20,
  },
  'q_gear_up': {
    id: 'q_gear_up',
    title: 'Gear Up',
    description: 'Purchase your first item from the Supply Closet.',
    rewardText: '+$500',
    rewardCash: 500,
    rewardXp: 0,
  }
};
