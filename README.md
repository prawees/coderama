# 🏥 Code Rama (โค้ด รามา)
### 2D Hospital Simulation RPG & Emergency Room Clinical Engine

> *"Welcome to Code Rama ER, Doctor. Get ready for a real 'เวรเยิน' experience with 36-hour calls, broken coffee machines, and patients mapped directly to the National License (NL) blueprints."*

---

## 🎮 What is Code Rama?

**Code Rama** is a retro 2D pixel medical RPG and clinical simulation platform built on **Next.js 14**, **Pixi.js 8**, and **Zustand**. 

Combining classic RPG progression with high-fidelity medical decision-making, players step into the shoes of a medical doctor rising through the ranks of an overworked emergency department. Manage chaotic ER beds, interpret 12-lead ECGs and lab panels, perform life-saving procedure minigames, navigate complex hospital politics, and survive the grueling 30-day shift campaign.

---

## 📖 The 30-Day Story Campaign

The narrative spans **30 in-game days** featuring branching dialogue, ethical dilemmas, relationship progression, and career milestone exams:

- **Days 1–5: Med Student (MED_Y5 / Extern)**  
  Starting out under the stern supervision of **Prof. Somchai**. Learn triage protocols, fluid resuscitation, and basic toxicology.
- **Days 6–10: Sub-Intern (MED_Y6)**  
  Increased bed capacity, motorcycle trauma cases, fast-paced triage, and sudden mid-shift emergency alerts.
- **Days 11–15: Intern Year (The Brutal Ward)**  
  The infamous 36-hour shifts. Exhaustion, power outages, and deepening coworker relationships.
- **Days 16–25: Resident (R1–R3)**  
  Complex multi-system trauma, DKA, septic shock, VIP patient dilemmas, and ethical choices that affect your hospital Karma.
- **Days 26–30: Attending & Chief of Medicine**  
  End-of-year promotion exams, high-stakes boss battles (mass casualty incident response), and the **Prestige / Legacy System** (retiring to begin a *Legacy of Wealth* or *Legacy of Knowledge*).

> **Bilingual Narrative**: Story dialogue and cutscenes are available in both **English** and **Thai** (`lib/StoryManager.ts`, `lib/StoryManagerTH.ts`).

---

## 🩺 Clinical Simulation Engine

The clinical engine powers over **50 interactive medical scenarios** mapped to core medical licensing blueprints:

- **Realistic Management Graphs**: Each case runs on an interactive directed acyclic graph (DAG) of interventions, required treatments, lab orders, and diagnostic branch points.
- **Dynamic Vitals & Real-Time Feedback**: Heart rate, blood pressure, SpO2, respiratory rate, and GCS dynamically respond to treatment timings and drug choices.
- **Defibrillator & CPR Procedure Minigame**: Framerate-independent timing bar with real-time feedback and tactile haptics.
- **Universal Clinical Outcome Resolver**: Evaluates multi-step management choices, recognizing clinical stabilization (`improved`, `resolved`, `correct`, `stabilized`) and logging shift statistics.

---

## 🏥 2D Pixel ER World (Pixi.js 8)

- **Interactive ER Beds**: Hospital beds render dynamic pixel sprites with mattresses, pillows, blankets, and patients whose visual appearance reflects their case data (skin tones, shirt colors).
- **Bedside Status Alarms**: Active beds display pulsing visual monitors - green heart pulse for stable cases, critical red alarms when triage timers near expiration.
- **Coworker NPCs & Friendship System**:
  - **Nurse Ann (`Ann ❤️`)**: Gift Specialty Coffee purchased from the Supply Closet to build friendship hearts and unlock emotional cutscenes.
  - **Ajarn Grump (`Aj. Grump`)**: The grumpy senior attending on break who tells you to get back to treating patients.
- **Contextual Action Prompts**: Dynamic floating HUD instructions appear when approaching beds, NPCs, the consult terminal, or leaderboard screens.
- **Audio Synthesizer Engine**: Adaptive chiptune music tracks and ambient procedural hospital hums (`lib/audio.ts`, `lib/music.ts`).

---

## 🛒 Economy & Progression

- **Supply Closet (`/hub/shop`)**:
  - Consumables: Double Espresso (restores 50 energy during brutal shifts).
  - Hospital Upgrades: Automated ECG machines, lounge espresso maker, triage monitors.
  - Personal Gear: Stethoscopes, clinical scrubs, and running shoes providing passive energy and stat buffs.
- **Doctor ID Badge (`/profile`)**: Customize your doctor's hair, scrubs, pants, shoes, and skin tone.
- **Promotion Exams & Leaderboards**: Track XP, clinical accuracy, and patient survival rates across shift summaries (`/summary`).

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, configured for static export `output: 'export'`)
- **2D Engine**: Pixi.js 8 (WebGL / WebGPU canvas renderer)
- **State Management**: Zustand with persistent storage
- **Styling**: Tailwind CSS with custom pixel UI components (`PixelPanel`, `PixelButton`)
- **Audio**: Web Audio API procedural synthesizers + generative chiptune tracks
- **Mobile & Desktop Shell**: Capacitor (iOS/Android) & Electron (macOS desktop bundle)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/prawees/coderama.git
cd coderama
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build Static Export

```bash
npm run build
```

Generates the complete static build in `out/` with all 51 medical cases pre-rendered.

---

## 🎮 Controls

| Action | Keyboard | Touch / On-Screen |
| :--- | :--- | :--- |
| **Movement** | `W / A / S / D` or `Arrow Keys` | Virtual D-Pad |
| **Interact / Treat / Talk** | `A` or `Spacebar` | Tap Action Prompt |
| **Minigame Timing** | `Spacebar` | Tap ECG Monitor Bar |
| **Quick Triage** | Number keys `1 / 2 / 3` | Tap Bed Pills in Dashboard |

---

## 🤝 Collaboration Notes (for Porames & Team)

- **Art & Assets**: The 2D sprites and UI are ripe for human touch / rework (e.g. Fable polish, character portraits, custom tilesets).
- **Clinical Cases**: Case JSON files live in `public/locales/en/` and `public/locales/th/`. New cases can be added by declaring a `managementGraph` with vitals and diagnostic nodes.
- **Story Campaigns**: Mid-shift events, ethical choices, and cutscenes are defined in `lib/StoryManager.ts` and `lib/StoryManagerTH.ts`.
