/**
 * Firebase returns error codes like "auth/popup-closed-by-user". This maps the
 * common ones to plain Thai so the UI never shows a raw code.
 */
export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "อีเมลนี้ดูไม่ถูกนะ ลองเช็กอีกทีได้ไหม";
    case "auth/user-disabled":
      return "บัญชีนี้ถูกระงับอยู่ ติดต่อทีมงานได้เลย";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "ปิดหน้าต่างเข้าสู่ระบบไปก่อน ลองใหม่ได้เลย";
    case "auth/popup-blocked":
      return "เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ อนุญาต pop-up แล้วลองใหม่";
    case "auth/operation-not-allowed":
      return "ยังไม่ได้เปิดวิธีเข้าสู่ระบบนี้ บอกทีมงานหน่อยนะ";
    case "auth/unauthorized-domain":
      return "เว็บนี้ยังไม่ได้ลงทะเบียนกับระบบเข้าสู่ระบบ บอกทีมงานหน่อยนะ";
    case "auth/too-many-requests":
      return "ลองหลายรอบไปหน่อย รอสักครู่แล้วค่อยลองใหม่";
    case "auth/network-request-failed":
      return "เน็ตหลุด เช็กการเชื่อมต่อแล้วลองใหม่นะ";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "ลิงก์นี้หมดอายุหรือใช้ไปแล้ว ขอลิงก์ใหม่ได้เลย";
    default:
      return "มีอะไรผิดพลาด ลองใหม่อีกครั้งนะ";
  }
}
