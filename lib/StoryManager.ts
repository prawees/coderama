/**
 * CODE RAMA
 * Narrative script: Year 1 (Days 1 to 5) and Year 2 (Days 6 to 10)
 *
 * -------------------------------------------------------------------------
 * ENGINE CONTRACT
 * -------------------------------------------------------------------------
 * The CutsceneNode interface has no condition field, so flags cannot gate a
 * node directly. This script uses a convention instead:
 *
 *   A node with speaker 'System' and id ending in '_check' is a ROUTER.
 *   Its choices are NOT shown to the player. Each choice text begins with
 *   either '[IF_FLAG:NAME]' or '[ELSE]'. The engine walks the list top to
 *   bottom, takes the first choice whose flag is set, and falls through to
 *   '[ELSE]' if none match.
 *
 * If you do not implement the router, these nodes still work: they render as
 * a short recap prompt and the player re-states what they did. Nothing breaks.
 *
 * Portraits used: /assets/doctor.jpg, /assets/nurse.jpg, /assets/director.jpg.
 * System nodes carry no portrait.
 *
 * Replace the local interface copies below with your own import if you
 * already declare these types elsewhere.
 * -------------------------------------------------------------------------
 */

export interface CutsceneChoice {
  text: string;
  nextId?: string;
  karmaEffect?: number;
  flagEffect?: string;
  xpEffect?: number;
}

export interface CutsceneNode {
  id?: string;
  speaker?: string;
  portrait?: string;
  text: string;
  choices?: CutsceneChoice[];
  nextId?: string;
  flagEffect?: string;
  xpEffect?: number;
}

