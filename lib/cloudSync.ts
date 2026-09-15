import { useERStore } from "./erStore";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

let unsubscribeAuth: any = null;
let unsubscribeStore: any = null;
let syncTimeout: any = null;
let isHydrating = false;

export const initCloudSync = () => {
  // Prevent multiple initializations
  if (unsubscribeAuth) return;

  // Listen to Firebase Auth state changes
  unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Cloud Sync: User authenticated as", user.uid);
      await hydrateStoreFromCloud(user.uid);
      startStoreSubscription(user.uid);
    } else {
      console.log("Cloud Sync: User signed out. Stopping sync.");
      if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
      }
    }
  });
};

const hydrateStoreFromCloud = async (uid: string) => {
  isHydrating = true;
  try {
    const docRef = doc(db, "saves", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log("Cloud Sync: Found existing cloud save. Hydrating local store.");
      useERStore.setState(data);
    } else {
      console.log("Cloud Sync: No cloud save found. Creating initial save from local store.");
      await setDoc(docRef, useERStore.getState());
    }
  } catch (error) {
    console.error("Cloud Sync: Error fetching save from cloud", error);
  } finally {
    isHydrating = false;
  }
};

const startStoreSubscription = (uid: string) => {
  if (unsubscribeStore) unsubscribeStore();

  unsubscribeStore = useERStore.subscribe((state, prevState) => {
    // Prevent syncing while we are actively hydrating the store from the cloud
    if (isHydrating) return;

    // Debounce the sync so we don't spam Firestore on every tick
    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(async () => {
      try {
        const docRef = doc(db, "saves", uid);
        
        // Strip out non-serializable or transient state if necessary,
        // but Zustand's standard state is serializable JSON.
        // We probably don't want to save transient activeCases fully, but it's fine for now.
        const stateToSave = { ...state };
        
        // Remove functions from the state object before saving to Firestore
        const cleanState: any = {};
        for (const [key, value] of Object.entries(stateToSave)) {
          if (typeof value !== 'function') {
            cleanState[key] = value;
          }
        }
        
        await setDoc(docRef, cleanState, { merge: true });

        // Update the public leaderboard document
        if (cleanState.playerName) {
          const lbRef = doc(db, "leaderboards", uid);
          await setDoc(lbRef, {
            uid,
            displayName: cleanState.playerName,
            university: cleanState.university || "Unknown",
            xp: cleanState.xp || 0,
            currency: cleanState.currency || 0,
            day: cleanState.day || 1,
            avatar: cleanState.appearance || {},
            lastUpdated: new Date().toISOString()
          }, { merge: true });
        }

        console.log("Cloud Sync: Successfully pushed save to cloud.");
      } catch (error) {
        console.error("Cloud Sync: Error pushing save to cloud", error);
      }
    }, 5000); // 5-second debounce
  });
};
