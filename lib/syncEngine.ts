import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useERStore } from "./erStore";

let unsubscribeSnapshot: (() => void) | null = null;

export const initSync = () => {
  // Listen for Auth changes
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("User logged in:", user.uid);
      const userRef = doc(db, "users", user.uid);
      
      // Try to fetch existing cloud state
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        // Load cloud state into local zustand
        useERStore.setState({ ...cloudData, syncEnabled: true });
        console.log("Loaded state from cloud");
      }

      // Setup real-time listener for multi-device sync
      unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && !docSnap.metadata.hasPendingWrites) {
            // Only update from server if it wasn't a local write to prevent loops
            const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
            if (source === "Server") {
                useERStore.setState({ ...docSnap.data(), syncEnabled: true });
            }
        }
      });

    } else {
      console.log("User logged out");
      useERStore.setState({ syncEnabled: false });
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
    }
  });

  // Listen for local Zustand changes and push to cloud
  useERStore.subscribe((state) => {
    const user = auth.currentUser;
    if (user && state.syncEnabled) {
      // Don't sync functions, only data
      const dataToSync = {
        shiftMode: state.shiftMode,
        activeCases: state.activeCases,
        lastSaved: Date.now(),
        xp: state.xp,
        lifetimeXp: state.lifetimeXp,
        currency: state.currency,
        inventory: state.inventory,
        equipped: state.equipped,
        energy: state.energy,
        maxEnergy: state.maxEnergy,
        clockMinutes: state.clockMinutes,
        appearance: state.appearance,
        activeQuests: state.activeQuests,
        completedQuests: state.completedQuests,
        friendships: state.friendships,
        tutorialCompleted: state.tutorialCompleted,
        playerName: state.playerName,
        playerGender: state.playerGender,
        language: state.language,
        unlockedSkills: state.unlockedSkills,
        currentDay: state.currentDay,
        storyFlags: state.storyFlags,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        prestigeCount: state.prestigeCount,
        legacyPerks: state.legacyPerks,
        shiftStats: state.shiftStats
      };

      const userRef = doc(db, "users", user.uid);
      setDoc(userRef, dataToSync, { merge: true }).catch(err => {
         console.error("Failed to sync to cloud", err);
      });
    }
  });
};
