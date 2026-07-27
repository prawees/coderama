import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';

/**
 * Captures a snapshot of the given HTML element (typically the game wrapper)
 * and uses Capacitor's Share API to prompt the native iOS share sheet.
 * 
 * @param elementId The ID of the HTML element to capture.
 * @param title Title of the share dialog.
 * @param text Text to accompany the shared image.
 */
export async function shareAutopsyCard(elementId: string, title: string, text: string) {
  if (typeof window === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Could not find element with ID: ${elementId}`);
    return;
  }

  try {
    // 1. Generate Base64 PNG from the DOM element (including WebGL canvas if preserveDrawingBuffer is true)
    const dataUrl = await toPng(element, { quality: 0.95 });

    // 2. Share using Capacitor
    await Share.share({
      title: title,
      text: text,
      url: dataUrl,
      dialogTitle: 'Share your Code Rama case',
    });
  } catch (error) {
    console.error('Failed to generate or share image:', error);
  }
}
