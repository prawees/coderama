/**
 * The weather for each day of the campaign. Rainy season in central Thailand, so it rains
 * on some days, and the days the story already describes as wet stay wet (day 1, Prasit
 * walked in through the rain, and day 3, the broken door lets the rain in). Day 2 the
 * corridor smells of old rain, so it is dry. The rest are fixed, so every playthrough
 * gets the same weather on the same day and the story can rely on it.
 */
export type Weather = "rain" | "clear";

const RAIN_DAYS = new Set([1, 3, 7, 12, 18, 22, 27]);

export function weatherFor(day: number): Weather {
  return RAIN_DAYS.has(day) ? "rain" : "clear";
}

/** The line on the day card, under the date */
export function weatherLine(day: number): { icon: "sun" | "rain"; th: string } {
  if (weatherFor(day) === "rain") {
    const wet = ["ฝนตกทั้งวัน พกร่มมาด้วยนะ", "ฝนพรำไม่หยุด ลานจอดรถกลายเป็นบ่อปลา", "ฝนตกหนัก ม้านั่งข้างนอกเปียกหมด"];
    return { icon: "rain", th: wet[day % wet.length] };
  }
  const dry = ["ร้อนตับแลบ พัดลมสู้เต็มที่แล้ว", "ลมเย็นมาสักที", "หน้ามะม่วง ทุกคนอารมณ์ดี", "ฟ้าใส เงียบจนน่าสงสัย", "ร้านข้าวมันไก่หน้าโรงพยาบาลคิวยาวทั้งวัน", "แดดดี ต้นลีลาวดีออกดอกเต็มต้น"];
  return { icon: "sun", th: dry[(day * 5) % dry.length] };
}

/** What you see from the window, by the real hour and the weather */
export function windowView(minuteOfDay: number, weather: Weather): string {
  const h = Math.floor(minuteOfDay / 60) % 24;
  if (weather === "rain") {
    if (h < 5 || h >= 19) return "ฝนตกในความมืด ไฟถนนสะท้อนเป็นทางยาวบนลานจอดรถ";
    return "ฝนพรำ หยดน้ำไหลเป็นทางบนกระจก รถเข็นข้าวแกงหน้าโรงพยาบาลกางร่มคันใหญ่";
  }
  if (h < 5) return "ลานจอดรถมืดสนิท มีแต่ไฟรถพยาบาลกะพริบอยู่คันเดียว";
  if (h < 7) return "ฟ้ารุ่งสีชมพูเหนือลานจอดรถ วันนี้ยังไม่ตัดสินใจว่าจะเป็นวันแบบไหน";
  if (h < 11) return "แสงยามเช้า แม่ค้าฝั่งตรงข้ามกำลังตั้งร้าน";
  if (h < 16) return "บ่ายร้อนจัด ลานจอดรถระยิบระยับ";
  if (h < 19) return "แสงทองยามเย็น ท้องฟ้าเหมือนมะม่วงสุก";
  return "ไฟร้านข้าวต้มฝั่งตรงข้ามเปิดแล้ว คนเพิ่งเลิกงานเดินกลับบ้าน";
}