export const STORY_CAMPAIGN: Record<number, {
  startOfDayCutscene?: CutsceneNode[];
  startShiftEvents?: CutsceneNode[];
  endOfDayCutscene?: CutsceneNode[];
  endShiftEvents?: CutsceneNode[];
  midShiftEvents?: ({ triggerMinute: number; cutscene: CutsceneNode[]; injectCase?: string } | CutsceneNode)[];
  cases: string[];
}> = {

  /* =======================================================================
   * YEAR 1: "THE PAPERWORK"
   * =======================================================================
   */

  /* ----------------------------------------------------------------------
   * DAY 1
   * ----------------------------------------------------------------------
   */
  1: {
    startOfDayCutscene: [
      {
        id: 'd1_s_01',
        speaker: 'System',
        text: "RAMA CENTRAL HOSPITAL. EMERGENCY DEPARTMENT. 03:12.",
        nextId: 'd1_s_02',
      },
      {
        id: 'd1_s_02',
        speaker: 'System',
        text: "The doors have been broken for six weeks. They open for the wind, for stray dogs, for nobody at all. Maintenance ticket 4471. Status: pending.",
        nextId: 'd1_s_03',
      },
      {
        id: 'd1_s_03',
        speaker: 'System',
        text: "Twenty-nine patients in a department built for sixteen. Four of them are on the floor because the floor is what is left.",
        nextId: 'd1_s_04',
      },
      {
        id: 'd1_s_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You are the new intern. Don't answer, I can smell it. New shoes. Nobody with two years in this place buys white shoes.",
        nextId: 'd1_s_05',
      },
      {
        id: 'd1_s_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Dr. Bob. Senior resident, fourth year, which in this hospital means I am the most experienced physician on this floor for the next nine hours. Try not to find that comforting.",
        nextId: 'd1_s_06',
      },
      {
        id: 'd1_s_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Three rules. One: the ultrasound on the left lies about the gallbladder. Two: never say the word 'quiet' out loud. Three, and this is the only one that matters, we do not have a bed.",
        nextId: 'd1_s_07',
      },
      {
        id: 'd1_s_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "We have two beds.",
        nextId: 'd1_s_08',
      },
      {
        id: 'd1_s_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "We have two beds that are being held for people who have not arrived yet and whose families sit on the hospital board. Functionally, we do not have a bed.",
        nextId: 'd1_s_09',
      },
      {
        id: 'd1_s_09',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Ann. Charge nurse. I have been here eleven years and I will still be here when he burns out completely, so if you have to trust one of us, choose carefully.",
        nextId: 'd1_s_10',
      },
      {
        id: 'd1_s_10',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Bay 4 is an elderly man with chest pain since yesterday evening. His name is Prasit. He walked here. Forty minutes, in the rain, because the ambulance fee is more than his monthly pension.",
        nextId: 'd1_s_11',
      },
      {
        id: 'd1_s_11',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "So. First shift. Say something so I know what kind of problem you are going to be.",
        choices: [
          {
            text: "\"I'm here to learn. Tell me where you want me and I'll go.\"",
            nextId: 'd1_s_eager',
            karmaEffect: 10,
            flagEffect: 'INTRO_HUMBLE',
            xpEffect: 500,
          },
          {
            text: "\"You said we have no beds. Ann said we have two. Which is true?\"",
            nextId: 'd1_s_sharp',
            karmaEffect: 20,
            flagEffect: 'INTRO_SHARP',
            xpEffect: 1000,
          },
          {
            text: "\"I graduated top of my class. Put me on the sick ones.\"",
            nextId: 'd1_s_arrogant',
            karmaEffect: -10,
            flagEffect: 'INTRO_ARROGANT',
            xpEffect: 1500,
          },
        ],
      },
      {
        id: 'd1_s_eager',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Polite. That will last about six weeks. Bay 4, go. Do not order anything expensive without telling me first.",
        nextId: 'd1_s_close',
      },
      {
        id: 'd1_s_sharp',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Both are true. That is the whole education, right there, and it took you eleven seconds. Bay 4. Go.",
        nextId: 'd1_s_sharp_02',
      },
      {
        id: 'd1_s_sharp_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Careful. He likes people who notice things. So does the director, and he likes them for very different reasons.",
        nextId: 'd1_s_close',
      },
      {
        id: 'd1_s_arrogant',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Top of your class. Wonderful. In four hours you will be holding pressure on a femoral bleed with your knee because both your hands are full. Bay 4.",
        nextId: 'd1_s_close',
      },
      {
        id: 'd1_s_close',
        speaker: 'System',
        text: "The monitor at the nursing station cycles through nine names. One of them is going to die tonight. The screen does not indicate which.",
        nextId: 'd1_s_close_02',
      },
      {
        id: 'd1_s_close_02',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd1_e_01',
        speaker: 'System',
        text: "11:40. The night shift ended forty minutes ago. Nobody has left.",
        nextId: 'd1_e_02',
      },
      {
        id: 'd1_e_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Sit. No, actually, stand, if you sit down now you will not get up again. I need a favour and I am going to be honest about it, which is more than anyone did for me.",
        nextId: 'd1_e_03',
      },
      {
        id: 'd1_e_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Prasit. Bay 4. The chest pain. I discharged him at 06:00.",
        nextId: 'd1_e_04',
      },
      {
        id: 'd1_e_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "One ECG, unremarkable. I wrote that the second troponin was negative and the pain was reproducible on palpation. Musculoskeletal. Home with paracetamol.",
        nextId: 'd1_e_05',
      },
      {
        id: 'd1_e_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "There was no second troponin. The lab machine went down at 04:00 and I never sent it. I had a trauma in resus and a seizure in the corridor and I made a decision with the information a tired person has.",
        nextId: 'd1_e_06',
      },
      {
        id: 'd1_e_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "The chart needs a co-signature from the receiving intern. That is you. Sign it, the audit closes, everyone goes home.",
        nextId: 'd1_e_07',
      },
      {
        id: 'd1_e_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Bob.",
        nextId: 'd1_e_08',
      },
      {
        id: 'd1_e_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Ann, I have signed forty of these for other people and every one of them was fine. Statistically he is fine.",
        nextId: 'd1_e_09',
      },
      {
        id: 'd1_e_09',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Statistically. He is seventy-one, diabetic, and he described pressure in his jaw. Do not make the new one carry this on the first shift.",
        nextId: 'd1_e_10',
      },
      {
        id: 'd1_e_10',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Someone has to carry it. That is the job. That is the entire job, and the sooner they learn the weight the sooner they stop dropping it.",
        nextId: 'd1_e_11',
      },
      {
        id: 'd1_e_11',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "So. Your name, or an incident report with mine on it. Choose.",
        choices: [
          {
            text: "Sign the chart. He's your senior. This is how it works here.",
            nextId: 'd1_e_sign_01',
            karmaEffect: -40,
            flagEffect: 'COVERED_BOB_Y1',
            xpEffect: 8000,
          },
          {
            text: "Refuse. \"I'm not putting my name on a lab result that doesn't exist.\"",
            nextId: 'd1_e_refuse_01',
            karmaEffect: 40,
            flagEffect: 'REFUSED_BOB_Y1',
            xpEffect: 1000,
          },
          {
            text: "\"I won't sign it. But give me his number. I'll call him back in myself.\"",
            nextId: 'd1_e_recall_01',
            karmaEffect: 60,
            flagEffect: 'CALLED_BACK_PRASIT',
            xpEffect: 3000,
          },
        ],
      },

      {
        id: 'd1_e_sign_01',
        speaker: 'System',
        text: "The pen is warm. Someone has been holding it for a long time.",
        nextId: 'd1_e_sign_02',
      },
      {
        id: 'd1_e_sign_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Good. That was the right call, and I want you to hear me say it once, because nobody will say it again. You just kept a department running.",
        nextId: 'd1_e_sign_03',
      },
      {
        id: 'd1_e_sign_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That is not what just happened.",
        nextId: 'd1_e_sign_04',
      },
      {
        id: 'd1_e_sign_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "What just happened is that a signature became available. This hospital collects those. You will find out what it does with them.",
        nextId: 'd1_e_close_01',
      },

      {
        id: 'd1_e_refuse_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Huh.",
        nextId: 'd1_e_refuse_02',
      },
      {
        id: 'd1_e_refuse_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I have been doing this for nine years and no intern has ever said no to me. Not one. Do you want to know why? Because the ones who say no get scheduled into the ground until they say yes.",
        nextId: 'd1_e_refuse_03',
      },
      {
        id: 'd1_e_refuse_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I am not going to do that to you. I am too tired. I will file it myself and eat whatever comes.",
        nextId: 'd1_e_refuse_04',
      },
      {
        id: 'd1_e_refuse_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Bob. The report goes to the director's office.",
        nextId: 'd1_e_refuse_05',
      },
      {
        id: 'd1_e_refuse_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I know where it goes, Ann. I know exactly where it goes.",
        nextId: 'd1_e_close_01',
      },

      {
        id: 'd1_e_recall_01',
        speaker: 'System',
        text: "The phone rings eleven times. A woman answers. She says her father is sleeping. She says he has been sweating since he got home and she thought it was the walk.",
        nextId: 'd1_e_recall_02',
      },
      {
        id: 'd1_e_recall_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Tell her to call an ambulance. Now. Not a taxi. Tell her the fee does not matter, I will handle the fee.",
        nextId: 'd1_e_recall_03',
      },
      {
        id: 'd1_e_recall_03',
        speaker: 'System',
        text: "Prasit arrives at 12:26 with a completed inferior infarct. He goes to the catheterisation laboratory at 12:51. He survives.",
        nextId: 'd1_e_recall_04',
      },
      {
        id: 'd1_e_recall_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "...",
        nextId: 'd1_e_recall_05',
      },
      {
        id: 'd1_e_recall_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I would have killed him. On a Tuesday. On an ordinary Tuesday, with a pen, because I was too proud to admit I had run out.",
        nextId: 'd1_e_recall_06',
      },
      {
        id: 'd1_e_recall_06',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Yes.",
        nextId: 'd1_e_recall_07',
      },
      {
        id: 'd1_e_recall_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Do not expect me to thank you. Expect me to remember it, which is worse.",
        nextId: 'd1_e_close_01',
      },

      {
        id: 'd1_e_close_01',
        speaker: 'System',
        text: "In the car park, the director's car is already there. It is always already there.",
        nextId: 'd1_e_close_02',
      },
      {
        id: 'd1_e_close_02',
        speaker: 'System',
        text: "DAY 1 COMPLETE.",
      },
    ],
    cases: ['case_01', 'case_02_fluids', 'case_05_asthma'],
  },

  /* ----------------------------------------------------------------------
   * DAY 2
   * ----------------------------------------------------------------------
   */
  2: {
    startOfDayCutscene: [
      {
        id: 'd2_s_check',
        speaker: 'System',
        text: "[ROUTER] Resolving outcome of Day 1.",
        choices: [
          { text: '[IF_FLAG:CALLED_BACK_PRASIT]', nextId: 'd2_s_good_01' },
          { text: '[IF_FLAG:COVERED_BOB_Y1]', nextId: 'd2_s_bad_01' },
          { text: '[ELSE]', nextId: 'd2_s_neutral_01' },
        ],
      },
      {
        id: 'd2_s_good_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Prasit is in the coronary unit. Ejection fraction forty-five percent. His daughter left food at the nursing station for you. Eat it before Bob finds it.",
        nextId: 'd2_s_join',
      },
      {
        id: 'd2_s_bad_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Prasit came back at 14:00 yesterday. Cardiac arrest in the doorway. Forty minutes of compressions.",
        nextId: 'd2_s_bad_02',
      },
      {
        id: 'd2_s_bad_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "He is alive. Heart function of a man twenty years older, and he will never walk to this hospital again, but he is alive. The chart says his second troponin was negative. Your name is under that sentence.",
        nextId: 'd2_s_join',
      },
      {
        id: 'd2_s_neutral_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Prasit came back yesterday afternoon. Infarct. He is upstairs and he is stable. Bob filed the incident report himself, which I did not expect, and the director has had it on his desk since 08:00.",
        nextId: 'd2_s_join',
      },
      {
        id: 'd2_s_join',
        speaker: 'System',
        text: "17:55. The evening shift. Somewhere above the ceiling tiles, a helicopter is landing on a pad that the emergency department is not allowed to use.",
        nextId: 'd2_s_02',
      },
      {
        id: 'd2_s_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The new one. Stand up straight, I want to look at you properly.",
        nextId: 'd2_s_03',
      },
      {
        id: 'd2_s_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Somchai. Director. I do not normally come down here. The lighting is unkind and the smell settles in the wool.",
        nextId: 'd2_s_04',
      },
      {
        id: 'd2_s_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "In ninety minutes a helicopter brings me Khun Wichai. Sixty-eight, aortic valve, and the reason the paediatric wing has a roof. He requires the last intensive care bed.",
        nextId: 'd2_s_05',
      },
      {
        id: 'd2_s_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The last bed has a person in it. Malai. Thirty-four. Septic shock, two children, day three of pressors, and she is finally coming off them.",
        nextId: 'd2_s_06',
      },
      {
        id: 'd2_s_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Coming off them. Then she no longer requires intensive care. That is not a transfer, that is a clinical milestone. Congratulations to everyone involved.",
        nextId: 'd2_s_07',
      },
      {
        id: 'd2_s_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "She is on eight micrograms of noradrenaline. That is not off. That is standing on the edge holding the rail.",
        nextId: 'd2_s_08',
      },
      {
        id: 'd2_s_08',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Dr. Bob, you have an open incident inquiry regarding a falsified troponin result. I would suggest your clinical judgement is not the currency you want to spend today.",
        nextId: 'd2_s_09',
      },
      {
        id: 'd2_s_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The step-down order requires an admitting physician's signature. I am asking the intern because the intern has not yet learned to be expensive.",
        nextId: 'd2_s_10',
      },
      {
        id: 'd2_s_10',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Consider what a hospital is. It is a building that runs on money it does not have. Khun Wichai's family funds the dialysis programme. Nine hundred patients. Weigh nine hundred against one and tell me you are the ethical party in this conversation.",
        choices: [
          {
            text: "Sign the step-down. Nine hundred is a real number.",
            nextId: 'd2_s_obey_01',
            karmaEffect: -50,
            flagEffect: 'MOVED_MALAI',
            xpEffect: 12000,
          },
          {
            text: "Refuse. \"She is not stable. Find him another bed.\"",
            nextId: 'd2_s_defy_01',
            karmaEffect: 50,
            flagEffect: 'DEFIED_SOMCHAI_Y1',
            xpEffect: 2000,
          },
          {
            text: "\"I'll sign it if you sign it with me. Director and intern, both names.\"",
            nextId: 'd2_s_clever_01',
            karmaEffect: 25,
            flagEffect: 'FORCED_SOMCHAI_SIGNATURE',
            xpEffect: 6000,
          },
        ],
      },

      {
        id: 'd2_s_obey_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Sensible. I will remember that you are sensible. It is a rarer quality than intelligence and it pays considerably better.",
        nextId: 'd2_s_obey_02',
      },
      {
        id: 'd2_s_obey_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I will move her myself. I am not letting a porter do it.",
        nextId: 'd2_s_obey_03',
      },
      {
        id: 'd2_s_obey_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "For the record, so that you hear it in a human voice and not in a meeting eight months from now: bed 6 on the general ward has no arterial line, no dedicated nurse, and a monitor that alarms into an empty corridor.",
        nextId: 'd2_s_close',
      },

      {
        id: 'd2_s_defy_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "No.",
        nextId: 'd2_s_defy_02',
      },
      {
        id: 'd2_s_defy_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You said no to me. In my hospital. In front of the nursing staff. Do you understand that the word costs nothing to say and forty years to survive?",
        nextId: 'd2_s_defy_03',
      },
      {
        id: 'd2_s_defy_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Very well. Khun Wichai will be diverted to the private wing at a cost of one point two million baht, which I will find, and you will never know where I found it. Nobody ever does. That is the part they leave out of the ethics lectures.",
        nextId: 'd2_s_defy_04',
      },
      {
        id: 'd2_s_defy_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "That went well. That went so well that I need to sit down.",
        nextId: 'd2_s_close',
      },

      {
        id: 'd2_s_clever_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Both names.",
        nextId: 'd2_s_clever_02',
      },
      {
        id: 'd2_s_clever_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You are asking a director to place his signature on a clinical order so that responsibility becomes shared. Do you know what that is? That is not ethics. That is leverage. You have leverage instincts.",
        nextId: 'd2_s_clever_03',
      },
      {
        id: 'd2_s_clever_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I will sign. Not because you outmanoeuvred me, but because I want to see what you do with a thing like that in your hand. Most people cut themselves.",
        nextId: 'd2_s_clever_04',
      },
      {
        id: 'd2_s_clever_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "She still goes to bed 6. Whatever is written on the form, she still goes to bed 6.",
        nextId: 'd2_s_close',
      },

      {
        id: 'd2_s_close',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd2_e_01',
        speaker: 'System',
        text: "02:40. The department has gone the particular kind of quiet that comes after, not before.",
        nextId: 'd2_e_check',
      },
      {
        id: 'd2_e_check',
        speaker: 'System',
        text: "[ROUTER] Resolving Malai outcome.",
        choices: [
          { text: '[IF_FLAG:DEFIED_SOMCHAI_Y1]', nextId: 'd2_e_saved_01' },
          { text: '[ELSE]', nextId: 'd2_e_lost_01' },
        ],
      },
      {
        id: 'd2_e_saved_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Malai is off pressors. Actually off, not politically off. She asked about her children twice and then fell asleep in the middle of the second question.",
        nextId: 'd2_e_saved_02',
      },
      {
        id: 'd2_e_saved_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Enjoy that. Genuinely, take the whole feeling and hold it, because this is a place that charges interest on good outcomes.",
        nextId: 'd2_e_join',
      },
      {
        id: 'd2_e_lost_01',
        speaker: 'System',
        text: "Bed 6. 01:14. The monitor alarms for nine minutes in a corridor where the night nurse is covering twenty-eight patients on the far side of a fire door.",
        nextId: 'd2_e_lost_02',
      },
      {
        id: 'd2_e_lost_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "She rearrested at 01:23. We got her back. She is intubated now, and she has been without adequate perfusion for long enough that we will be having a very different conversation with her family in the morning.",
        nextId: 'd2_e_lost_03',
      },
      {
        id: 'd2_e_lost_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I am not going to shout at you. You did what a director told you to do on your second shift. I want you to notice how easy it was. That is the part that should frighten you.",
        nextId: 'd2_e_join',
      },
      {
        id: 'd2_e_join',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Come with me. The pharmacy corridor, and do not bring your phone.",
        nextId: 'd2_e_03',
      },
      {
        id: 'd2_e_03',
        speaker: 'System',
        text: "Sub-level 1. The corridor smells of ethanol and old rain. Ann unlocks a cabinet that is not hers to unlock.",
        nextId: 'd2_e_04',
      },
      {
        id: 'd2_e_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Controlled drug register. Every ampoule in this hospital, signed out by two people, twice a day, for thirty years. It is the most honest document in the building because nobody thinks it is interesting.",
        nextId: 'd2_e_05',
      },
      {
        id: 'd2_e_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Look at March. Look at the column marked KV-7.",
        nextId: 'd2_e_06',
      },
      {
        id: 'd2_e_06',
        speaker: 'System',
        text: "KV-7. Two hundred and forty units dispensed. No manufacturer. No batch expiry. No pharmacy code.",
        nextId: 'd2_e_07',
      },
      {
        id: 'd2_e_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Now the patient identifiers those units were charged against. Eleven names. I pulled all eleven records this week.",
        nextId: 'd2_e_08',
      },
      {
        id: 'd2_e_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Four of them were discharged before the drug was issued. Three of them are dead, and were dead on the date of issue. Two do not exist. One is a hospital porter who has never been a patient here.",
        nextId: 'd2_e_09',
      },
      {
        id: 'd2_e_09',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "And one is real, and current, and in bed 12 of the medical ward right now receiving something that has no license, no ethics approval number, and no consent form I can find.",
        nextId: 'd2_e_10',
      },
      {
        id: 'd2_e_10',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I have been building this for two years. I cannot take it to the medical council with a nurse's word and a photocopy. I need a physician. A physician's account of the register carries weight that mine never will, and I hate that sentence, and it is true.",
        nextId: 'd2_e_11',
      },
      {
        id: 'd2_e_11',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "So I am asking on day two, which is unfair, because on day thirty you will have too much to lose.",
        choices: [
          {
            text: "\"Photograph it. All of it. I'll witness every page.\"",
            nextId: 'd2_e_ally_01',
            karmaEffect: 60,
            flagEffect: 'ALLY_ANN',
            xpEffect: 4000,
          },
          {
            text: "\"I'm an intern. I can't. Don't show me anything else.\"",
            nextId: 'd2_e_neutral_01',
            karmaEffect: -10,
            flagEffect: 'DECLINED_ANN',
            xpEffect: 1000,
          },
          {
            text: "Say nothing. Memorise the cabinet number. Tell Somchai in the morning.",
            nextId: 'd2_e_betray_01',
            karmaEffect: -80,
            flagEffect: 'BETRAYED_ANN',
            xpEffect: 20000,
          },
        ],
      },

      {
        id: 'd2_e_ally_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Slowly. Every page flat, every page with the date visible. If the corner is folded it is worthless in a hearing.",
        nextId: 'd2_e_ally_02',
      },
      {
        id: 'd2_e_ally_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "One more thing, and then you can decide whether you still want to be here. Page 61. The physician countersignature column for the KV-7 entries.",
        nextId: 'd2_e_ally_03',
      },
      {
        id: 'd2_e_ally_03',
        speaker: 'System',
        text: "Every KV-7 entry is countersigned by the same physician. Eleven months of them. The signature belongs to Dr. Bob.",
        nextId: 'd2_e_close',
      },

      {
        id: 'd2_e_neutral_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That is fair. That is genuinely fair and I will not hold it against you.",
        nextId: 'd2_e_neutral_02',
      },
      {
        id: 'd2_e_neutral_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "But understand what you are choosing. Not-knowing is not neutral in a building like this. Not-knowing is a service the administration provides free of charge, and you have just accepted it.",
        nextId: 'd2_e_neutral_03',
      },
      {
        id: 'd2_e_neutral_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Go home. Sleep badly. Everyone does.",
        nextId: 'd2_e_close',
      },

      {
        id: 'd2_e_betray_01',
        speaker: 'System',
        text: "07:10. The director's office. The carpet absorbs sound so completely that your own voice sounds borrowed.",
        nextId: 'd2_e_betray_02',
      },
      {
        id: 'd2_e_betray_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Cabinet 4, sub-level 1. Yes. I have known for eleven months.",
        nextId: 'd2_e_betray_03',
      },
      {
        id: 'd2_e_betray_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You are surprised. Do not be. A person investigating you is only dangerous when you cannot see them. Nurse Ann has been photographing that register with my full awareness since last October.",
        nextId: 'd2_e_betray_04',
      },
      {
        id: 'd2_e_betray_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "What I did not have was a witness who would tell me the moment she recruited someone. Now I do. Your training account has been credited. Do not check the amount in front of colleagues.",
        nextId: 'd2_e_betray_05',
      },
      {
        id: 'd2_e_betray_05',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "One correction, for accuracy. She is not doing this out of principle. Ask her about the second cohort. Ask her about the name on line nine.",
        nextId: 'd2_e_close',
      },

      {
        id: 'd2_e_close',
        speaker: 'System',
        text: "DAY 2 COMPLETE.",
      },
    ],
    cases: ['case_03_cardiac', 'case_01', 'case_02_fluids'],
  },

  /* ----------------------------------------------------------------------
   * DAY 3
   * ----------------------------------------------------------------------
   */
  3: {
    startOfDayCutscene: [
      {
        id: 'd3_s_01',
        speaker: 'System',
        text: "Day 3. 19:00. Rain. The broken doors let it in as far as the triage desk.",
        nextId: 'd3_s_02',
      },
      {
        id: 'd3_s_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You have been talking to Ann.",
        nextId: 'd3_s_03',
      },
      {
        id: 'd3_s_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Do not look at me like that, this department is eleven metres wide. I know who talks to whom and I know what it means when someone stops making eye contact with me at handover.",
        nextId: 'd3_s_04',
      },
      {
        id: 'd3_s_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Ask me. Whatever it is, ask me now, while I am sober and there is nobody bleeding.",
        choices: [
          {
            text: "\"Why is your signature on eleven months of KV-7?\"",
            nextId: 'd3_s_direct_01',
            karmaEffect: 20,
            flagEffect: 'CONFRONTED_BOB',
            xpEffect: 3000,
          },
          {
            text: "\"Nothing. Rounds.\" Keep him close and keep watching.",
            nextId: 'd3_s_quiet_01',
            karmaEffect: 0,
            flagEffect: 'WATCHING_BOB',
            xpEffect: 2000,
          },
        ],
      },

      {
        id: 'd3_s_direct_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Because I signed it.",
        nextId: 'd3_s_direct_02',
      },
      {
        id: 'd3_s_direct_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Not the way you are imagining. There is a stack. Every Friday the pharmacy sends up a stack of countersignatures, forty pages, and the department cannot dispense controlled drugs until a resident signs it.",
        nextId: 'd3_s_direct_03',
      },
      {
        id: 'd3_s_direct_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Forty pages, Friday afternoon, after a twenty-eight hour shift. I sign them the way you sign a delivery receipt. That is the whole crime. It is not a conspiracy. It is a man who is too tired to read.",
        nextId: 'd3_s_direct_04',
      },
      {
        id: 'd3_s_direct_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Which, if you think about it clearly for one second, is exactly what they were counting on. They did not need to corrupt anyone. They just needed to exhaust us and wait.",
        nextId: 'd3_s_join',
      },

      {
        id: 'd3_s_quiet_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Fine. Rounds.",
        nextId: 'd3_s_quiet_02',
      },
      {
        id: 'd3_s_quiet_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "For what it is worth, I have watched three interns learn to lie to me and every one of them thought they were the first. You are doing the thing where you agree too fast.",
        nextId: 'd3_s_join',
      },

      {
        id: 'd3_s_join',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Both of you. Resus 1. Now.",
        nextId: 'd3_s_06',
      },
      {
        id: 'd3_s_06',
        speaker: 'System',
        text: "Bed 12 of the medical ward has been brought down. Male, forty-four. Name on the band: Anuwat S. Temperature 39.8. Blood pressure 70 over 40. Blood in the urine bag, blood at the cannula site, blood at the gums.",
        nextId: 'd3_s_07',
      },
      {
        id: 'd3_s_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Platelets nine thousand. Fibrinogen unrecordable. He is in disseminated intravascular coagulation and there is no source. No pneumonia, no abscess, no bowel. Nothing.",
        nextId: 'd3_s_08',
      },
      {
        id: 'd3_s_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "What is running through the left arm? That bag has no pharmacy label. That bag has a handwritten label.",
        nextId: 'd3_s_09',
      },
      {
        id: 'd3_s_09',
        speaker: 'System',
        text: "The infusion bag reads, in marker: KV-7 / 40mg / PROTOCOL C / DO NOT DOCUMENT.",
        nextId: 'd3_s_10',
      },
      {
        id: 'd3_s_10',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Do not document.",
        nextId: 'd3_s_11',
      },
      {
        id: 'd3_s_11',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Bob. Look at his face. Look at his face properly.",
        nextId: 'd3_s_12',
      },
      {
        id: 'd3_s_12',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That is my brother.",
        nextId: 'd3_s_13',
      },
      {
        id: 'd3_s_13',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "He was admitted for a knee infection eight days ago. A knee. He signed a form for a nurse he had never met and I did not know he was in this building because they admitted him under his second given name.",
        nextId: 'd3_s_14',
      },
      {
        id: 'd3_s_14',
        speaker: 'System',
        text: "SHIFT START. RESUSCITATION IN PROGRESS.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd3_e_01',
        speaker: 'System',
        text: "05:20. Fourteen units of blood products. He is alive, sedated, and bleeding slower than he was.",
        nextId: 'd3_e_02',
      },
      {
        id: 'd3_e_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I am told there was an unlabelled infusion in my emergency department.",
        nextId: 'd3_e_03',
      },
      {
        id: 'd3_e_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I am also told the bag has gone missing between resus and the disposal room, which is unfortunate, because without it this is simply a case of sepsis with an unclear source. Which is what the discharge summary will say.",
        nextId: 'd3_e_04',
      },
      {
        id: 'd3_e_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I have the bag.",
        nextId: 'd3_e_05',
      },
      {
        id: 'd3_e_05',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Then you have removed clinical waste from a controlled area, which is a dismissible offence, and you have handled a specimen without chain of custody, which makes it inadmissible. Congratulations. You have destroyed your own evidence by holding it.",
        nextId: 'd3_e_06',
      },
      {
        id: 'd3_e_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Unless a physician witnessed the transfer and documents it contemporaneously. Then it is a preserved specimen.",
        nextId: 'd3_e_07',
      },
      {
        id: 'd3_e_07',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I am explaining the mechanism to you because I want you to appreciate that I am not afraid of it. Write what you like. Here is what I am offering instead.",
        nextId: 'd3_e_08',
      },
      {
        id: 'd3_e_08',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "KV-7 is an anticoagulation reversal compound in phase two. It has failed in this man. It has also, in nineteen of twenty-two patients, stopped a gastrointestinal haemorrhage that would otherwise have killed them within the hour.",
        nextId: 'd3_e_09',
      },
      {
        id: 'd3_e_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The ethics submission has been sitting with the national committee for three years. Three years is one thousand and ninety-five days of people bleeding to death in this department while a form moves between desks.",
        nextId: 'd3_e_10',
      },
      {
        id: 'd3_e_10',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Do not let him do this. Do not let him make it sound reasonable. My brother did not consent to anything. He signed a knee.",
        nextId: 'd3_e_11',
      },
      {
        id: 'd3_e_11',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Doctor. A research fellowship exists. Co-investigator on Protocol C, a named position, funded, with a publication record that will place you anywhere in the world you wish to go. Or a witness statement. Both are pieces of paper. Only one of them has a future attached.",
        choices: [
          {
            text: "Document the chain of custody. Every line. Sign it in front of him.",
            nextId: 'd3_e_witness_01',
            karmaEffect: 80,
            flagEffect: 'PRESERVED_EVIDENCE',
            xpEffect: 5000,
          },
          {
            text: "Take the fellowship. Somebody will run this trial. Better someone who cares.",
            nextId: 'd3_e_fellow_01',
            karmaEffect: -70,
            flagEffect: 'JOINED_PROTOCOL_C',
            xpEffect: 30000,
          },
          {
            text: "\"I need to treat the patient first. Ask me again when he stops bleeding.\"",
            nextId: 'd3_e_stall_01',
            karmaEffect: 20,
            flagEffect: 'STALLED_SOMCHAI',
            xpEffect: 4000,
          },
        ],
      },

      {
        id: 'd3_e_witness_01',
        speaker: 'System',
        text: "Time. Date. Location of the bag when first observed. Person who removed it. Person who received it. Signature.",
        nextId: 'd3_e_witness_02',
      },
      {
        id: 'd3_e_witness_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Very good. That document now exists and it will be extremely difficult for me, and it will not save anyone tonight, and in four days you will understand what it cost.",
        nextId: 'd3_e_witness_03',
      },
      {
        id: 'd3_e_witness_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I will countersign it.",
        nextId: 'd3_e_witness_04',
      },
      {
        id: 'd3_e_witness_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "My name is on eleven months of that register, Somchai. If this goes to a hearing I am finished either way. I would rather be finished on the correct side of it, once, at the end.",
        nextId: 'd3_e_close',
      },

      {
        id: 'd3_e_fellow_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Sensible again. You are becoming predictable in the most valuable way.",
        nextId: 'd3_e_fellow_02',
      },
      {
        id: 'd3_e_fellow_02',
        speaker: 'System',
        text: "Ann does not shout. She looks at you for four seconds and then returns to her brother and adjusts his blanket, and that is worse.",
        nextId: 'd3_e_fellow_03',
      },
      {
        id: 'd3_e_fellow_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "You will do good work. That is the horrible part. You will genuinely make it safer, and every improvement you make will be one more reason it never stops.",
        nextId: 'd3_e_close',
      },

      {
        id: 'd3_e_stall_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You are stalling. That is not a criticism, it is the correct move, and I am mildly impressed.",
        nextId: 'd3_e_stall_02',
      },
      {
        id: 'd3_e_stall_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I will ask again. I always ask again, and the offer is worse every time, because urgency is the only thing that has ever moved a doctor.",
        nextId: 'd3_e_stall_03',
      },
      {
        id: 'd3_e_stall_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "You bought a day. Use it. I am not going to be able to be useful tomorrow, I am going to be a sister sitting in a chair.",
        nextId: 'd3_e_close',
      },

      {
        id: 'd3_e_close',
        speaker: 'System',
        text: "DAY 3 COMPLETE.",
      },
    ],
    cases: ['case_04_svt', 'case_05_asthma', 'case_01'],
  },

  /* ----------------------------------------------------------------------
   * DAY 4
   * ----------------------------------------------------------------------
   */
  4: {
    startOfDayCutscene: [
      {
        id: 'd4_s_01',
        speaker: 'System',
        text: "Day 4. 18:30. Anuwat is stable on the intensive care unit. Ann has not gone home in thirty-one hours.",
        nextId: 'd4_s_02',
      },
      {
        id: 'd4_s_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I need eight minutes and I need you to not interrupt, because if you interrupt I will lose the thread and I will not find it again.",
        nextId: 'd4_s_03',
      },
      {
        id: 'd4_s_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Fourteen months ago a woman came in with a variceal bleed. Twenty-six years old. We had no blood. Actual zero. The bank was empty because a bus had gone off the expressway that morning.",
        nextId: 'd4_s_04',
      },
      {
        id: 'd4_s_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Somchai came down himself. He was carrying a cold box. He said, this will stop it, it is not licensed, she has forty minutes. And I said yes. I did not read a protocol. I said yes because she was twenty-six and I was watching her drown in her own stomach.",
        nextId: 'd4_s_05',
      },
      {
        id: 'd4_s_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "It worked. Nine minutes. I have never seen anything work like that.",
        nextId: 'd4_s_06',
      },
      {
        id: 'd4_s_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "And then he had me. Not with money. With the memory of it working. Every Friday since then I have signed that stack, and I have told myself I was not reading it, and I was not reading it, and I knew exactly what was in it.",
        nextId: 'd4_s_07',
      },
      {
        id: 'd4_s_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "That is what a cut corner is. It is not a decision. It is the first one, and then it is a shape your hand has learned.",
        nextId: 'd4_s_08',
      },
      {
        id: 'd4_s_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Tomorrow there is a mortality review. Anuwat's case. Somchai chairs it. Somebody is going to be named as the physician who administered an unapproved compound.",
        nextId: 'd4_s_09',
      },
      {
        id: 'd4_s_09',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "It should be me. I want it to be me. I am telling you now because tomorrow I will lose my nerve, and when I lose my nerve I am persuasive, and you will need to remember this version of me.",
        choices: [
          {
            text: "\"Then we go in together. Two names on the disclosure.\"",
            nextId: 'd4_s_together_01',
            karmaEffect: 50,
            flagEffect: 'STOOD_WITH_BOB',
            xpEffect: 4000,
          },
          {
            text: "\"No. You have nine years of patients ahead of you. I'll carry it.\"",
            nextId: 'd4_s_shield_01',
            karmaEffect: 40,
            flagEffect: 'SHIELDED_BOB',
            xpEffect: 2000,
          },
          {
            text: "\"You're right. It should be you. I'll confirm it at the review.\"",
            nextId: 'd4_s_betray_01',
            karmaEffect: -30,
            flagEffect: 'BETRAYED_BOB',
            xpEffect: 15000,
          },
        ],
      },

      {
        id: 'd4_s_together_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "That is a stupid thing to do and I am not going to talk you out of it, which tells you something about how alone I have been.",
        nextId: 'd4_s_close',
      },
      {
        id: 'd4_s_shield_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "No. Absolutely not. You have been here four days.",
        nextId: 'd4_s_shield_02',
      },
      {
        id: 'd4_s_shield_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "...And you are going to do it anyway, and Somchai will accept it in eleven seconds because a disposable intern is exactly the shape of hole he needs filled. Do you understand that he wins either way?",
        nextId: 'd4_s_close',
      },
      {
        id: 'd4_s_betray_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Right. Yes. Good.",
        nextId: 'd4_s_betray_02',
      },
      {
        id: 'd4_s_betray_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I asked for that. I did ask for that. I am noticing that I wanted you to argue, which is a childish thing to want at thirty-six.",
        nextId: 'd4_s_close',
      },

      {
        id: 'd4_s_close',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd4_e_01',
        speaker: 'System',
        text: "06:00. Committee room 2. Nine chairs. Four are occupied. The minutes are being taken by a secretary who does not look up once.",
        nextId: 'd4_e_02',
      },
      {
        id: 'd4_e_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Mortality and morbidity review. Patient Anuwat S. Presumed source sepsis with secondary coagulopathy. The department requires a responsible clinician recorded against the coagulopathy.",
        nextId: 'd4_e_03',
      },
      {
        id: 'd4_e_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I will note for the committee that the ward nurse who prepared the infusion is Nurse Ann, and that she is the patient's sister, and that she accessed his record forty times in eight days.",
        nextId: 'd4_e_04',
      },
      {
        id: 'd4_e_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I accessed it because he is my brother and nobody told me he was here.",
        nextId: 'd4_e_05',
      },
      {
        id: 'd4_e_05',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Which is precisely how it will read in the summary. An emotionally involved nurse, unauthorised record access, an unlabelled bag she personally removed from clinical waste. That is a complete and coherent account and it takes eleven minutes to write.",
        nextId: 'd4_e_06',
      },
      {
        id: 'd4_e_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The committee requires one physician to attest. Doctor. The floor is yours.",
        choices: [
          {
            text: "\"The compound is KV-7. It came from this hospital's research programme. Director Somchai supplied it.\"",
            nextId: 'd4_e_truth_01',
            karmaEffect: 90,
            flagEffect: 'ACCUSED_SOMCHAI',
            xpEffect: 6000,
          },
          {
            text: "\"Dr. Bob administered it.\"",
            nextId: 'd4_e_bob_01',
            karmaEffect: -50,
            flagEffect: 'NAMED_BOB_AT_REVIEW',
            xpEffect: 18000,
          },
          {
            text: "\"I administered it. It was my error.\"",
            nextId: 'd4_e_self_01',
            karmaEffect: 60,
            flagEffect: 'TOOK_THE_FALL',
            xpEffect: 3000,
          },
          {
            text: "\"Nurse Ann prepared the infusion.\"",
            nextId: 'd4_e_ann_01',
            karmaEffect: -100,
            flagEffect: 'SCAPEGOATED_ANN',
            xpEffect: 25000,
          },
        ],
      },

      {
        id: 'd4_e_truth_01',
        speaker: 'System',
        text: "The secretary stops writing. It is the first time she has looked up.",
        nextId: 'd4_e_truth_02',
      },
      {
        id: 'd4_e_truth_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Strike that from the minutes. It is an allegation, not a clinical finding, and this is a clinical committee.",
        nextId: 'd4_e_truth_03',
      },
      {
        id: 'd4_e_truth_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Do not strike it. I countersigned the register that dispensed it. Eleven months. That is a clinical finding and it is mine.",
        nextId: 'd4_e_truth_04',
      },
      {
        id: 'd4_e_truth_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Then this committee is suspended pending an internal investigation which I will be appointing. Everyone in this room is now the subject of it. Enjoy the remainder of your shift.",
        nextId: 'd4_e_close_01',
      },

      {
        id: 'd4_e_bob_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Confirmed. I administered it.",
        nextId: 'd4_e_bob_02',
      },
      {
        id: 'd4_e_bob_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Recorded. Dr. Bob is suspended from clinical duties pending review. Hand your access card to the secretary on the way out.",
        nextId: 'd4_e_bob_03',
      },
      {
        id: 'd4_e_bob_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You did what I asked you to do. I want that on the record too, actually, because in about six months you are going to tell yourself a different story about this morning.",
        nextId: 'd4_e_close_01',
      },

      {
        id: 'd4_e_self_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "An intern, four days into service, independently obtained and administered an unlicensed compound. The committee accepts this account.",
        nextId: 'd4_e_self_02',
      },
      {
        id: 'd4_e_self_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "It accepts it because it is convenient, and you have just learned that the truth and the accepted account are two different documents kept in two different drawers.",
        nextId: 'd4_e_self_03',
      },
      {
        id: 'd4_e_self_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Why. Tell me why, because I have to live with it now as well.",
        nextId: 'd4_e_self_04',
      },
      {
        id: 'd4_e_self_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Because they had a shape of hole and someone was going to fall in it, Ann. And the newest one is always cheapest.",
        nextId: 'd4_e_close_01',
      },

      {
        id: 'd4_e_ann_01',
        speaker: 'System',
        text: "Ann does not move. She has been awake for thirty-one hours and her brother is two floors up on a ventilator.",
        nextId: 'd4_e_ann_02',
      },
      {
        id: 'd4_e_ann_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Recorded. Nurse Ann is suspended, and referred to the nursing council, and escorted from the premises within the hour.",
        nextId: 'd4_e_ann_03',
      },
      {
        id: 'd4_e_ann_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "No. No, absolutely not, I administered it, I am saying it now, in the room, into the minutes.",
        nextId: 'd4_e_ann_04',
      },
      {
        id: 'd4_e_ann_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The committee has an attestation from the receiving physician. Yours is a retraction offered under emotional circumstances. It carries no weight. Sit down, Dr. Bob.",
        nextId: 'd4_e_ann_05',
      },
      {
        id: 'd4_e_ann_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Eleven years. I have carried this department on my back for eleven years.",
        nextId: 'd4_e_ann_06',
      },
      {
        id: 'd4_e_ann_06',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Everything I have is copied. Every page. And I no longer have a career to protect, which means I have nothing left to be careful with.",
        nextId: 'd4_e_close_01',
      },

      {
        id: 'd4_e_close_01',
        speaker: 'System',
        text: "07:04. On sub-level 2, in a corridor that does not appear on the fire evacuation map, an oxygen manifold has been running above rated pressure for six weeks. Maintenance ticket 4470. Status: pending.",
        nextId: 'd4_e_close_02',
      },
      {
        id: 'd4_e_close_02',
        speaker: 'System',
        text: "DAY 4 COMPLETE.",
      },
    ],
    cases: ['case_03_cardiac', 'case_06_trauma', 'case_02_fluids'],
  },

  /* ----------------------------------------------------------------------
   * DAY 5: YEAR 1 FINALE
   * ----------------------------------------------------------------------
   */
  5: {
    startOfDayCutscene: [
      {
        id: 'd5_s_01',
        speaker: 'System',
        text: "Day 5. 17:00. The department is full and calm, which is the way it always is before.",
        nextId: 'd5_s_check',
      },
      {
        id: 'd5_s_check',
        speaker: 'System',
        text: "[ROUTER] Resolving standing of the team.",
        choices: [
          { text: '[IF_FLAG:SCAPEGOATED_ANN]', nextId: 'd5_s_ann_gone_01' },
          { text: '[IF_FLAG:NAMED_BOB_AT_REVIEW]', nextId: 'd5_s_bob_gone_01' },
          { text: '[ELSE]', nextId: 'd5_s_intact_01' },
        ],
      },
      {
        id: 'd5_s_ann_gone_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Her locker was cleared by security. They photographed the inside of it. For a nurse.",
        nextId: 'd5_s_ann_gone_02',
      },
      {
        id: 'd5_s_ann_gone_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "She is in the building. Do not look at me like that, of course she is in the building, her brother is on the fourth floor and she has a visitor pass like any other member of the public.",
        nextId: 'd5_s_join',
      },
      {
        id: 'd5_s_bob_gone_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Bob is suspended. He came in anyway. He is sitting in the doctors' room in his own clothes reading a chart he is not allowed to touch.",
        nextId: 'd5_s_bob_gone_02',
      },
      {
        id: 'd5_s_bob_gone_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "He has nowhere else. That is not an accusation aimed at you, it is a description of a man.",
        nextId: 'd5_s_join',
      },
      {
        id: 'd5_s_intact_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The internal investigation was announced at 09:00 and by 11:00 it had appointed itself a chairman. Guess who.",
        nextId: 'd5_s_intact_02',
      },
      {
        id: 'd5_s_intact_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "We have until it publishes. Days, maybe. Then the record becomes whatever he writes and everything after that is a complaint against a finished document.",
        nextId: 'd5_s_join',
      },
      {
        id: 'd5_s_join',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "There is a thing I have not told you, and I am telling you now because after tonight there may not be a good moment.",
        nextId: 'd5_s_03',
      },
      {
        id: 'd5_s_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Protocol C consent forms. I found the archive box. Ninety-one signed consents for a trial that has no ethics approval.",
        nextId: 'd5_s_04',
      },
      {
        id: 'd5_s_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Forty of them are countersigned by the admitting physician. Dated across the last eleven months.",
        nextId: 'd5_s_05',
      },
      {
        id: 'd5_s_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Twelve of them are dated this week.",
        nextId: 'd5_s_06',
      },
      {
        id: 'd5_s_06',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Twelve of them have your name on them. Your signature. The one you have been putting on forty pages of admission paperwork every night since Monday because that is what an intern does at four in the morning.",
        nextId: 'd5_s_07',
      },
      {
        id: 'd5_s_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "That is the machine. That is the whole machine, and it took him four days to fit you into it.",
        nextId: 'd5_s_08',
      },
      {
        id: 'd5_s_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The originals are in the research annex. Sub-level 2. The server with the outcome data is in the same room, and the data is what matters, because the data is the only thing that proves the deaths were not sepsis.",
        nextId: 'd5_s_09',
      },
      {
        id: 'd5_s_09',
        speaker: 'System',
        text: "SHIFT START. 17:20.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd5_e_01',
        speaker: 'System',
        text: "03:41.",
        nextId: 'd5_e_02',
      },
      {
        id: 'd5_e_02',
        speaker: 'System',
        text: "The sound arrives before the shaking does. It comes up through the floor rather than through the air, and every ceiling tile in the department lifts two centimetres and comes back down.",
        nextId: 'd5_e_03',
      },
      {
        id: 'd5_e_03',
        speaker: 'System',
        text: "SUB-LEVEL 2. OXYGEN MANIFOLD FAILURE. RESEARCH ANNEX.",
        nextId: 'd5_e_04',
      },
      {
        id: 'd5_e_04',
        speaker: 'System',
        text: "The lights go to emergency amber. The suction fails. The piped oxygen pressure alarm sounds on every wall panel at once, which is a noise most staff have only heard in training.",
        nextId: 'd5_e_05',
      },
      {
        id: 'd5_e_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Ventilated patients to bag-valve. Now. Every one of them. Somebody count the tubes, I want a number, I do not want a feeling.",
        nextId: 'd5_e_06',
      },
      {
        id: 'd5_e_06',
        speaker: 'System',
        text: "Smoke is coming up the east stairwell. The fire doors on sub-level 2 have failed to release because they are controlled by a panel that was disabled during a renovation eight months ago.",
        nextId: 'd5_e_07',
      },
      {
        id: 'd5_e_07',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Nobody goes down. That is a direct instruction from the incident commander and I am the incident commander.",
        nextId: 'd5_e_08',
      },
      {
        id: 'd5_e_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "There are three night technicians on sub-level 2.",
        nextId: 'd5_e_09',
      },
      {
        id: 'd5_e_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "There are two. And the fire service arrives in nine minutes and they are equipped for this and you are not.",
        nextId: 'd5_e_10',
      },
      {
        id: 'd5_e_10',
        speaker: 'System',
        text: "Ann is not at the nursing station. Ann's phone is on the counter, face up, screen still lit. The last thing on it is a photograph of an archive box lid, taken at 03:29, twelve minutes ago, on sub-level 2.",
        nextId: 'd5_e_11',
      },
      {
        id: 'd5_e_11',
        speaker: 'System',
        text: "Three things are happening at once and there is time for one.",
        nextId: 'd5_e_12',
      },
      {
        id: 'd5_e_12',
        speaker: 'System',
        text: "The east stairwell. The corridor where a ventilated patient is being hand-bagged by a single second-year nurse who is losing the airway. And the amber light on the wall panel that says the fire service is four minutes out, not nine.",
        choices: [
          {
            text: "Go down the east stairwell for Ann.",
            nextId: 'd5_e_ann_01',
            karmaEffect: 70,
            flagEffect: 'WENT_BACK_FOR_ANN',
            xpEffect: 10000,
          },
          {
            text: "Go down for the server and the consent originals. It is the only proof that will ever exist.",
            nextId: 'd5_e_data_01',
            karmaEffect: -20,
            flagEffect: 'SAVED_THE_EVIDENCE',
            xpEffect: 40000,
          },
          {
            text: "Stay. Take the airway in the corridor.",
            nextId: 'd5_e_patient_01',
            karmaEffect: 50,
            flagEffect: 'STAYED_WITH_PATIENT',
            xpEffect: 8000,
          },
        ],
      },

      {
        id: 'd5_e_ann_01',
        speaker: 'System',
        text: "Sub-level 2 is black at chest height and clear at knee height. You find her at the annex door with a fractured tibia and a lid from an archive box that is empty.",
        nextId: 'd5_e_ann_02',
      },
      {
        id: 'd5_e_ann_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The box was already empty. The box was empty before the manifold went. Do you understand what that means?",
        nextId: 'd5_e_ann_03',
      },
      {
        id: 'd5_e_ann_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Somebody moved ninety-one consent forms out of a locked annex two hours before an accident happened in that exact room.",
        nextId: 'd5_e_final_01',
      },

      {
        id: 'd5_e_data_01',
        speaker: 'System',
        text: "The annex door is warm. The server rack is intact behind a wall that is not. You pull two drives and the consent box and you are back at the stairwell in ninety seconds.",
        nextId: 'd5_e_data_02',
      },
      {
        id: 'd5_e_data_02',
        speaker: 'System',
        text: "The consent box is empty. It was empty when you lifted it. It has been empty for hours.",
        nextId: 'd5_e_data_03',
      },
      {
        id: 'd5_e_data_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Ann is in the west stairwell with a broken leg and a lungful of smoke and she was there for six minutes on her own. She will live. She will know exactly how long six minutes is.",
        nextId: 'd5_e_final_01',
      },

      {
        id: 'd5_e_patient_01',
        speaker: 'System',
        text: "You take the airway. You hand-bag a sixty-year-old man through eleven minutes of failed piped oxygen and he does not desaturate below eighty-eight percent, and he goes home nine days later.",
        nextId: 'd5_e_patient_02',
      },
      {
        id: 'd5_e_patient_02',
        speaker: 'System',
        text: "The fire service brings Ann up at 04:02. Fractured tibia, smoke inhalation, conscious. She is holding an archive box lid. The box it belonged to is empty and was empty when she reached it.",
        nextId: 'd5_e_patient_03',
      },
      {
        id: 'd5_e_patient_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "You made the right call. I am saying that now, in case I am not generous later.",
        nextId: 'd5_e_final_01',
      },

      {
        id: 'd5_e_final_01',
        speaker: 'System',
        text: "06:30. The fire is out. Two technicians are dead. The department is running on a portable oxygen supply in a car park under a plastic canopy.",
        nextId: 'd5_e_final_02',
      },
      {
        id: 'd5_e_final_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "A maintenance failure. Tragic, foreseeable, and entirely the responsibility of a contractor who will be named in the press release at 09:00.",
        nextId: 'd5_e_final_03',
      },
      {
        id: 'd5_e_final_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The research annex is a total loss. Eleven months of data, gone. Terrible. I have already told the board that the programme cannot continue.",
        nextId: 'd5_e_final_04',
      },
      {
        id: 'd5_e_final_04',
        speaker: 'System',
        text: "He is holding a document folder. It is not soot-stained. It is not warm. It has been in his office all night.",
        nextId: 'd5_e_final_05',
      },
      {
        id: 'd5_e_final_05',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "One last thing, and then I will let you all go home and shower.",
        nextId: 'd5_e_final_06',
      },
      {
        id: 'd5_e_final_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Protocol C is not my programme. I do not have the standing to authorise a multi-site trial and I never did. I am a hospital director in a country with four hundred hospital directors.",
        nextId: 'd5_e_final_07',
      },
      {
        id: 'd5_e_final_07',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I am the site coordinator. There are six sites. KV-7 has been in patients in three provinces for two years and the annex that burned tonight held the copies, not the originals.",
        nextId: 'd5_e_final_08',
      },
      {
        id: 'd5_e_final_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Then who signs off the protocol.",
        nextId: 'd5_e_final_09',
      },
      {
        id: 'd5_e_final_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The national ethics committee. The same committee that has been sitting on the approval for three years. They have been sitting on it because the trial has been running underneath it the entire time, and the approval, when it comes, will be backdated.",
        nextId: 'd5_e_final_10',
      },
      {
        id: 'd5_e_final_10',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "So when you write to the medical council, and you will, address it carefully. Half of them are named on the protocol.",
        nextId: 'd5_e_final_11',
      },
      {
        id: 'd5_e_final_11',
        speaker: 'System',
        text: "YEAR 1 COMPLETE.",
        nextId: 'd5_e_final_12',
      },
      {
        id: 'd5_e_final_12',
        speaker: 'System',
        text: "TWELVE MONTHS PASS.",
      },
    ],
    cases: ['case_06_trauma', 'case_03_cardiac', 'case_01', 'case_06_trauma'],
  },

  /* =======================================================================
   * YEAR 2: "THE ACCEPTED ACCOUNT"
   * =======================================================================
   */

  /* ----------------------------------------------------------------------
   * DAY 6
   * ----------------------------------------------------------------------
   */
  6: {
    startOfDayCutscene: [
      {
        id: 'd6_s_01',
        speaker: 'System',
        text: "YEAR 2. DAY 6. Twelve months after the fire.",
        nextId: 'd6_s_02',
      },
      {
        id: 'd6_s_02',
        speaker: 'System',
        text: "The emergency department has new doors. They work. There is a plaque by the entrance thanking the family of Khun Wichai for the refurbishment.",
        nextId: 'd6_s_03',
      },
      {
        id: 'd6_s_03',
        speaker: 'System',
        text: "You are a second-year resident. You have your own interns now. Two of them. They buy white shoes.",
        nextId: 'd6_s_check',
      },
      {
        id: 'd6_s_check',
        speaker: 'System',
        text: "[ROUTER] Resolving Year 1 standing.",
        choices: [
          { text: '[IF_FLAG:SCAPEGOATED_ANN]', nextId: 'd6_s_ann_out_01' },
          { text: '[IF_FLAG:NAMED_BOB_AT_REVIEW]', nextId: 'd6_s_bob_out_01' },
          { text: '[IF_FLAG:JOINED_PROTOCOL_C]', nextId: 'd6_s_bought_01' },
          { text: '[ELSE]', nextId: 'd6_s_standard_01' },
        ],
      },
      {
        id: 'd6_s_ann_out_01',
        speaker: 'System',
        text: "Nurse Ann was struck from the nursing register in February. She works nights at a private clinic in Nonthaburi that pays half what this one did.",
        nextId: 'd6_s_ann_out_02',
      },
      {
        id: 'd6_s_ann_out_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "She sends me a message on the first of every month. Two words. The date of the hearing you testified at. Nothing else. Twelve of them now.",
        nextId: 'd6_s_join',
      },
      {
        id: 'd6_s_bob_out_01',
        speaker: 'System',
        text: "Dr. Bob was suspended for nine months and reinstated in March under supervision. He is no longer permitted to run the department overnight.",
        nextId: 'd6_s_bob_out_02',
      },
      {
        id: 'd6_s_bob_out_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "He is thinner. He is on time every single day, which he never was before, and somehow that is the part that worries me.",
        nextId: 'd6_s_join',
      },
      {
        id: 'd6_s_bought_01',
        speaker: 'System',
        text: "You are a named co-investigator on Protocol C. Two publications. An invited lecture in Singapore in November.",
        nextId: 'd6_s_bought_02',
      },
      {
        id: 'd6_s_bought_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I read the second paper. The safety section is well written. You reduced the dose after the coagulopathy signal, which nobody else would have done, and eleven people are alive because of it.",
        nextId: 'd6_s_bought_03',
      },
      {
        id: 'd6_s_bought_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I still will not sit at the same table as you.",
        nextId: 'd6_s_join',
      },
      {
        id: 'd6_s_standard_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Twelve months, four complaints, two anonymous letters, one investigation that investigated itself and found itself blameless.",
        nextId: 'd6_s_standard_02',
      },
      {
        id: 'd6_s_standard_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "And KV-7 is still going into people. Not here. Three provinces away, where nobody has a register they trust.",
        nextId: 'd6_s_join',
      },
      {
        id: 'd6_s_join',
        speaker: 'System',
        text: "08:00. An email arrives, addressed to eleven staff members, from an address ending in .go.th.",
        nextId: 'd6_s_05',
      },
      {
        id: 'd6_s_05',
        speaker: 'System',
        text: "MINISTRY OF PUBLIC HEALTH. OFFICE OF INSPECTION. Formal inquiry into adverse events at Rama Central, including but not limited to the sub-level 2 incident. Depositions begin Thursday. Attendance is not optional.",
        nextId: 'd6_s_06',
      },
      {
        id: 'd6_s_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Good. About time. I requested this inquiry in January.",
        nextId: 'd6_s_07',
      },
      {
        id: 'd6_s_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You requested it.",
        nextId: 'd6_s_08',
      },
      {
        id: 'd6_s_08',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "A hospital that requests an inspection sets the terms of reference. A hospital that receives one does not. You are looking at me as though I have done something clever, and I have done something ordinary. Every director does this.",
        nextId: 'd6_s_09',
      },
      {
        id: 'd6_s_09',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd6_e_01',
        speaker: 'System',
        text: "Thursday. Deposition room. A ministry inspector, a stenographer, and a recording device with a red light.",
        nextId: 'd6_e_02',
      },
      {
        id: 'd6_e_02',
        speaker: 'System',
        text: "INSPECTOR: You were on duty during the sub-level 2 incident. You have been asked whether you have any knowledge of an unapproved compound designated KV-7 being administered in this hospital. The question is on the record.",
        nextId: 'd6_e_03',
      },
      {
        id: 'd6_e_03',
        speaker: 'System',
        text: "Before you entered the room, an envelope was left in your locker. Inside is a single page: a Protocol C consent form dated eleven months ago, with your signature on the physician line, and a note in blue ink.",
        nextId: 'd6_e_04',
      },
      {
        id: 'd6_e_04',
        speaker: 'System',
        text: "The note reads: 'There are eleven more of these. You will be asked one question. Answer it carefully.'",
        nextId: 'd6_e_05',
      },
      {
        id: 'd6_e_05',
        speaker: 'System',
        text: "The red light is on. The stenographer is waiting.",
        choices: [
          {
            text: "Tell the inspector everything. Including the twelve forms with your name on them.",
            nextId: 'd6_e_all_01',
            karmaEffect: 90,
            flagEffect: 'TESTIFIED_FULLY',
            xpEffect: 12000,
          },
          {
            text: "Testify about KV-7. Say nothing about your own signatures.",
            nextId: 'd6_e_partial_01',
            karmaEffect: 20,
            flagEffect: 'TESTIFIED_PARTIALLY',
            xpEffect: 15000,
          },
          {
            text: "\"I have no knowledge of any such compound.\"",
            nextId: 'd6_e_deny_01',
            karmaEffect: -80,
            flagEffect: 'PERJURED_SELF',
            xpEffect: 25000,
          },
        ],
      },

      {
        id: 'd6_e_all_01',
        speaker: 'System',
        text: "It takes fifty minutes. The stenographer asks you to spell KV-7 twice. At the end the inspector asks whether you understand that you have described your own misconduct.",
        nextId: 'd6_e_all_02',
      },
      {
        id: 'd6_e_all_02',
        speaker: 'System',
        text: "You say yes. She writes that down too.",
        nextId: 'd6_e_all_03',
      },
      {
        id: 'd6_e_all_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "That was brave and it was worth nothing. You have handed a national committee a document naming you and me. They will act on the half of it that is disposable.",
        nextId: 'd6_e_close',
      },

      {
        id: 'd6_e_partial_01',
        speaker: 'System',
        text: "You describe the register, the unlabelled bag, the handwritten label. You do not describe an envelope in a locker.",
        nextId: 'd6_e_partial_02',
      },
      {
        id: 'd6_e_partial_02',
        speaker: 'System',
        text: "INSPECTOR: The forty countersigned consents. Are any of the signatures yours?",
        nextId: 'd6_e_partial_03',
      },
      {
        id: 'd6_e_partial_03',
        speaker: 'System',
        text: "You say you would need to review the documents. The inspector notes the answer without comment, which is worse than a challenge.",
        nextId: 'd6_e_close',
      },

      {
        id: 'd6_e_deny_01',
        speaker: 'System',
        text: "Six words. The stenographer types them in under two seconds and they will exist for the rest of your professional life.",
        nextId: 'd6_e_deny_02',
      },
      {
        id: 'd6_e_deny_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I was outside the door. I could hear the room.",
        nextId: 'd6_e_deny_03',
      },
      {
        id: 'd6_e_deny_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Fourteen months ago I stood where you just stood and said something almost identical, and I have thought about it every single day since, and I am going to tell you the thing nobody told me. It does not get lighter. You just get stronger in one shoulder.",
        nextId: 'd6_e_close',
      },

      {
        id: 'd6_e_close',
        speaker: 'System',
        text: "DAY 6 COMPLETE.",
      },
    ],
    cases: ['case_01', 'case_03_cardiac', 'case_05_asthma'],
  },

  /* ----------------------------------------------------------------------
   * DAY 7
   * ----------------------------------------------------------------------
   */
  7: {
    startOfDayCutscene: [
      {
        id: 'd7_s_01',
        speaker: 'System',
        text: "Day 7. The director's office. It has been redecorated. The chairs are lower than his.",
        nextId: 'd7_s_02',
      },
      {
        id: 'd7_s_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Chief resident. From September. The post is mine to give and I am giving it to a second-year, which will cause a great deal of noise that I will absorb.",
        nextId: 'd7_s_03',
      },
      {
        id: 'd7_s_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "With it comes the Continuity Programme. Ministry-registered, ethics-approved as of March, three sites, and a compound designated CR-1.",
        nextId: 'd7_s_04',
      },
      {
        id: 'd7_s_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "CR-1 is KV-7. Same molecule, new designation, legal paperwork, real consent forms, an independent safety board. Everything you and Nurse Ann said should exist, now exists.",
        nextId: 'd7_s_05',
      },
      {
        id: 'd7_s_05',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "It exists because two years of illegal data made the approval possible. That is not a moral argument. That is a chronology, and you may do with it whatever you like.",
        nextId: 'd7_s_06',
      },
      {
        id: 'd7_s_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The programme needs a site principal investigator with clinical credibility. I am fifty-eight and I am radioactive. You are twenty-eight and you have a ministry deposition on file, which paradoxically makes you the cleanest signature in the building.",
        nextId: 'd7_s_07',
      },
      {
        id: 'd7_s_07',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Say yes and you control the dosing protocol, the exclusion criteria, and the stopping rules. Say no and it goes to a man in Chiang Rai who has never seen a patient bleed out in front of him.",
        choices: [
          {
            text: "Accept. Take control of the protocol from the inside.",
            nextId: 'd7_s_accept_01',
            karmaEffect: -20,
            flagEffect: 'TOOK_THE_PROGRAMME',
            xpEffect: 35000,
          },
          {
            text: "Refuse. \"It is the same drug and the same man and I am not laundering either.\"",
            nextId: 'd7_s_refuse_01',
            karmaEffect: 50,
            flagEffect: 'REFUSED_THE_PROGRAMME',
            xpEffect: 5000,
          },
          {
            text: "\"I'll take it. On the condition that Ann is reinstated and sits on the safety board.\"",
            nextId: 'd7_s_terms_01',
            karmaEffect: 40,
            flagEffect: 'TOOK_PROGRAMME_WITH_ANN',
            xpEffect: 20000,
          },
        ],
      },

      {
        id: 'd7_s_accept_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Good. You will find the work absorbing, and in eighteen months you will not be able to say precisely when you stopped arguing with me.",
        nextId: 'd7_s_join',
      },

      {
        id: 'd7_s_refuse_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Then it goes to Chiang Rai on Monday and the stopping rules will be written by a committee that has never held pressure on anything.",
        nextId: 'd7_s_refuse_02',
      },
      {
        id: 'd7_s_refuse_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You have kept your hands clean. I want you to be very clear, in your own mind, about who paid for that.",
        nextId: 'd7_s_join',
      },

      {
        id: 'd7_s_terms_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You want me to reinstate a nurse who has spent two years building a case against me, and seat her on the board that reviews my deaths.",
        nextId: 'd7_s_terms_02',
      },
      {
        id: 'd7_s_terms_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Yes. Fine. Do you know why? Because a safety board with a known critic on it is the single most persuasive document I could show an inspector, and you have just made my programme unassailable while believing you constrained it.",
        nextId: 'd7_s_terms_03',
      },
      {
        id: 'd7_s_terms_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "That is not sarcasm. It is a genuine warning. Everything you do to make this thing honest also makes it permanent.",
        nextId: 'd7_s_join',
      },

      {
        id: 'd7_s_join',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd7_e_01',
        speaker: 'System',
        text: "22:40. The doctors' room. Bob has been waiting for you with the door closed.",
        nextId: 'd7_e_02',
      },
      {
        id: 'd7_e_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Chief resident. Congratulations. I mean that in about sixty percent of the available senses.",
        nextId: 'd7_e_03',
      },
      {
        id: 'd7_e_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I applied for it. Four years running. Last year he told me in this room that I lacked the temperament, and he was correct, which is the only reason it still hurts.",
        nextId: 'd7_e_04',
      },
      {
        id: 'd7_e_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I am not going to make it your problem. I have made enough things your problem. I am going to say one thing and then we are going to talk about bed occupancy like adults.",
        nextId: 'd7_e_05',
      },
      {
        id: 'd7_e_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "The chief resident signs the controlled drug register. Forty pages. Every Friday.",
        nextId: 'd7_e_06',
      },
      {
        id: 'd7_e_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "It will be waiting on your desk at four in the afternoon at the end of a twenty-eight hour shift. That is not an accident of scheduling. It has never once been an accident of scheduling.",
        nextId: 'd7_e_07',
      },
      {
        id: 'd7_e_07',
        speaker: 'System',
        text: "Ann appears in the doorway with a folded sheet of paper and does not come in.",
        nextId: 'd7_e_08',
      },
      {
        id: 'd7_e_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Pharmacy stock reconciliation. Ketamine. Forty ampoules unaccounted for over six weeks, all from the resus cupboard, all on nights.",
        nextId: 'd7_e_09',
      },
      {
        id: 'd7_e_09',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The cupboard requires two staff to open. On thirty-one of those occasions the second staff member was the same person.",
        nextId: 'd7_e_10',
      },
      {
        id: 'd7_e_10',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Say it in the room, Ann. Do not make the chief resident read it off a page.",
        nextId: 'd7_e_11',
      },
      {
        id: 'd7_e_11',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "It was you.",
        nextId: 'd7_e_12',
      },
      {
        id: 'd7_e_12',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Yes.",
        nextId: 'd7_e_close',
      },
      {
        id: 'd7_e_close',
        speaker: 'System',
        text: "DAY 7 COMPLETE.",
      },
    ],
    cases: ['case_04_svt', 'case_02_fluids', 'case_06_trauma'],
  },

  /* ----------------------------------------------------------------------
   * DAY 8
   * ----------------------------------------------------------------------
   */
  8: {
    startOfDayCutscene: [
      {
        id: 'd8_s_01',
        speaker: 'System',
        text: "Day 8. 06:15. Bob has been sitting in the same chair for seven hours.",
        nextId: 'd8_s_02',
      },
      {
        id: 'd8_s_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "It started after the suspension. Not for fun. I want that to be clear, and I am aware that everyone says it.",
        nextId: 'd8_s_03',
      },
      {
        id: 'd8_s_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Twenty minutes of not being here. That is all it is. Twenty minutes where the manifold does not go off and the technicians are still alive and I am not the man whose signature is on eleven months of a register.",
        nextId: 'd8_s_04',
      },
      {
        id: 'd8_s_04',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "I have never worked impaired. I know that is exactly what an impaired doctor says. Check the shift log. Check every one of them. I have been very careful and being careful about it is its own kind of full-time job.",
        nextId: 'd8_s_05',
      },
      {
        id: 'd8_s_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "There is a formal pathway. Occupational health, monitored recovery, a suspension of registration for six to twelve months, and a return to practice. Around forty percent make it back.",
        nextId: 'd8_s_06',
      },
      {
        id: 'd8_s_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Forty percent. And the ones who do not make it back, where do they go, Ann? Because I have looked, and there is nothing after this. There is no second thing I am.",
        nextId: 'd8_s_07',
      },
      {
        id: 'd8_s_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The chief resident has to decide. That is not me avoiding it. It is genuinely, procedurally, your signature.",
        nextId: 'd8_s_08',
      },
      {
        id: 'd8_s_08',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Fourteen months ago I asked you to cover a chart for me. Whatever you did that night, you now get to find out what it feels like from this side of the desk.",
        choices: [
          {
            text: "Report it through occupational health. Today, properly, with your name on it.",
            nextId: 'd8_s_report_01',
            karmaEffect: 50,
            flagEffect: 'REPORTED_BOB_DIVERSION',
            xpEffect: 8000,
          },
          {
            text: "Cover it. Rewrite the stock count yourself and get him quietly into treatment.",
            nextId: 'd8_s_cover_01',
            karmaEffect: -40,
            flagEffect: 'COVERED_BOB_DIVERSION',
            xpEffect: 15000,
          },
          {
            text: "\"You self-report. Today, before I leave. I'll walk you there and sit outside.\"",
            nextId: 'd8_s_selfreport_01',
            karmaEffect: 70,
            flagEffect: 'BOB_SELF_REPORTED',
            xpEffect: 10000,
          },
        ],
      },

      {
        id: 'd8_s_report_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Right. Yes. That is the correct answer and I hate you for a moment and then I will not.",
        nextId: 'd8_s_report_02',
      },
      {
        id: 'd8_s_report_02',
        speaker: 'System',
        text: "Occupational health accepts the referral at 09:00. Bob is off the rota by noon. The department is four doctors short and stays that way for six weeks.",
        nextId: 'd8_s_join',
      },

      {
        id: 'd8_s_cover_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Then I am not signing the count. If you alter it, you alter it alone, and you should understand that a pharmacy reconciliation is audited externally every quarter.",
        nextId: 'd8_s_cover_02',
      },
      {
        id: 'd8_s_cover_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Thank you. I am going to be worth it. I have said that before to someone and I was not, and I am going to be this time.",
        nextId: 'd8_s_join',
      },

      {
        id: 'd8_s_selfreport_01',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "If I walk in there myself it goes on my registration as a voluntary disclosure. Do you know what the difference is? About four years of restriction.",
        nextId: 'd8_s_selfreport_02',
      },
      {
        id: 'd8_s_selfreport_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You could have just reported me. It would have been faster and it would have been safer for you.",
        nextId: 'd8_s_selfreport_03',
      },
      {
        id: 'd8_s_selfreport_03',
        speaker: 'System',
        text: "He walks in at 09:20. You sit outside for two hours and eleven minutes.",
        nextId: 'd8_s_join',
      },

      {
        id: 'd8_s_join',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd8_e_01',
        speaker: 'System',
        text: "01:30. Ann brings two coffees and does not sit down.",
        nextId: 'd8_e_02',
      },
      {
        id: 'd8_e_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "The ministry inspector sent me a list. Cohort two of Protocol C. Sixty-one patients, three sites, dated two years ago.",
        nextId: 'd8_e_03',
      },
      {
        id: 'd8_e_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Nineteen of them are still alive. Nine of them have chronic kidney disease that nobody has ever connected to a drug they were never told they received.",
        nextId: 'd8_e_04',
      },
      {
        id: 'd8_e_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "If I release the list now, those nineteen people find out this week and can be screened this month. Their nephrologists get a mechanism instead of a shrug.",
        nextId: 'd8_e_05',
      },
      {
        id: 'd8_e_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "If I release it now, the inquiry collapses. The inspector told me directly. Publish before the report and the whole thing becomes a media matter, evidence gets sealed, and Somchai retires on schedule with a pension and a plaque.",
        nextId: 'd8_e_06',
      },
      {
        id: 'd8_e_06',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Nineteen people this week, or the whole machine in eighteen months. I have been holding that list for eleven days and I cannot do it any more.",
        choices: [
          {
            text: "\"Release it. Nineteen people get screened. The machine can wait.\"",
            nextId: 'd8_e_release_01',
            karmaEffect: 60,
            flagEffect: 'RELEASED_COHORT_LIST',
            xpEffect: 9000,
          },
          {
            text: "\"Hold it. Eighteen months and it stops for everyone, everywhere.\"",
            nextId: 'd8_e_hold_01',
            karmaEffect: -30,
            flagEffect: 'HELD_COHORT_LIST',
            xpEffect: 18000,
          },
          {
            text: "\"Neither. Screen them clinically without saying why. Get the tests done now, keep the list sealed.\"",
            nextId: 'd8_e_third_01',
            karmaEffect: 30,
            flagEffect: 'QUIET_SCREENING',
            xpEffect: 14000,
          },
        ],
      },

      {
        id: 'd8_e_release_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Good. I wanted someone else to say it. I have wanted that for eleven days and I am not proud of needing it.",
        nextId: 'd8_e_join',
      },
      {
        id: 'd8_e_hold_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Then nine people with failing kidneys go another year and a half not knowing why, and we will have decided that on their behalf, in a corridor, at half past one in the morning.",
        nextId: 'd8_e_hold_02',
      },
      {
        id: 'd8_e_hold_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Which is exactly how Somchai makes every decision he has ever made. I want you to sit with that and I want you to notice that I am not arguing with you.",
        nextId: 'd8_e_join',
      },
      {
        id: 'd8_e_third_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Recall them for a renal review, no reason given, funded out of the department budget. I can write nineteen referrals by Friday.",
        nextId: 'd8_e_third_02',
      },
      {
        id: 'd8_e_third_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "They still do not get told what happened to them. That is not a solution, it is a delay we can defend. I will take it.",
        nextId: 'd8_e_join',
      },

      {
        id: 'd8_e_join',
        speaker: 'System',
        text: "DAY 8 COMPLETE.",
      },
    ],
    cases: ['case_06_trauma', 'case_03_cardiac', 'case_04_svt'],
  },

  /* ----------------------------------------------------------------------
   * DAY 9
   * ----------------------------------------------------------------------
   */
  9: {
    startOfDayCutscene: [
      {
        id: 'd9_s_01',
        speaker: 'System',
        text: "Day 9. 16:00. The ministry report is due in nine days. Somchai has been in Bangkok for a week.",
        nextId: 'd9_s_02',
      },
      {
        id: 'd9_s_02',
        speaker: 'System',
        text: "An envelope is delivered to the department by courier. No sender. Inside: a Ministry of Public Health confidential informant agreement, signed and dated twenty-six months ago.",
        nextId: 'd9_s_03',
      },
      {
        id: 'd9_s_03',
        speaker: 'System',
        text: "The informant is Nurse Ann.",
        nextId: 'd9_s_04',
      },
      {
        id: 'd9_s_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Yes. Twenty-six months. Since before you arrived, since before Bob signed his first stack, since before any of it.",
        nextId: 'd9_s_05',
      },
      {
        id: 'd9_s_05',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Ask the question you are actually asking.",
        choices: [
          {
            text: "\"If you were working with the ministry, why did the trial keep running?\"",
            nextId: 'd9_s_why_01',
            karmaEffect: 10,
            flagEffect: 'ASKED_ANN_WHY',
            xpEffect: 3000,
          },
          {
            text: "\"Was I ever a colleague to you, or was I a source?\"",
            nextId: 'd9_s_personal_01',
            karmaEffect: 0,
            flagEffect: 'ASKED_ANN_PERSONAL',
            xpEffect: 3000,
          },
        ],
      },
      {
        id: 'd9_s_why_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Because an informant who stops the crime has no case. They told me that in the second meeting, in a coffee shop, with a form to sign.",
        nextId: 'd9_s_join',
      },
      {
        id: 'd9_s_personal_01',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Both. That is the honest answer and it is not the one you want. Every real thing I said to you was real, and I also wrote it down afterwards.",
        nextId: 'd9_s_join',
      },
      {
        id: 'd9_s_join',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Here is the part I have never said out loud.",
        nextId: 'd9_s_07',
      },
      {
        id: 'd9_s_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "In month nine I had enough. I had the register, I had the pharmacy codes, I had two witness statements. The inspector told me it was thin and asked me to keep going. I kept going.",
        nextId: 'd9_s_08',
      },
      {
        id: 'd9_s_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Fourteen patients received KV-7 between month nine and the night my brother was admitted. Four of them died. I could have stopped it at fourteen and I chose the case.",
        nextId: 'd9_s_09',
      },
      {
        id: 'd9_s_09',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "And then it was my brother in bed 12. Which is not irony. It is a system doing exactly what a system does when you leave it running on purpose.",
        nextId: 'd9_s_10',
      },
      {
        id: 'd9_s_10',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I have spent a year letting you all think I was the clean one. I was not the clean one. I was the patient one, and there is a version of that word that means the same thing as cold.",
        nextId: 'd9_s_11',
      },
      {
        id: 'd9_s_11',
        speaker: 'System',
        text: "SHIFT START.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd9_e_01',
        speaker: 'System',
        text: "23:50. Somchai is back from Bangkok. He comes to the department himself, which he has done exactly twice in two years.",
        nextId: 'd9_e_02',
      },
      {
        id: 'd9_e_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The ministry report is finished. It will be published on the fourteenth. I have read a draft, which I am not supposed to have, and I am going to tell you what is in it because you will find out anyway.",
        nextId: 'd9_e_03',
      },
      {
        id: 'd9_e_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Systemic governance failure. Six sites. Fourteen named individuals. Four of the fourteen sit on the national ethics committee, and the report recommends their referral for criminal investigation.",
        nextId: 'd9_e_04',
      },
      {
        id: 'd9_e_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I am named first. I will lose my registration, my post, and in all likelihood four years of my life to a courtroom.",
        nextId: 'd9_e_05',
      },
      {
        id: 'd9_e_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You are telling us this in an emergency department at midnight. Why.",
        nextId: 'd9_e_06',
      },
      {
        id: 'd9_e_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Because the report also recommends immediate suspension of the Continuity Programme at all six sites pending criminal proceedings. Which means CR-1 stops on the fourteenth.",
        nextId: 'd9_e_07',
      },
      {
        id: 'd9_e_07',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "There are two hundred and eleven patients currently enrolled, legally, with consent, under an approved protocol. On the fifteenth they have nothing. There is no other reversal agent in this country.",
        nextId: 'd9_e_08',
      },
      {
        id: 'd9_e_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That is the oldest argument there is. Do not stop me, people will suffer if you stop me.",
        nextId: 'd9_e_09',
      },
      {
        id: 'd9_e_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "It is the oldest argument there is and it is also, on this occasion, arithmetically correct. Both things are true and I am too tired to pretend otherwise.",
        nextId: 'd9_e_10',
      },
      {
        id: 'd9_e_10',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The report has one carve-out available. A named clinician at a named site can petition for continuity of supply for existing enrolled patients only. It requires a physician with standing, which is now you, and it requires it before the fourteenth.",
        nextId: 'd9_e_11',
      },
      {
        id: 'd9_e_11',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Sign the petition and two hundred and eleven people keep a drug that works. Sign it and my defence gains a document from an untainted clinician arguing the programme has clinical merit. There is no version where you get one without the other.",
        choices: [
          {
            text: "Sign the continuity petition. Two hundred and eleven people.",
            nextId: 'd9_e_sign_01',
            karmaEffect: 10,
            flagEffect: 'SIGNED_CONTINUITY_PETITION',
            xpEffect: 22000,
          },
          {
            text: "Refuse. Let it stop on the fourteenth.",
            nextId: 'd9_e_refuse_01',
            karmaEffect: 20,
            flagEffect: 'REFUSED_CONTINUITY_PETITION',
            xpEffect: 9000,
          },
          {
            text: "Sign it, and send the inspector a covering letter stating exactly why, and that it must not be read as support for the man.",
            nextId: 'd9_e_qualified_01',
            karmaEffect: 50,
            flagEffect: 'QUALIFIED_PETITION',
            xpEffect: 16000,
          },
        ],
      },

      {
        id: 'd9_e_sign_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Thank you. I will not insult you by pretending that was for me.",
        nextId: 'd9_e_join',
      },
      {
        id: 'd9_e_refuse_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Then on the fifteenth a variceal bleed comes through those new doors and there is nothing in the cupboard, and you will be the person standing there. I have been that person. It is why I started all of this.",
        nextId: 'd9_e_join',
      },
      {
        id: 'd9_e_qualified_01',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "A petition with a hostile covering letter. That is legally awkward, morally coherent, and enormously inconvenient for my counsel.",
        nextId: 'd9_e_qualified_02',
      },
      {
        id: 'd9_e_qualified_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I will countersign the letter. As a member of the safety board, which he put me on, which he is now going to regret for the rest of his natural life.",
        nextId: 'd9_e_join',
      },

      {
        id: 'd9_e_join',
        speaker: 'System',
        text: "00:41. Somchai walks to the exit and stops in the doorway with his hand on the frame, and does not turn around, and stands there for eleven seconds.",
        nextId: 'd9_e_close',
      },
      {
        id: 'd9_e_close',
        speaker: 'System',
        text: "DAY 9 COMPLETE.",
      },
    ],
    cases: ['case_02_fluids', 'case_05_asthma', 'case_01'],
  },

  /* ----------------------------------------------------------------------
   * DAY 10: YEAR 2 FINALE
   * ----------------------------------------------------------------------
   */
  10: {
    startOfDayCutscene: [
      {
        id: 'd10_s_01',
        speaker: 'System',
        text: "Day 10. The fourteenth. 18:12.",
        nextId: 'd10_s_02',
      },
      {
        id: 'd10_s_02',
        speaker: 'System',
        text: "The ministry report publishes at 09:00 tomorrow. Three news vans are already in the car park, which means somebody has been paid.",
        nextId: 'd10_s_03',
      },
      {
        id: 'd10_s_03',
        speaker: 'System',
        text: "18:40. A minibus carrying fourteen passengers leaves the expressway two kilometres from the hospital.",
        nextId: 'd10_s_04',
      },
      {
        id: 'd10_s_04',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Nine coming to us. Three red, four yellow, two walking. First arrival four minutes.",
        nextId: 'd10_s_05',
      },
      {
        id: 'd10_s_05',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Chief resident runs the floor. That is you. I will take resus 2 and I will do exactly what you tell me, which is a sentence I have waited a year to be able to say without choking on it.",
        nextId: 'd10_s_06',
      },
      {
        id: 'd10_s_06',
        speaker: 'System',
        text: "18:44. First ambulance. Male, fifties, crush injury to the pelvis, systolic pressure of seventy.",
        nextId: 'd10_s_07',
      },
      {
        id: 'd10_s_07',
        speaker: 'System',
        text: "18:51. Second ambulance. And a hospital porter running from the administration block shouting that the director has collapsed in the third floor corridor.",
        nextId: 'd10_s_08',
      },
      {
        id: 'd10_s_08',
        speaker: 'System',
        text: "Somchai arrives on a trolley at 18:55. Anterior ST elevation across the chest leads. Fifty-eight years old, cold, grey, and awake.",
        nextId: 'd10_s_09',
      },
      {
        id: 'd10_s_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The catheterisation laboratory. One team. One table.",
        nextId: 'd10_s_10',
      },
      {
        id: 'd10_s_10',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "There is a second candidate. Bay 3. Nineteen years old, from the minibus, inferior infarct on the trauma ECG. Nineteen.",
        nextId: 'd10_s_11',
      },
      {
        id: 'd10_s_11',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Anterior beats inferior. Somchai's territory is bigger, his time is shorter, and by every triage rule written in the last thirty years he goes first. I am saying the clinical answer out loud so that nobody has to pretend it is complicated.",
        nextId: 'd10_s_12',
      },
      {
        id: 'd10_s_12',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Take the girl.",
        nextId: 'd10_s_13',
      },
      {
        id: 'd10_s_13',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Do not look surprised. I have spent thirty years deciding who gets the table. This is the first time it has been easy.",
        nextId: 'd10_s_14',
      },
      {
        id: 'd10_s_14',
        speaker: 'System',
        text: "The decision is the chief resident's. The laboratory is holding.",
        choices: [
          {
            text: "Follow the clinical rule. Somchai to the laboratory.",
            nextId: 'd10_s_somchai_01',
            karmaEffect: 30,
            flagEffect: 'TREATED_SOMCHAI_FIRST',
            xpEffect: 12000,
          },
          {
            text: "Take the nineteen-year-old. Thrombolyse Somchai in the department.",
            nextId: 'd10_s_girl_01',
            karmaEffect: -20,
            flagEffect: 'TREATED_GIRL_FIRST',
            xpEffect: 16000,
          },
          {
            text: "Call the second interventionalist in from home. Buy twenty minutes and take both.",
            nextId: 'd10_s_both_01',
            karmaEffect: 60,
            flagEffect: 'CALLED_SECOND_TEAM',
            xpEffect: 20000,
          },
        ],
      },

      {
        id: 'd10_s_somchai_01',
        speaker: 'System',
        text: "Somchai goes up at 19:04. The nineteen-year-old is thrombolysed in bay 3 at 19:09 and reperfuses at 19:41.",
        nextId: 'd10_s_join',
      },
      {
        id: 'd10_s_girl_01',
        speaker: 'System',
        text: "She goes up at 19:04. Somchai is thrombolysed on the resus trolley. He reperfuses partially. His ejection fraction will never come back above thirty-five percent.",
        nextId: 'd10_s_girl_02',
      },
      {
        id: 'd10_s_girl_02',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "For the record, so it exists in writing somewhere: that was a defensible call and I will say so at any review that asks me. And you did not make it for the reason you are telling yourself.",
        nextId: 'd10_s_join',
      },
      {
        id: 'd10_s_both_01',
        speaker: 'System',
        text: "The second interventionalist lives eleven minutes away. She arrives at 19:16. Both tables run. Both patients reperfuse.",
        nextId: 'd10_s_both_02',
      },
      {
        id: 'd10_s_both_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That option existed all along. Nobody ever calls her because calling her costs the department eighteen thousand baht and a favour. Eleven months I have watched people not make that call.",
        nextId: 'd10_s_join',
      },

      {
        id: 'd10_s_join',
        speaker: 'System',
        text: "SHIFT START. MASS CASUALTY PROTOCOL ACTIVE.",
      },
    ],
    endOfDayCutscene: [
      {
        id: 'd10_e_01',
        speaker: 'System',
        text: "04:30. Nine patients. Eight alive. The one who is not was dead at the roadside and everybody in the department knows it and three of them will still lie awake about it.",
        nextId: 'd10_e_02',
      },
      {
        id: 'd10_e_02',
        speaker: 'System',
        text: "Coronary care unit. Somchai is awake, on oxygen, with a stent in his left anterior descending artery and eleven hours until a national report names him first.",
        nextId: 'd10_e_03',
      },
      {
        id: 'd10_e_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "You kept me alive. Statistically that was the correct allocation of the table and I want you to hold onto the statistics, because in about a week the newspapers will offer you a much simpler story about yourself.",
        nextId: 'd10_e_04',
      },
      {
        id: 'd10_e_04',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "I have something for you. It is on the table. My counsel does not know it exists and would resign if he did.",
        nextId: 'd10_e_05',
      },
      {
        id: 'd10_e_05',
        speaker: 'System',
        text: "A single flash drive and a handwritten index. Cohort one. Cohort two. Every adverse event, unredacted, from all six sites, going back twenty-six months.",
        nextId: 'd10_e_06',
      },
      {
        id: 'd10_e_06',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The ministry report is built on what Nurse Ann could photograph in a pharmacy corridor. It names fourteen people. This names forty-one, and four of them are the reason the approval took three years.",
        nextId: 'd10_e_07',
      },
      {
        id: 'd10_e_07',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Why now. Give me one reason that is not a manoeuvre.",
        nextId: 'd10_e_08',
      },
      {
        id: 'd10_e_08',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Because at 18:55 last night I was lying on a trolley in my own emergency department and I could not get anyone's attention, and I understood in about four seconds what every patient I have ever moved out of a bed understood.",
        nextId: 'd10_e_09',
      },
      {
        id: 'd10_e_09',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "That is not redemption. I am not redeemed. I am a man with a stent who has run out of the specific kind of energy that this required, and I would like it to be someone else's turn.",
        nextId: 'd10_e_10',
      },
      {
        id: 'd10_e_10',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "There is a catch. There is always a catch with him, and I have been in the room for nine years, so somebody should say it before the sun comes up.",
        nextId: 'd10_e_11',
      },
      {
        id: 'd10_e_11',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The catch is chronology. Cohort one begins twenty-six months ago. So does Nurse Ann's informant agreement.",
        nextId: 'd10_e_12',
      },
      {
        id: 'd10_e_12',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The adverse event log records who was notified of each event and when. Every entry from month nine onward was reported to the ministry inspector within forty-eight hours.",
        nextId: 'd10_e_13',
      },
      {
        id: 'd10_e_13',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "The ministry knew. Not at the end. Throughout. Fourteen patients received KV-7 after the office of inspection had documented evidence sufficient to close three sites, and the office instructed its informant to continue collecting.",
        nextId: 'd10_e_14',
      },
      {
        id: 'd10_e_14',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "Release this and you do not take down a corrupt director. You take down the inquiry that was going to convict him, the inspector who ran it, and the nurse who signed the agreement.",
        nextId: 'd10_e_15',
      },
      {
        id: 'd10_e_15',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "He is telling the truth. I want to be the one who says that. He is telling the truth and it has my name on it and I have known for eleven days.",
        nextId: 'd10_e_16',
      },
      {
        id: 'd10_e_16',
        speaker: 'System',
        text: "05:40. The report publishes in three hours and twenty minutes.",
        choices: [
          {
            text: "Send the full log to the press. All forty-one names, including Ann's, including the inspector's.",
            nextId: 'd10_e_press_01',
            karmaEffect: 20,
            flagEffect: 'BURNED_IT_ALL_DOWN',
            xpEffect: 40000,
          },
          {
            text: "Send it to the ministry, sealed, and let the report publish as written first.",
            nextId: 'd10_e_ministry_01',
            karmaEffect: 30,
            flagEffect: 'PRESERVED_THE_INQUIRY',
            xpEffect: 25000,
          },
          {
            text: "Destroy the log. Protect Ann. The report is enough.",
            nextId: 'd10_e_destroy_01',
            karmaEffect: -50,
            flagEffect: 'DESTROYED_THE_LOG',
            xpEffect: 30000,
          },
          {
            text: "Give it to Ann. It is her name on it and her twenty-six months. She decides.",
            nextId: 'd10_e_ann_01',
            karmaEffect: 50,
            flagEffect: 'GAVE_LOG_TO_ANN',
            xpEffect: 20000,
          },
        ],
      },

      {
        id: 'd10_e_press_01',
        speaker: 'System',
        text: "08:00. Forty-one names. Four of them sit on the national ethics committee. One of them is a ministry inspector. One of them is a nurse who has been struck off, reinstated, and struck off again inside eighteen months.",
        nextId: 'd10_e_press_02',
      },
      {
        id: 'd10_e_press_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "You were right to do it. I am going to need a long time before I can say that in a voice that sounds like it.",
        nextId: 'd10_e_final_01',
      },

      {
        id: 'd10_e_ministry_01',
        speaker: 'System',
        text: "09:00. The report publishes. Somchai is named first. Six sites suspended. Fourteen referrals for criminal investigation.",
        nextId: 'd10_e_ministry_02',
      },
      {
        id: 'd10_e_ministry_02',
        speaker: 'System',
        text: "10:20. A sealed package arrives at the Office of Inspection containing evidence that the Office of Inspection allowed fourteen people to be dosed. It is logged, stamped, and assigned a reference number.",
        nextId: 'd10_e_ministry_03',
      },
      {
        id: 'd10_e_ministry_03',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "You have handed an institution the evidence of its own failure and asked it to act. Do you know what happens to that reference number?",
        nextId: 'd10_e_final_01',
      },

      {
        id: 'd10_e_destroy_01',
        speaker: 'System',
        text: "The drive goes into the sharps incinerator with the night's clinical waste at 06:10.",
        nextId: 'd10_e_destroy_02',
      },
      {
        id: 'd10_e_destroy_02',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "There you are. Two years and you have arrived at the same place I did. Not the same crime. The same reasoning. I destroyed evidence to protect a programme. You destroyed evidence to protect a friend.",
        nextId: 'd10_e_destroy_03',
      },
      {
        id: 'd10_e_destroy_03',
        speaker: 'Prof. Somchai',
        portrait: '/assets/director.jpg',
        text: "It was always going to be someone you loved. It is never a bribe. Nobody in the history of this building has ever been bought with money.",
        nextId: 'd10_e_final_01',
      },

      {
        id: 'd10_e_ann_01',
        speaker: 'System',
        text: "Ann holds the drive for four minutes without speaking. In the corridor outside, the night staff are handing over.",
        nextId: 'd10_e_ann_02',
      },
      {
        id: 'd10_e_ann_02',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "Twenty-six months I have wanted someone to take this off me. You just gave it back, which is the only honest thing anyone has done with it.",
        nextId: 'd10_e_ann_03',
      },
      {
        id: 'd10_e_ann_03',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "I will tell you what I decide on the fifteenth. Not today. I have been the patient one for two years and today I am going to go and sit with my brother.",
        nextId: 'd10_e_final_01',
      },

      {
        id: 'd10_e_final_01',
        speaker: 'System',
        text: "09:00. The ministry report publishes. Rama Central is on every screen in the country.",
        nextId: 'd10_e_final_02',
      },
      {
        id: 'd10_e_final_02',
        speaker: 'System',
        text: "11:15. The hospital board meets in emergency session and appoints an acting director for the interim period.",
        nextId: 'd10_e_final_03',
      },
      {
        id: 'd10_e_final_03',
        speaker: 'System',
        text: "12:40. An email arrives. Eleven recipients. Subject line: INTERIM CLINICAL GOVERNANCE.",
        nextId: 'd10_e_final_04',
      },
      {
        id: 'd10_e_final_04',
        speaker: 'System',
        text: "With the suspension of the director and the departure of the medical superintendent, the board has appointed an interim clinical governance lead for the emergency department, effective immediately.",
        nextId: 'd10_e_final_05',
      },
      {
        id: 'd10_e_final_05',
        speaker: 'System',
        text: "The name in the email is yours.",
        nextId: 'd10_e_final_06',
      },
      {
        id: 'd10_e_final_06',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "Two years. You came in with white shoes and now you sign the register.",
        nextId: 'd10_e_final_07',
      },
      {
        id: 'd10_e_final_07',
        speaker: 'Dr. Bob',
        portrait: '/assets/doctor.jpg',
        text: "It will be forty pages. It will be on your desk on Friday afternoon and you will be twenty-eight hours into a shift, and there will be a very good reason not to read page 61.",
        nextId: 'd10_e_final_08',
      },
      {
        id: 'd10_e_final_08',
        speaker: 'Nurse Ann',
        portrait: '/assets/nurse.jpg',
        text: "That is the whole trap. It was never a villain. It was a stack of paper and a tired person, every Friday, for thirty years.",
        nextId: 'd10_e_final_09',
      },
      {
        id: 'd10_e_final_09',
        speaker: 'System',
        text: "13:02. The first stack arrives. Forty pages. Somebody has already left it on the desk.",
        nextId: 'd10_e_final_10',
      },
      {
        id: 'd10_e_final_10',
        speaker: 'System',
        text: "YEAR 2 COMPLETE.",
        nextId: 'd10_e_final_11',
      },
      {
        id: 'd10_e_final_11',
        speaker: 'System',
        text: "YEAR 3: 'PAGE 61' ...",
      },
    ],
    cases: ['case_06_trauma', 'case_03_cardiac', 'case_04_svt', 'case_02_fluids'],
  },

  11: {
    startShiftEvents: [
      { id: 'd11_start_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'You are the new extern from Bangkok? Good. Ambulance bay, resus two, now. I have forty-one patients in a department built for twenty-two.', nextId: 'd11_start_02' },
      { id: 'd11_start_02', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Rules. Do not touch my drug trolley without telling me. Do not call a code without telling me. And do not ever tell a family a patient is stable unless you are willing to stand there when it turns out they are not.', nextId: 'd11_start_03' },
      { id: 'd11_start_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Ignore the part where she scares you. She has been running this room since before you could ride a bicycle. I am Ekkarat. I am the only staff physician on tonight, which means for the next twelve hours I am your teacher, your consultant, and your alibi.', nextId: 'd11_start_04' },
      { id: 'd11_start_04', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'At Rama you had a resident, a fellow, and a professor between you and the patient. Here you have me, and I am currently in theatre with a ruptured spleen. Start seeing people. Call my name when you are frightened. Being frightened early is cheap. Being frightened late costs a life.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd11_mid_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You are Rama, right? I am Beam, Khon Kaen. Word of advice, do not write long notes here. Nobody reads them. Volume is the only thing anyone counts.', nextId: 'd11_mid_02' },
      { id: 'd11_mid_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I have cleared nine patients since seven. You are on three. Not a competition. Obviously.', nextId: 'd11_mid_03' },
      { id: 'd11_mid_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Three of mine are still alive, so I am counting differently.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd11_end_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'You did not vanish when the trauma came in. That puts you above half the externs I have had.', nextId: 'd11_end_02' },
      { id: 'd11_end_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'You hesitated on the chest drain. That is not a criticism. Hesitation means you understood what you were about to do. The ones who never hesitate are the ones I have to watch.', nextId: 'd11_end_03' },
      { id: 'd11_end_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Sleep. Tomorrow is Friday. Friday is payday in the province, and payday means alcohol, and alcohol means motorcycles.', nextId: undefined },
    ],
    cases: ['case_06_trauma', 'case_12', 'case_15'],
  },

  // ===========================================================
  // DAY 12 - Friday night. Motorcycles. Your first loss.
  // ===========================================================
  12: {
    startShiftEvents: [
      { id: 'd12_start_01', speaker: 'Lung Suk (Ambulance)', portrait: '/assets/lungsuk.jpg', text: 'Doctor, three coming. Pickup versus two motorcycles on the Friendship Highway. One of them is fifteen years old and was not wearing a helmet. ETA four minutes.', nextId: 'd12_start_02' },
      { id: 'd12_start_02', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Resus one and two are full. You are taking the third one in the corridor. Yes, the corridor. Screen goes up, you work, nobody complains.', nextId: 'd12_start_03' },
      { id: 'd12_start_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Extern. Look at me. Tonight you will make a decision with incomplete information and you will be right, and later you will make the same decision and be wrong. That is the job. Do not confuse a bad outcome with a bad decision.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd12_mid_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'The boy in bay four arrested. Pi Ek called it at 23:41. His mother is outside. She rode her scooter forty kilometres to get here.', nextId: 'd12_mid_02' },
      { id: 'd12_mid_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'You can come with me to tell her, or you can carry on seeing patients. Both are legitimate. Only one of them teaches you anything.', choices: [
        { text: 'Go with him. Stand there and hear it.', nextId: 'd12_mid_03a', karmaEffect: 10, xpEffect: 15 },
        { text: 'Stay. There are eleven people still waiting.', nextId: 'd12_mid_03b', karmaEffect: 0, xpEffect: 5 },
      ] },
      { id: 'd12_mid_03a', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'She did not scream. They almost never do. She asked whether he was afraid at the end. I told her the truth, which is that he was unconscious from the moment of impact. That was the only mercy available and I gave her all of it.', nextId: undefined },
      { id: 'd12_mid_03b', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Fair enough. The queue is real. But understand what you chose. The queue will always be there, and it is a very comfortable place to hide.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd12_end_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Fourteen tonight. The boy was not yours, so it does not go on your record. Small blessing.', nextId: 'd12_end_02' },
      { id: 'd12_end_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'It does not go on any record. That is the part I am having trouble with.', nextId: 'd12_end_03' },
      { id: 'd12_end_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Write his name down somewhere. Not in the chart. Somewhere for you. I have a notebook with sixty-two names in it. People think that is morbid. It is the opposite. It is the only reason I still bother running.', nextId: undefined },
    ],
    cases: ['case_08', 'case_14', 'case_02_fluids'],
  },

  // ===========================================================
  // DAY 13 - Rural toxicology. Snakebite. A family says no.
  // ===========================================================
  13: {
    startShiftEvents: [
      { id: 'd13_start_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Harvest season. That means three things: machetes, pesticide, and snakes. You will see all three before lunch.', nextId: 'd13_start_02' },
      { id: 'd13_start_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'In Bangkok you learn to order a toxicology screen. Here you learn to smell the patient. Garlic and wet grass on the breath means organophosphate. You will smell it from the door and you will start atropine before the gas comes back.', nextId: 'd13_start_03' },
      { id: 'd13_start_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'And if a farmer arrives with a bitten leg, the first question is not which snake. The first question is what is clotting. Twenty minute whole blood clotting test. A tube of blood and a watch will tell you more than any imaging we own.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd13_mid_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'The old man in bed six. His sons want to take him home. They say he told them last year he did not want tubes. He is eighty-one and he is drowning.', nextId: 'd13_mid_02' },
      { id: 'd13_mid_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'You have been taught that refusing treatment is a failure. It is not. Sometimes the ventilator is just a machine that makes dying take three weeks instead of three hours. Your job is to make sure they are choosing with real information, not with fear of the bill.', choices: [
        { text: 'Ask the sons directly whether cost is part of this.', nextId: 'd13_mid_03a', karmaEffect: 15, xpEffect: 20, flagEffect: 'ASKED_ABOUT_COST' },
        { text: 'Accept the refusal and document it.', nextId: 'd13_mid_03b', karmaEffect: 0, xpEffect: 10 },
      ] },
      { id: 'd13_mid_03a', speaker: 'Eldest Son', portrait: '/assets/villager.jpg', text: 'Doctor... yes. We have thirty thousand baht. We were told the ICU is four thousand a day. But he really did say it. He said it at Songkran. I am not lying to you about that.', nextId: 'd13_mid_03c' },
      { id: 'd13_mid_03c', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Good. Now he can go home because that is what he wanted, and not because you did not tell them the gold card covers it. There is a difference and it is the whole of medical ethics.', nextId: undefined },
      { id: 'd13_mid_03b', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Clean documentation. Also an incomplete conversation. Half the refusals in this province are financial and dressed up as spiritual. Next time, ask.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd13_end_01', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Antivenom in the fridge is worth more than my car. We have four vials of Russell viper and the next delivery is Tuesday. That is the actual constraint on your practice out here. Not your knowledge. Inventory.', nextId: 'd13_end_02' },
      { id: 'd13_end_02', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'You did the clotting test yourself instead of waiting for the lab. Forty minutes saved. I noticed.', nextId: 'd13_end_03' },
      { id: 'd13_end_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You know none of this counts for anything, right? Nobody in Bangkok is impressed that you can identify a viper bite. They want publications and connections. That is what actually moves a career.', nextId: undefined },
    ],
    cases: ['case_13', 'case_16', 'case_10'],
  },

  // ===========================================================
  // DAY 14 - One ventilator. Two patients.
  // ===========================================================
  14: {
    startShiftEvents: [
      { id: 'd14_start_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'ICU is full. Every provincial hospital within a hundred and fifty kilometres is full. We have one transport ventilator that works and one that alarms every eight minutes and cannot be trusted overnight.', nextId: 'd14_start_02' },
      { id: 'd14_start_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Two patients need it. A nine year old with severe dengue and shock. And a forty-four year old man with organophosphate poisoning who was brought in by strangers because his family has not come.', nextId: 'd14_start_03' },
      { id: 'd14_start_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'I am not going to pretend this is a teaching exercise. I want your reasoning out loud, because in twenty minutes I have to write it down and defend it.', choices: [
        { text: 'The child. Higher chance of full recovery, more years saved.', nextId: 'd14_start_04a', karmaEffect: 5, xpEffect: 20, flagEffect: 'KORAT_VENT_CHILD' },
        { text: 'The man. He will die tonight without it. She has a window.', nextId: 'd14_start_04b', karmaEffect: 5, xpEffect: 20, flagEffect: 'KORAT_VENT_STRANGER' },
      ] },
      { id: 'd14_start_04a', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Utilitarian, and defensible. Understand what you have also decided. He has nobody to complain on his behalf, and you have just weighed that without noticing. Go and bag him yourself. If he is going to be second, he is not going to be alone.', nextId: undefined },
      { id: 'd14_start_04b', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Immediacy of need over expected years. Also defensible. The girl now depends on you being right that her window is real. Recheck her lactate every thirty minutes. If you are wrong, you will find out fast and so will her parents.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd14_mid_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'For what it is worth, I would have flipped a coin and written down whatever sounded better afterwards. Nobody audits the reasoning. They audit the outcome.', nextId: 'd14_mid_02' },
      { id: 'd14_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'That is the difference between us, Beam. I have to sleep in the same head I make decisions in.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd14_end_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Both alive at handover. That is not skill and it is not luck. It is that you stayed at the bedside instead of at the computer. Remember that when someone in Bangkok tells you documentation is the job.', nextId: 'd14_end_02' },
      { id: 'd14_end_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'I requested three ventilators in 2019, 2021 and again in March. The forms are all approved. The budget line keeps moving to a hospital that already has fourteen. Somebody in Bangkok signs those transfers.', nextId: 'd14_end_03' },
      { id: 'd14_end_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Do not look at me like that. I am tired, not paranoid. Go home.', nextId: undefined },
    ],
    cases: ['case_12', 'case_13', 'case_19'],
  },

  // ===========================================================
  // DAY 15 - Last day at Korat. Pi Ek's history.
  // ===========================================================
  15: {
    startShiftEvents: [
      { id: 'd15_start_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Last shift. Tradition says the departing extern buys the night nurses coffee. Tradition also says nobody tells the extern until the last shift.', nextId: 'd15_start_02' },
      { id: 'd15_start_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I matched an internship at Lovely International. Bangkok. Private. Starting salary is triple what the government pays, and the patients arrive in cars worth more than this building.', nextId: 'd15_start_03' },
      { id: 'd15_start_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You too? Ha. Then we will be colleagues again. Try not to look so disappointed.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd15_mid_01', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Sit. Five minutes, the department can survive. You asked me on day one why a physician trained at Rama is running nights in a provincial ER at forty-six.', nextId: 'd15_mid_02' },
      { id: 'd15_mid_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'I was a third year resident. There was a trial. Compassionate use of an unlicensed agent in patients who could not consent, sponsored by a company with a director on our board. I refused to enrol two of my patients. Then I wrote it down and sent it up.', nextId: 'd15_mid_03' },
      { id: 'd15_mid_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'Nothing dramatic happened. No one shouted. My rotations were simply rearranged until my training took eleven years instead of five, and one morning I understood the message and applied here. The man who arranged my rotations is now the director of the hospital you trained at. Professor Somchai.', nextId: 'd15_mid_04' },
      { id: 'd15_mid_04', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'I am not telling you to be a martyr. I am telling you that the cost is real and it is not paid in one dramatic evening. It is paid slowly, in small administrative increments, by people who are always very polite. Decide in advance what you will not do, because you will never have time to decide it in the moment.', flagEffect: 'EK_TRUSTS_YOU', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd15_end_01', speaker: 'Nurse Somjai (Pi Jai)', portrait: '/assets/somjai.jpg', text: 'Take this. My mobile number. In eleven years I have given it to four externs. Two of them still call. One of them calls too much.', nextId: 'd15_end_02' },
      { id: 'd15_end_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'You arrived able to recite the guidelines. You are leaving able to work when the guideline assumes equipment we do not have. That is the only thing this place can teach and it happens to be the thing that matters.', nextId: 'd15_end_03' },
      { id: 'd15_end_03', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'One last thing. At a private hospital, the patient is a customer, and a customer can be sold things. Watch what happens to your clinical reasoning when there is a price list on the other side of it.', nextId: undefined },
    ],
    cases: ['case_17', 'case_18', 'case_15'],
  },

  // ===========================================================
  // DAY 16 - Lovely International. Marble and metrics.
  // ===========================================================
  16: {
    startShiftEvents: [
      { id: 'd16_start_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'Welcome to Lovely International. I am Patient Experience. Two things before you touch anyone. We do not say "patient", we say "guest". And our door to doctor time is eight minutes, which is a contractual promise, not an aspiration.', nextId: 'd16_start_02' },
      { id: 'd16_start_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Ignore half of that. Mali is very good at her job and her job is not medicine. I am Kitipong. I run this department. Where were you before?', nextId: 'd16_start_03' },
      { id: 'd16_start_03', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Korat. Excellent. Then you can actually resuscitate, which puts you ahead of most of my interns. You will find the pathology here is thinner. Anxiety, reflux, jet lag, and the occasional genuine catastrophe in a person who owns an airline.', nextId: 'd16_start_04' },
      { id: 'd16_start_04', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'One structural difference you should absorb today. At Korat you rationed. Here there is no rationing. Everything is available, immediately, and someone is paying for it. That changes what "indicated" means. You will see.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd16_mid_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Internal medicine, third year here. Advice, freely given. Do not fight the order sets in your first week. Learn who signs your evaluation before you decide what hill you are dying on.', nextId: 'd16_mid_02' },
      { id: 'd16_mid_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Look at this place. Real coffee. A doctors lounge with a shower. Do you understand that I grew up in a house with a dirt floor? I am not apologising for enjoying it.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd16_end_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'Your first day metrics. Average revenue per guest, eleven thousand four hundred baht. Departmental average is twenty-six thousand. I am not criticising. I am showing you the number so that you know it exists.', nextId: 'd16_end_02' },
      { id: 'd16_end_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'I did not know I had a revenue target.', nextId: 'd16_end_03' },
      { id: 'd16_end_03', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'You do not. It is a metric, not a target. Nobody will ever put a target in writing, doctor. That would be improper.', nextId: undefined },
    ],
    cases: ['case_26', 'case_27', 'case_15'],
  },

  // ===========================================================
  // DAY 17 - The first upsell.
  // ===========================================================
  17: {
    startShiftEvents: [
      { id: 'd17_start_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Bay three. Forty-two year old executive, chest tightness after an argument with his wife. ECG normal, troponin negative at three hours, HEART score two. What do you want to do?', nextId: 'd17_start_02' },
      { id: 'd17_start_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'Low risk. Repeat troponin, then discharge with outpatient follow up. He does not need admission.', nextId: 'd17_start_03' },
      { id: 'd17_start_03', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Clinically correct. Now let me teach you private practice. He is frightened. His father died at fifty-one. He will not sleep for a week. A CT coronary angiogram gives him a calcium score and a number he can hold onto. Is that worthless?', nextId: 'd17_start_04' },
      { id: 'd17_start_04', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'It is thirty-eight thousand baht and a dose of radiation and a fourteen percent chance of an incidental finding that will haunt him for two years. Both of those sentences are true. I want you to notice that I can make either one sound like medicine.', choices: [
        { text: 'Discharge him with reassurance and a written safety net.', nextId: 'd17_start_05a', karmaEffect: 10, xpEffect: 15 },
        { text: 'Order the CT. He can afford it and he wants certainty.', nextId: 'd17_start_05b', karmaEffect: -10, xpEffect: 10 },
      ] },
      { id: 'd17_start_05a', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Good. That is the right answer and it will make you unpopular by roughly your fourth month. Write the safety net properly, because when you decline a scan you own the outcome completely.', nextId: undefined },
      { id: 'd17_start_05b', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'And there it is. You did not do it for money. You did it because saying no is harder than saying yes, and nobody has ever been sued for ordering a scan. That is how it starts. Not with an envelope.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd17_mid_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'He does the Socratic thing with every new intern. It is genuinely brilliant teaching. It is also how he finds out which of you will bend.', nextId: 'd17_mid_02' },
      { id: 'd17_mid_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'I bent in month five. A package deal on executive check ups. I am not going to pretend I did not know. Just be aware you are being assessed, and it is not your clinical knowledge being assessed.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd17_end_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I ordered nine CTs today. Ajarn Kit called me efficient. My mother had a stall in Khon Kaen market for thirty years and never once in her life was called efficient.', nextId: 'd17_end_02' },
      { id: 'd17_end_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'Nine. Out of how many patients?', nextId: 'd17_end_03' },
      { id: 'd17_end_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Eleven. Do not do that with your face. Every single one of them asked for it.', nextId: undefined },
    ],
    cases: ['case_26', 'case_23', 'case_24'],
  },

  // ===========================================================
  // DAY 18 - The envelope. The fork.
  // ===========================================================
  18: {
    startShiftEvents: [
      { id: 'd18_start_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'Room one is Khun Anuwat. Property, three towers on Rama IV. He asks for you specifically. Apparently you were kind to his driver last week.', nextId: 'd18_start_02' },
      { id: 'd18_start_02', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'Doctor. My daughter needs a fitness certificate for a diving licence in the Maldives. She smoked something at a party on Saturday. The medical includes a drug screen. You understand my position.', nextId: 'd18_start_03' },
      { id: 'd18_start_03', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'This is for your trouble. It is not a bribe, it is an inconvenience fee. Everyone in this building takes one. Ask your professor.', nextId: 'd18_start_04' },
      { id: 'd18_start_04', speaker: 'Narrator', portrait: '', text: 'The envelope is thick. Unsealed, so that you can see it without being asked to acknowledge it. Fifty thousand baht, roughly two months of your government salary.', choices: [
        { text: 'Refuse. Explain that a false certificate is a criminal offence for both of you.', nextId: 'd18_start_05a', karmaEffect: 25, xpEffect: 20 },
        { text: 'Take it. Sign the certificate. Nobody is harmed by a diving licence.', nextId: 'd18_start_05b', karmaEffect: -30, xpEffect: 10, flagEffect: 'CORRUPT_DOC' },
        { text: 'Refuse the money but sign the certificate anyway.', nextId: 'd18_start_05c', karmaEffect: -15, xpEffect: 10, flagEffect: 'CORRUPT_DOC' },
      ] },
      { id: 'd18_start_05a', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'Interesting. You are the first. I mean that literally, doctor, not as a compliment. Dr. Kitipong will hear about this, and not from me.', nextId: undefined },
      { id: 'd18_start_05b', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'Good. Sensible. My assistant has your name now. You will find that things become easier. Rotations, references, invitations. That is how it works, and it works well.', nextId: undefined },
      { id: 'd18_start_05c', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'Refusing the money and doing the favour anyway. You want the thing without the name for the thing. Doctor, that is worse. At least I am honest about what I am buying.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd18_mid_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:CORRUPT_DOC] I heard about Khun Anuwat. Relax, I am not going to lecture you. I will say one thing and then we never discuss it again. The second one is easier than the first, and the tenth one you will not remember happening.', nextId: 'd18_mid_02' },
      { id: 'd18_mid_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:WHISTLEBLOWER] Anuwat says you embarrassed him. I told him you are new and principled, which in his vocabulary means the same thing. Be careful. He owns two of our board seats through a nominee, and I am not able to protect an intern from a board seat.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd18_end_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: '[IF_FLAG:CORRUPT_DOC] So you took it. I am not judging you. I am telling you that I said exactly the same sentence to myself, in this exact corridor, four years ago.', nextId: 'd18_end_02' },
      { id: 'd18_end_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: '[IF_FLAG:WHISTLEBLOWER] You refused. Word travels fast in a building with this much marble. Some people here will hate you for it, because you have just proved it was possible.', nextId: 'd18_end_03' },
      { id: 'd18_end_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'And you? Which are you?', nextId: 'd18_end_04' },
      { id: 'd18_end_04', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'I am the one who keeps copies. I have never known why. Ask me again in a month.', nextId: undefined },
    ],
    cases: ['case_27', 'case_25', 'case_36'],
  },

  // ===========================================================
  // DAY 19 - Beam is thriving.
  // ===========================================================
  19: {
    startShiftEvents: [
      { id: 'd19_start_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'Intern of the month is Dr. Wachira. Guest satisfaction ninety-six percent, revenue per guest forty-one thousand. There is a photograph in the lobby.', nextId: 'd19_start_02' },
      { id: 'd19_start_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You are going to say something. Say it.', nextId: 'd19_start_03' },
      { id: 'd19_start_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Forty-one thousand baht per patient in an emergency department. Beam, what are you doing to them?', nextId: 'd19_start_04' },
      { id: 'd19_start_04', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Nothing that hurts anyone. Extra imaging. Overnight observation for people who would be fine at home. A cardiology consult for reflux. Nobody is harmed. My sister is at Chula because of this salary. Tell me which of her semesters I should give back.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd19_mid_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Bay seven. Construction worker, no insurance, crushed hand. Admissions is asking for a forty thousand baht deposit before theatre.', nextId: 'd19_mid_02' },
      { id: 'd19_mid_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Standard practice here is to stabilise and transfer him to a government hospital. Two hours of transfer time. He loses two fingers he would otherwise keep, and the paperwork will say it was clinically appropriate.', choices: [
        { text: 'Declare it an emergency stabilisation and take him to theatre now.', nextId: 'd19_mid_03a', karmaEffect: 20, xpEffect: 20, flagEffect: 'DEFIED_BILLING' },
        { text: 'Follow protocol. Stabilise and transfer.', nextId: 'd19_mid_03b', karmaEffect: -10, xpEffect: 5 },
      ] },
      { id: 'd19_mid_03a', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'You invoked the emergency exemption. That is legally your right and it is written into the Act. It is also written into your file. Both of those things are now true, doctor.', nextId: undefined },
      { id: 'd19_mid_03b', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Right. Correct by protocol. I want you to look at the transfer time on the form when you sign it. Two hours forty. Look at it properly. That is the number I could not stop looking at, back when I still could not sleep.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd19_end_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'You are wondering how a person like me happens. I will tell you, because self-knowledge is not the same as reform. I trained under Professor Somchai. Brilliant man. He taught me that a hospital is an organism and organisms need feeding.', nextId: 'd19_end_02' },
      { id: 'd19_end_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Everything you find distasteful here funds the sixty percent of our cases that never pay. I am not a villain in my own accounting. Nobody is. That is precisely why this is difficult, and why the people who solve it are never the people who are shocked by it.', nextId: undefined },
    ],
    cases: ['case_20', 'case_24', 'case_23'],
  },

  // ===========================================================
  // DAY 20 - The cost of the system, seen properly.
  // ===========================================================
  20: {
    startShiftEvents: [
      { id: 'd20_start_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'The woman in bay two came three weeks ago with the same abdominal pain. She was discharged after a package of tests with a diagnosis of gastritis. She was never scanned, because the scan was in the more expensive package and she chose the cheaper one.', nextId: 'd20_start_02' },
      { id: 'd20_start_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'She has a perforated gastric cancer. Stage four. She is thirty-six.', nextId: 'd20_start_03' },
      { id: 'd20_start_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Who counselled her on which package to buy?', nextId: 'd20_start_04' },
      { id: 'd20_start_04', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'A sales coordinator with a diploma in hospitality. That is the sentence I have been unable to say out loud for four years, and I have just said it to an intern I have known for five days.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd20_mid_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:CORRUPT_DOC] I am putting you on the executive check up clinic. Twelve percent of the package fee, paid quarterly, entirely legal as a physician incentive. You have earned it and you will find you have opinions about it later rather than now.', nextId: 'd20_mid_02' },
      { id: 'd20_mid_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:WHISTLEBLOWER] You have been asking radiology about indication rates. Two of my consultants have mentioned it. I am going to assume this is academic curiosity, because the alternative assumption ends your internship, and I would rather not lose someone who can actually resuscitate.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd20_end_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'I told you I keep copies. Eleven months of billing codes against clinical indication. Two hundred and forty cases where the code billed does not match anything in the note.', nextId: 'd20_end_02' },
      { id: 'd20_end_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'I have never shown it to anyone. I have a daughter in year three and a mortgage and no relatives with money. Do you understand what I am telling you, or do I have to say the rest of it?', nextId: undefined },
    ],
    cases: ['case_21', 'case_25', 'case_37'],
  },

  // ===========================================================
  // DAY 21 - Beam's patient.
  // ===========================================================
  21: {
    startShiftEvents: [
      { id: 'd21_start_01', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'Doctor, the man in observation eight. Dr. Wachira admitted him last night for observation of dizziness. He is now bradycardic at thirty-eight and confused.', nextId: 'd21_start_02' },
      { id: 'd21_start_02', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'He was given a beta blocker for the tachycardia that he did not have. The chart says heart rate one hundred and ten. The monitor strip from that hour says seventy-two.', nextId: 'd21_start_03' },
      { id: 'd21_start_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Get me the strip. The actual paper. Not the summary.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd21_mid_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I did not falsify anything. The system autopopulates vitals from triage. I clicked accept. Everyone clicks accept. Do you know how many charts I close in a shift?', nextId: 'd21_mid_02' },
      { id: 'd21_mid_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'The admission was for observation revenue. Fine. Yes. But the beta blocker was a mistake and I would have caught it if I were not closing forty charts a night to hit a number that Mali invented.', choices: [
        { text: 'Report the incident properly. Name the systemic cause too.', nextId: 'd21_mid_03a', karmaEffect: 15, xpEffect: 20 },
        { text: 'Fix the patient. Say nothing. He is drowning too.', nextId: 'd21_mid_03b', karmaEffect: -5, xpEffect: 10, flagEffect: 'PROTECTED_BEAM' },
      ] },
      { id: 'd21_mid_03a', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You wrote my name in an incident report. In writing. You could have come to me first. I would have come to you first.', nextId: undefined },
      { id: 'd21_mid_03b', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Thank you. I mean it. I will not forget this.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd21_end_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'The patient recovered. Atropine and time. You handled it well and I have said so to the medical director.', nextId: 'd21_end_02' },
      { id: 'd21_end_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Here is the part they do not teach. That near miss was not caused by Dr. Wachira. It was caused by a chart closure target. And the person who can change a chart closure target is not a doctor. That is what you are actually up against, and it does not have a face to be angry at.', nextId: undefined },
    ],
    cases: ['case_22', 'case_38', 'case_27'],
  },

  // ===========================================================
  // DAY 22 - The ledger.
  // ===========================================================
  22: {
    startShiftEvents: [
      { id: 'd22_start_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Storage room, second basement, twenty minutes. Do not bring your hospital phone.', nextId: 'd22_start_02' },
      { id: 'd22_start_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Eleven months. Billing codes, clinical notes, and the referral commissions. The commissions are the important part. Every executive package sold generates a payment to a consultancy in Singapore, and the consultancy has one director.', nextId: 'd22_start_03' },
      { id: 'd22_start_03', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Somchai Rattanaporn. Director of Ramathibodi. Your future employer, if I read your file correctly.', nextId: 'd22_start_04' },
      { id: 'd22_start_04', speaker: 'Narrator', portrait: '', text: 'She holds out the drive. She has not let go of it.', choices: [
        { text: 'Take it. Whatever this costs.', nextId: 'd22_start_05a', karmaEffect: 20, xpEffect: 25, flagEffect: 'WHISTLEBLOWER' },
        { text: 'Take it, but tell her you will decide later.', nextId: 'd22_start_05b', karmaEffect: 5, xpEffect: 15, flagEffect: 'HAS_LEDGER' },
        { text: 'Refuse. This ends your career before it starts.', nextId: 'd22_start_05c', karmaEffect: -15, xpEffect: 10, flagEffect: 'CORRUPT_DOC' },
      ] },
      { id: 'd22_start_05a', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Then listen carefully, because I have thought about this for four years. Do not go to the medical director. Do not go to the press. Go to the Medical Council with a named complaint, and give a copy to somebody in a different institution on the same day. One copy is a rumour. Two copies in two buildings is a fact.', nextId: undefined },
      { id: 'd22_start_05b', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Later is a real answer. It is also what I said in year one, and year two, and year three. I am not warning you. I am describing myself.', nextId: undefined },
      { id: 'd22_start_05c', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'Alright. I am not angry. I want you to know that I asked, so that in ten years you cannot tell yourself nobody ever asked you.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd22_mid_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'Security flagged a basement door badge at 09:14. Yours. Storage is not a clinical area. Was there something you needed?', nextId: 'd22_mid_02' },
      { id: 'd22_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'Wrong stairwell. This building has too many staircases and they all look the same.', nextId: 'd22_mid_03' },
      { id: 'd22_mid_03', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'They do. I have worked here nine years and I still take the wrong one.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd22_end_01', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'Doctor. Whatever you are carrying in that bag, do not leave it in your locker. They opened Dr. Napassorn locker in March. She never knew I saw.', nextId: 'd22_end_02' },
      { id: 'd22_end_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'Why are you telling me this, Pi Kai?', nextId: 'd22_end_03' },
      { id: 'd22_end_03', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'Because I have watched four interns go through this department, and you are the only one who has ever asked me what I thought about a patient. That is the whole reason. It is not a very grand one.', nextId: undefined },
    ],
    cases: ['case_39', 'case_28', 'case_23'],
  },

  // ===========================================================
  // DAY 23 - Kit knows.
  // ===========================================================
  23: {
    startShiftEvents: [
      { id: 'd23_start_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Close the door. [IF_FLAG:WHISTLEBLOWER] Napassorn has been copying billing data for eleven months. I have known for nine of them.', nextId: 'd23_start_02' },
      { id: 'd23_start_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'I let her. Do you want to know why? Because I am fifty-eight years old and I have a defibrillator in my chest, and somewhere around the third stent I stopped being able to explain my own career to myself.', nextId: 'd23_start_03' },
      { id: 'd23_start_03', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'But I cannot be the one to do it. Everything in that file has my signature on it. A confession from me is a man saving himself. A complaint from an intern with no financial interest is evidence. Do you see the difference?', choices: [
        { text: 'Ask him to testify alongside you.', nextId: 'd23_start_04a', karmaEffect: 15, xpEffect: 25, flagEffect: 'KIT_ALLY' },
        { text: 'Tell him a coward with a conscience is still a coward.', nextId: 'd23_start_04b', karmaEffect: 5, xpEffect: 10 },
        { text: '[IF_FLAG:CORRUPT_DOC] Tell him you will hand Napassorn to the board.', nextId: 'd23_start_04c', karmaEffect: -30, xpEffect: 15, flagEffect: 'BETRAYED_NAM' },
      ] },
      { id: 'd23_start_04a', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'If you file first, and if you name me, I will not deny anything. That is not courage, it is the cheapest possible version of it. But it is what I have, and it is real, and you should take it.', nextId: undefined },
      { id: 'd23_start_04b', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Yes. I know. I have known since about 2011. Now do it anyway, because being right about me changes nothing for the woman in bay two.', nextId: undefined },
      { id: 'd23_start_04c', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'You will do well here. I mean that as the worst thing I have ever said to another physician.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd23_mid_01', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'Resus one, cardiac arrest, and it is Khun Anuwat. The man with the envelope. Sixty-one, collapsed at his gym.', nextId: 'd23_mid_02' },
      { id: 'd23_mid_02', speaker: 'Narrator', portrait: '', text: 'Ventricular fibrillation. Your hands are already on the paddles before you have finished having the thought about who he is.', nextId: 'd23_mid_03' },
      { id: 'd23_mid_03', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: 'Twenty-two minutes and you got him back. Whatever you think of him, that was clean work. This is the part of the job nobody can corrupt. It is why some of us are still here.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd23_end_01', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'They tell me you did not stop for twenty minutes. And that you were the doctor who refused my envelope. Both facts, same person. I have been trying to make those fit together all afternoon.', nextId: 'd23_end_02' },
      { id: 'd23_end_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'They fit easily. Neither one was about you.', nextId: 'd23_end_03' },
      { id: 'd23_end_03', speaker: 'Khun Anuwat (VIP)', portrait: '/assets/anuwat.jpg', text: 'When the board meets, and it will meet, remember that I have one vote and a long memory. That is not a threat, doctor. For once it is not a threat.', nextId: undefined },
    ],
    cases: ['case_03_cardiac', 'case_40', 'case_24'],
  },

  // ===========================================================
  // DAY 24 - Filing. Or being bought.
  // ===========================================================
  24: {
    startShiftEvents: [
      { id: 'd24_start_01', speaker: 'Narrator', portrait: '', text: '[IF_FLAG:WHISTLEBLOWER] The complaint form is four pages. The hard part is not the writing. The hard part is the box that asks for your name and licence number, which is the box that makes it real.', nextId: 'd24_start_02' },
      { id: 'd24_start_02', speaker: 'Nurse Ann (phone)', portrait: '/assets/nurse.jpg', text: 'It is Ann, from Rama. Pi Ek gave your number to Pi Jai and Pi Jai gave it to me, so blame the entire province. I have been collecting the other half of this for two years, from the trial side. Send me a copy. Two buildings, one day, like Napassorn said.', nextId: 'd24_start_03' },
      { id: 'd24_start_03', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:CORRUPT_DOC] The board approved your fellowship sponsorship. Full funding, and a consultant post here when you finish. You will never see a government salary again. Congratulations. Do not look for me at the ceremony.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd24_mid_01', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'Mali asked me whether you had ever discussed billing with Dr. Napassorn. In an office. With a lawyer sitting in the corner not writing anything.', nextId: 'd24_mid_02' },
      { id: 'd24_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'And what did you say?', nextId: 'd24_mid_03' },
      { id: 'd24_mid_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I said I did not know. Which was true at 10:00 and stopped being true at 10:40 when I worked out why they were asking. So now you know that I know, and you also know that I did not tell them yet.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd24_end_01', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'I resigned this morning. Effective immediately, which means I have already handed in my badge. My name is on the complaint next to yours and I am not going to take it off.', nextId: 'd24_end_02' },
      { id: 'd24_end_02', speaker: 'Dr. Napassorn (Pi Nam)', portrait: '/assets/napassorn.jpg', text: 'My daughter asked why I was home before dark. I told her I had finished something. Four years to say a sentence that took nine seconds.', nextId: undefined },
    ],
    cases: ['case_41', 'case_29', 'case_26'],
  },

  // ===========================================================
  // DAY 25 - Last day at Lovely. The betrayal.
  // ===========================================================
  25: {
    startShiftEvents: [
      { id: 'd25_start_01', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'The internal review committee has your evidence bundle. It also has a statement from Dr. Wachira describing you as, and I am quoting, professionally erratic and personally hostile to Dr. Kitipong.', flagEffect: 'BEAM_BETRAYED_YOU', nextId: 'd25_start_02' },
      { id: 'd25_start_02', speaker: 'Khun Malinee (Khun Mali)', portrait: '/assets/malinee.jpg', text: 'For what it is worth, and it is worth nothing, I did not ask him for it. He offered. That is the part of this building I have never got used to. Nobody ever has to ask.', nextId: 'd25_start_03' },
      { id: 'd25_start_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'They had my chart audit. Eleven months of it. Every unnecessary admission with my signature. They offered me a clean record and a reference. What was I supposed to do, go back to Khon Kaen?', nextId: 'd25_start_04' },
      { id: 'd25_start_04', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You have a father who is a lecturer and a mother with a pension. You could survive being right. I could not. That is not an excuse. It is just the arithmetic and I did it correctly.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd25_mid_01', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:KIT_ALLY] I gave my statement to the Council at eleven this morning. Forty pages. I named the Singapore consultancy and I named Somchai. My licence will be suspended within a year and I find I do not mind as much as I expected.', nextId: 'd25_mid_02' },
      { id: 'd25_mid_02', speaker: 'Dr. Kitipong (Ajarn Kit)', portrait: '/assets/kitipong.jpg', text: '[IF_FLAG:CORRUPT_DOC] You are going to be far better at this than I ever was, and that is not a compliment. I was at least uncomfortable. Discomfort is a kind of brake. You do not seem to have one.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd25_end_01', speaker: 'Nurse Kanyarat (Pi Kai)', portrait: '/assets/kanyarat.jpg', text: 'The nurses signed this. Forty-one of us. It is not a petition, we are not allowed to file one. It is just a card. We wanted the number on it to be visible.', nextId: 'd25_end_02' },
      { id: 'd25_end_02', speaker: 'Narrator', portrait: '', text: 'Internship ends. The residency match list is posted at 18:00. Ramathibodi, Emergency Medicine. The building where all of this actually began, and where the director is a man whose name you have just written on a Medical Council complaint.', nextId: 'd25_end_03' },
      { id: 'd25_end_03', speaker: 'Dr. Ekkarat (Pi Ek) (phone)', portrait: '/assets/ekkarat.jpg', text: 'Pi Jai told me. So you are going back there, with his name on a form. I said the cost was real. I never said it was not worth paying. Call me when it gets bad, and it will get bad in about your fourth month.', nextId: undefined },
    ],
    cases: ['case_42', 'case_25', 'case_43'],
  },

  // ===========================================================
  // DAY 26 - Ramathibodi. Residency. You are the one they call.
  // ===========================================================
  26: {
    startShiftEvents: [
      { id: 'd26_start_01', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'I am chief resident. I have been awake for twenty-six hours and I have read your file, which took eleven minutes and was more interesting than the last forty files combined.', nextId: 'd26_start_02' },
      { id: 'd26_start_02', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'I do not care what you did at Lovely. In this department you will be judged on three things. Whether you show up. Whether your students are safe with you. And whether you can be honest at M and M when your own decision killed someone.', nextId: 'd26_start_03' },
      { id: 'd26_start_03', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'The whistleblower. Excellent. My rota just became a political event. Do you know what I want from a first year resident? Nothing philosophical. Two working hands and no opinions before 04:00.', nextId: 'd26_start_04' },
      { id: 'd26_start_04', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'Ignore Bob. He argued for three hours to get you onto his team and he will deny that for the rest of his life. Welcome back.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd26_mid_01', speaker: 'Tawan (Nong Wan)', portrait: '/assets/tawan.jpg', text: 'Doctor, I am the year five student on your team. I have not slept and I have not eaten and I do not know what I am supposed to be doing.', nextId: 'd26_mid_02' },
      { id: 'd26_mid_02', speaker: 'Narrator', portrait: '', text: 'He is exactly where you stood on day one. Fourteen days ago in game time. A geological age in every other sense.', choices: [
        { text: 'Give him one patient and stand behind him while he does it.', nextId: 'd26_mid_03a', karmaEffect: 15, xpEffect: 20, flagEffect: 'MENTORING_WAN' },
        { text: 'Tell him to observe and stay out of the way tonight.', nextId: 'd26_mid_03b', karmaEffect: 0, xpEffect: 5 },
      ] },
      { id: 'd26_mid_03a', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'You stood behind him instead of taking over. Do you know how rare that is in a first year? Most of them grab the syringe. Teaching costs you eleven minutes per patient and it is the only thing that outlives you.', nextId: undefined },
      { id: 'd26_mid_03b', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'Safe. Also how you produce a year six who has never held a needle. Somebody stood behind you at Korat when it would have been faster not to.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd26_end_01', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'The Council opened a file on the Singapore consultancy. It is real, it is moving, and it is slow. Professor Somchai has been in three closed meetings this week and has cancelled his teaching round twice.', nextId: 'd26_end_02' },
      { id: 'd26_end_02', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'He also personally signed off your residency contract. Think about what that means. He wants you inside the building where he can see you.', nextId: undefined },
    ],
    cases: ['case_44', 'case_47', 'case_11'],
  },

  // ===========================================================
  // DAY 27 - Mass casualty.
  // ===========================================================
  27: {
    startShiftEvents: [
      { id: 'd27_start_01', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'Scaffolding collapse at a construction site in Din Daeng. Nineteen casualties, at least six critical, and we are the nearest level one. First units are seven minutes out.', nextId: 'd27_start_02' },
      { id: 'd27_start_02', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'You are running triage at the door. Not resuscitation. Triage. Your job for the next hour is to be the person who decides which of them we do not treat yet.', nextId: 'd27_start_03' },
      { id: 'd27_start_03', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'Advice, and I will deny giving it. Triage is not medicine, it is arithmetic performed at speed. The moment you start treating the person in front of you, the queue behind them starts dying. Do not kneel down. If you kneel, you have stopped triaging.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd27_mid_01', speaker: 'Tawan (Nong Wan)', portrait: '/assets/tawan.jpg', text: 'Doctor, the man in the red zone, the crush injury. He is asking for water and holding my hand and I do not know how to leave.', nextId: 'd27_mid_02' },
      { id: 'd27_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'Then do not leave. Take that one job and do it completely. Wan, that is a real job. It is not the consolation prize.', nextId: 'd27_mid_03' },
      { id: 'd27_mid_03', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'Nineteen in, seventeen alive at three hours. The two we lost were unsurvivable at scene. That is as good as this ever gets and I need you to hear that it is good, because in an hour you will only be able to think about the two.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd27_end_01', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'You did not kneel. I watched. Fourteen years I have been doing this and I still kneel about once a year, and every time I do, somebody in the queue pays for it.', nextId: 'd27_end_02' },
      { id: 'd27_end_02', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'Since we are being unusually honest. The reason I cut corners is not laziness. It is 2021. I ran this department alone for four months and I made three hundred decisions a night. Cutting corners was the only way to be present at all. Then the surge ended and I could not find the setting to turn it off.', nextId: undefined },
    ],
    cases: ['case_49', 'case_50', 'case_14'],
  },

  // ===========================================================
  // DAY 28 - The trial resurfaces.
  // ===========================================================
  28: {
    startShiftEvents: [
      { id: 'd28_start_01', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'The patient in bay nine is enrolled in a study. Look at the consent form. Look at the date, then look at the date the first dose was given.', nextId: 'd28_start_02' },
      { id: 'd28_start_02', speaker: 'Narrator', portrait: '', text: 'The consent is dated two days after the first dose. The signature is a thumbprint. The witness line has a staff number rather than a name.', nextId: 'd28_start_03' },
      { id: 'd28_start_03', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'Eleven patients. Same protocol, same sponsor, same consultancy that paid the commissions at Lovely. Pi Ek refused to enrol two patients on this protocol thirteen years ago. It never stopped. It just got quieter.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd28_mid_01', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'Doctor. Sit. I signed your contract personally, did you know that? Your Korat evaluations were the best I have read in a decade. Ekkarat trained you well, and yes, I remember Ekkarat.', nextId: 'd28_mid_02' },
      { id: 'd28_mid_02', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'The Council file will close in about eight months. These things always do, not through corruption but through fatigue. So let me offer you the thing that is actually scarce. Research funding, a fellowship abroad, a professorship track. Not to buy your silence. To make your objection expensive.', choices: [
        { text: 'Refuse and tell him the consent forms are already scanned.', nextId: 'd28_mid_03a', karmaEffect: 25, xpEffect: 30, flagEffect: 'CONFRONTED_SOMCHAI' },
        { text: 'Say nothing. Take the meeting notes and leave.', nextId: 'd28_mid_03b', karmaEffect: 5, xpEffect: 15 },
        { text: '[IF_FLAG:CORRUPT_DOC] Accept the fellowship.', nextId: 'd28_mid_03c', karmaEffect: -30, xpEffect: 20, flagEffect: 'SOMCHAI_PROTEGE' },
      ] },
      { id: 'd28_mid_03a', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'Scanned. Of course they are. You know, Ekkarat said almost the same sentence to me in this room. Slightly better phrasing. He is running nights in Korat and he is forty-six years old and he will never be an associate professor. I did not do that to him. The system simply has no shelf for people like him, and it has one for me.', nextId: undefined },
      { id: 'd28_mid_03b', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'Sensible. Silence is not agreement, and I have never required agreement. Only silence.', nextId: undefined },
      { id: 'd28_mid_03c', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'Good. Understand what you have accepted. Not money. A shelf. From now on, everything you object to will cost you the shelf, and you will find yourself objecting less each year without ever noticing the decision.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd28_end_01', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'I was on that protocol as a second year. I enrolled four patients. I did not check the consent dates because a professor handed me the file and I was thirty hours into a shift.', nextId: 'd28_end_02' },
      { id: 'd28_end_02', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'Two of them died. Probably of their disease. Probably. I will testify. I have wanted someone to ask me for two years and I have been too much of a coward to volunteer.', nextId: undefined },
    ],
    cases: ['case_45', 'case_48', 'case_37'],
  },

  // ===========================================================
  // DAY 29 - Your own error. M and M.
  // ===========================================================
  29: {
    startShiftEvents: [
      { id: 'd29_start_01', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'The twenty-nine year old you discharged on Tuesday with a headache came back last night. Subarachnoid haemorrhage. She is in neuro ICU and the family is here.', nextId: 'd29_start_02' },
      { id: 'd29_start_02', speaker: 'Narrator', portrait: '', text: 'You remember her. Sudden onset, but she was neurologically intact, the CT at six hours was clean, and you offered a lumbar puncture. She declined. You documented it. Everything you did was defensible and she is still in that bed.', nextId: 'd29_start_03' },
      { id: 'd29_start_03', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'Listen to me carefully because I will only be sincere once this year. There is a version of M and M where you defend yourself and win, and everyone nods, and nothing changes, and you become me. Do not take that version.', choices: [
        { text: 'Present it without defence. Own the gap in the counselling.', nextId: 'd29_start_04a', karmaEffect: 20, xpEffect: 30, flagEffect: 'HONEST_AT_MM' },
        { text: 'Present the guideline defence. It was, technically, correct.', nextId: 'd29_start_04b', karmaEffect: -5, xpEffect: 10 },
      ] },
      { id: 'd29_start_04a', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'You said the sentence out loud in front of forty people. That her refusal was informed by how you framed the risk, and that you framed it in a hurry. Three consultants wrote it down. That is how a department actually changes.', nextId: undefined },
      { id: 'd29_start_04b', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'You were within guideline. The committee accepted it. Nobody learned anything, including you, and the next resident will frame the risk in exactly the same hurry.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd29_mid_01', speaker: 'Tawan (Nong Wan)', portrait: '/assets/tawan.jpg', text: 'Doctor, I have been thinking about quitting. If someone like you can make a decision that good and still have it end like that, what chance do I have?', nextId: 'd29_mid_02' },
      { id: 'd29_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'You have got it backwards, Wan. If good decisions guaranteed good outcomes, we would not need doctors. We would need a flowchart. The reason you exist is precisely that they do not.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd29_end_01', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'Her sister asked to speak to you. Not to complain. She wanted to know whether you had thought about it since. Families almost always want that and almost never ask.', nextId: 'd29_end_02' },
      { id: 'd29_end_02', speaker: 'Dr. Ekkarat (Pi Ek) (phone)', portrait: '/assets/ekkarat.jpg', text: 'Sixty-three names in my notebook now. I told you this would come in month four and I was wrong by two weeks. Write her name down. Not for guilt. For arithmetic. One name against the ones who walked out, and you have to count both sides or the arithmetic is a lie.', nextId: undefined },
    ],
    cases: ['case_46', 'case_34', 'case_35'],
  },

  // ===========================================================
  // DAY 30 - The reckoning.
  // ===========================================================
  30: {
    startShiftEvents: [
      { id: 'd30_start_01', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'The Medical Council hearing is at fourteen hundred. Kitipong, Napassorn, Pimchanok, and eleven consent forms with impossible dates.', nextId: 'd30_start_02' },
      { id: 'd30_start_02', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'I am here to testify. Against Lovely and against Somchai. I know what you are going to say, and you should say it, because I earned it.', nextId: 'd30_start_03' },
      { id: 'd30_start_03', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'They terminated me in April. The clean reference lasted five months. It turns out the arithmetic I was so proud of was also wrong. I am back at a district hospital in Khon Kaen and I make forty percent of what I made at Lovely and I sleep, which I had genuinely forgotten was a thing that happens.', choices: [
        { text: 'Let him testify. Say nothing about the statement.', nextId: 'd30_start_04a', karmaEffect: 15, xpEffect: 20 },
        { text: 'Tell him you have not forgiven him, and hold the door open anyway.', nextId: 'd30_start_04b', karmaEffect: 10, xpEffect: 20, flagEffect: 'BEAM_RECONCILED' },
      ] },
      { id: 'd30_start_04a', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'You are not going to make me say it. Somehow that is worse.', nextId: undefined },
      { id: 'd30_start_04b', speaker: 'Wachira (Beam)', portrait: '/assets/beam.jpg', text: 'That is fair. That is completely fair. Thank you for the second half of the sentence.', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd30_mid_01', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'I resigned at noon. Not because of the evidence. Because the board counted votes and I was six short. That is how these things actually end. Not with a verdict, with arithmetic.', nextId: 'd30_mid_02' },
      { id: 'd30_mid_02', speaker: 'Prof. Somchai', portrait: '/assets/somchai.jpg', text: 'I built the trauma centre you worked in today. Forty thousand patients a year pass through a building that exists because I was willing to be the person other people found distasteful. Both of those are my legacy and you are going to inherit the same arithmetic in about fifteen years.', flagEffect: 'SOMCHAI_EXPOSED', nextId: 'd30_mid_03' },
      { id: 'd30_mid_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Then I will build it without the eleven thumbprints. If that turns out to be impossible, I would rather find that out myself than take your word for it.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd30_end_01', speaker: 'Dr. Pimchanok (Pi Pim)', portrait: '/assets/pimchanok.jpg', text: 'I am leaving. Not burnt out, just done. A district hospital in Nan, four hours from a mall and eleven minutes from my mother. Somebody has to be the good doctor in a place with no professors in it.', nextId: 'd30_end_02' },
      { id: 'd30_end_02', speaker: 'Dr. Bob', portrait: '/assets/doctor.jpg', text: 'The department chair asked me who should be chief resident. I said your name without any of my usual qualifiers, which cost me physically. Do not make me regret it before Songkran.', nextId: 'd30_end_03' },
      { id: 'd30_end_03', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'Two years I have been carrying those consent forms in a bag. Tonight I am going to sleep without the bag. Thank you for being the person who did not need convincing.', nextId: undefined },
    ],
    cases: ['case_32', 'case_33', 'case_30'],
  },

  // ===========================================================
  // DAY 31 - Attending. The endgame.
  // ===========================================================
  31: {
    startShiftEvents: [
      { id: 'd31_start_01', speaker: 'Narrator', portrait: '', text: 'Six years. New badge. Same department, three renovations later. Consultant, Emergency Medicine, Faculty of Medicine Ramathibodi Hospital.', nextId: 'd31_start_02' },
      { id: 'd31_start_02', speaker: 'Dr. Tawan', portrait: '/assets/tawan.jpg', text: 'Ajarn. I am your senior resident tonight. You probably do not remember, but you gave me my first patient on a night when I was going to quit, and you stood behind me instead of taking the syringe.', nextId: 'd31_start_03' },
      { id: 'd31_start_03', speaker: 'Nurse Ann', portrait: '/assets/nurse.jpg', text: 'Your extern is on her way. Rama year six, terrified, arrived forty minutes early. Sound familiar?', nextId: undefined },
    ],
    midShiftEvents: [
      { id: 'd31_mid_01', speaker: 'New Extern', portrait: '/assets/extern.jpg', text: 'Ajarn, they told me you were the one who reported the trials. Everyone tells the story differently. Some people say it destroyed your career for three years.', nextId: 'd31_mid_02' },
      { id: 'd31_mid_02', speaker: 'You', portrait: '/assets/player.jpg', text: 'It did. Three years of no funding, no conferences, and a lot of nights. Then it stopped mattering, and I could not tell you which month that happened.', nextId: 'd31_mid_03' },
      { id: 'd31_mid_03', speaker: 'You', portrait: '/assets/player.jpg', text: 'Now stop asking me about committees. Bay four, thirty-two year old, shortness of breath. You are going to see her first and I am going to stand behind you.', nextId: undefined },
    ],
    endShiftEvents: [
      { id: 'd31_end_01', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'They gave me the visiting lectureship. Twenty-eight years in a provincial ER and a Bangkok faculty finally wants my opinion. I am going to talk about ventilator allocation and I am going to be extremely boring about it on purpose.', nextId: 'd31_end_02' },
      { id: 'd31_end_02', speaker: 'Dr. Ekkarat (Pi Ek)', portrait: '/assets/ekkarat.jpg', text: 'The notebook is at seventy-one names. Yours is not in it, which was never guaranteed. On day fifteen I told you to decide in advance what you would not do. You did. That is the entire lesson and it fits on one line.', nextId: 'd31_end_03' },
      { id: 'd31_end_03', speaker: 'Narrator', portrait: '', text: 'Ambulance bay doors. Two units inbound, seven minutes. The extern looks at you to see whether she should be frightened.', nextId: 'd31_end_04' },
      { id: 'd31_end_04', speaker: 'You', portrait: '/assets/player.jpg', text: 'Yes. Be frightened. Being frightened early is cheap. Now go and wash your hands, we have four minutes.', nextId: undefined },
    ],
    cases: ['case_50', 'case_31', 'case_47'],
  },

};

export default STORY_CAMPAIGN;
