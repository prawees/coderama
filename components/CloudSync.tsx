"use client";

import { useEffect, useRef } from "react";
import { useERStore } from "@/lib/erStore";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export function CloudSync() {
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = useERStore.subscribe((state, prevState) => {
      // Only sync if enabled and user is logged in
      if (!state.syncEnabled || !auth.currentUser) return;
      
      // Debounce the save (e.g. 5 seconds)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const userDoc = doc(db, "users", auth.currentUser!.uid);
          
          // Pick only the persistent state, omit shift stats or volatile UI state
          const stateToSave = {
            playerName: state.playerName,
            playerGender: state.playerGender,
            language: state.language,
            lifetimeXp: state.lifetimeXp,
            currency: state.currency,
            karma: state.karma,
            currentDay: state.currentDay,
            storyFlags: state.storyFlags,
            friendships: state.friendships,
            inventory: state.inventory,
            hospitalUpgrades: state.hospitalUpgrades,
            equipped: state.equipped,
            appearance: state.appearance,
            unlockedSkills: state.unlockedSkills,
            completedQuests: state.completedQuests,
            tutorialCompleted: state.tutorialCompleted,
            lastSavedAt: Date.now()
          };
          
          await setDoc(userDoc, { erState: stateToSave }, { merge: true });
          console.log("[CloudSync] Saved to Firestore successfully.");
        } catch (error) {
          console.error("[CloudSync] Failed to save to Firestore:", error);
        }
      }, 5000); // 5 seconds debounce
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return null; // Headless component
}
