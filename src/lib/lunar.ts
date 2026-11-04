const PI = Math.PI;

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone: number) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  C1 = C1 - 0.0004 * Math.sin(3 * dr * Mpr);
  C1 = C1 + 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Math.floor(Jd1 + C1 - deltat + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number) {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

function getLunarMonth11(yy: number, timeZone: number) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function solarToLunar(dd: number, mm: number, yy: number, timeZone = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) leap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export function canChiYear(lunarYear: number) {
  return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export type CivicEvent = { name: string; date: Date; days: number };

function atMidnight(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function upcomingEvents(now = new Date()): { lunarLabel: string; solarLabel: string; yearName: string; next: CivicEvent } {
  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const lunarLabel = `${lunar.day}/${lunar.month}${lunar.leap ? " nhuận" : ""} âm`;
  const solarLabel = `${WEEKDAYS[now.getDay()]} ${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
  const today = atMidnight(now).getTime();
  const events: { name: string; date: Date }[] = [];
  for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y++) {
    events.push(
      { name: "30/4", date: new Date(y, 3, 30) },
      { name: "1/5", date: new Date(y, 4, 1) },
      { name: "2/9", date: new Date(y, 8, 2) },
      { name: "Giáng sinh", date: new Date(y, 11, 25) },
    );
  }
  for (let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate()); cursor.getFullYear() <= now.getFullYear() + 1; cursor.setDate(cursor.getDate() + 1)) {
    const l = solarToLunar(cursor.getDate(), cursor.getMonth() + 1, cursor.getFullYear());
    if (l.day === 1 && l.month === 1 && !l.leap) events.push({ name: "Tết", date: new Date(cursor.getTime()) });
    if (l.day === 10 && l.month === 3 && !l.leap) events.push({ name: "Giỗ Tổ", date: new Date(cursor.getTime()) });
    if (l.day === 15 && l.month === 8 && !l.leap) events.push({ name: "Trung thu", date: new Date(cursor.getTime()) });
  }
  const upcoming = events
    .map((event) => ({
      ...event,
      days: Math.round((atMidnight(event.date).getTime() - today) / 86400000),
    }))
    .filter((event) => event.days >= 0)
    .sort((a, b) => a.days - b.days);
  const next = upcoming[0] ?? { name: "Tết", date: now, days: 0 };
  return { lunarLabel, solarLabel, yearName: canChiYear(lunar.year), next };
}
