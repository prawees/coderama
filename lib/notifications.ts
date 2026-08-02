import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermissions() {
  const { display } = await LocalNotifications.requestPermissions();
  return display === 'granted';
}

export async function scheduleOnCallCases() {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Clear existing scheduled notifications
  await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });

  // Schedule cases randomly over the next few hours to simulate the "On Call" experience.
  // We use fixed IDs to easily clear them if the player toggles off-duty.
  
  const now = new Date();
  
  // Case 1: 5 minutes from now
  await LocalNotifications.schedule({
    notifications: [
      {
        title: 'Emergency: Code Rama',
        body: 'A new patient has arrived in the ER!',
        id: 1,
        schedule: { at: new Date(now.getTime() + 5 * 60 * 1000) },
        actionTypeId: '',
        extra: null,
      },
      // Case 2: 30 minutes from now
      {
        title: 'Emergency: Code Rama',
        body: 'Trauma case incoming!',
        id: 2,
        schedule: { at: new Date(now.getTime() + 30 * 60 * 1000) },
        actionTypeId: '',
        extra: null,
      },
      // Case 3: 2 hours from now
      {
        title: 'Emergency: Code Rama',
        body: 'A new patient needs your attention.',
        id: 3,
        schedule: { at: new Date(now.getTime() + 120 * 60 * 1000) },
        actionTypeId: '',
        extra: null,
      }
    ]
  });
}

export async function cancelOnCallCases() {
  await LocalNotifications.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] });
}
