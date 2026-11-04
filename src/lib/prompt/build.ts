import type { AudioFeatures } from "@/lib/audio/analyze";
import { auditLyrics, hookFor, singableLyrics, type SingLanguage } from "@/lib/prompt/viet-lyric";

export type { SingLanguage };

export type StyleDraft = {
  genre: string;
  mood: string;
  vocals: string;
  instruments: string;
  production: string;
  language: SingLanguage;
  reference: string;
};

export const GENRES = [
  "V-Pop",
  "City Pop",
  "Ballad",
  "R&B",
  "Afro-fusion",
  "Amapiano",
  "Phonk",
  "Melodic Trap",
  "House",
  "Indie Folk",
  "Synthwave",
  "Disco Funk",
  "Lo-fi",
  "Rock",
] as const;

export type QcReport = {
  catchiness: number;
  trending: number;
  length: number;
  coherence: number;
  overall: number;
  seconds: number;
  diction: number;
  sunoSafe: number;
  notes: string[];
};

const TOKENS = [" true", " still", " now", " too", " steady", " clean", " and", " soft", " line", " a"];

function fillGap(gap: number): string | null {
  if (gap <= 0) return "";
  const prev = new Int16Array(gap + 1).fill(-1);
  const used = new Int16Array(gap + 1).fill(-1);
  const q = [0];
  prev[0] = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const u = q[qi] ?? 0;
    if (u === gap) break;
    for (let t = 0; t < TOKENS.length; t++) {
      const v = u + (TOKENS[t]?.length ?? 0);
      if (v <= gap && prev[v] === -1) {
        prev[v] = u;
        used[v] = t;
        q.push(v);
      }
    }
  }
  if (prev[gap] === -1) return null;
  const parts: string[] = [];
  let cursor = gap;
  while (cursor > 0) {
    const token = TOKENS[used[cursor] ?? 0] ?? "";
    parts.push(token);
    cursor = prev[cursor] ?? 0;
  }
  return parts.reverse().join("");
}

export function exact995(input: string, target = 995): string {
  let text = input.replace(/\s+/g, " ").trim();
  if (!text) text = "Instrumental groove with a short repeated motif.";
  if (!text.endsWith(".")) text += ".";
  const addon = " Steady groove holds.";
  while (text.length + addon.length <= target) text += addon;
  if (text.length > target) {
    const slice = text.slice(0, target);
    const period = slice.lastIndexOf(".");
    if (period >= target - 220) text = slice.slice(0, period + 1);
    else text = `${slice.slice(0, target - 1).replace(/[\s,;:-]+$/, "")}.`;
  }
  if (text.length > target) text = `${text.slice(0, target - 1)}.`;
  let gap = target - text.length;
  if ((gap === 1 || gap === 3) && text.includes(" ")) {
    const body = text.slice(0, -1);
    const space = body.lastIndexOf(" ");
    text = `${space > 0 ? body.slice(0, space) : body}.`;
    gap = target - text.length;
  }
  if (gap > 0 && text.endsWith(".")) {
    const pad = fillGap(gap) ?? "";
    text = `${text.slice(0, -1)}${pad}.`;
  } else if (gap > 0) {
    text = `${text}${fillGap(gap) ?? ""}`;
  }
  if (text.length > target) text = `${text.slice(0, target - 1)}.`;
  if (text.length < target) {
    const hole = target - text.length;
    text = `${text.slice(0, -1)}${".".repeat(hole)}.`;
  }
  if (!text.endsWith(".")) text = `${text.slice(0, target - 1)}.`;
  return text.slice(0, target);
}

function clampLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function inferDraft(features: AudioFeatures): StyleDraft {
  const minor = features.key.endsWith("minor");
  const bright = features.brightness >= 2200;
  const dark = features.brightness > 0 && features.brightness < 1500;
  const fast = features.bpm >= 126;
  const slow = features.bpm > 0 && features.bpm < 96;
  const punchy = features.crestDb >= 14;
  const flat = features.crestDb > 0 && features.crestDb < 10;

  let genre = "V-Pop";
  if (fast && features.bpm >= 140 && bright) genre = "Phonk";
  else if (fast && flat) genre = "House";
  else if (slow && dark) genre = "Ballad";
  else if (!slow && !fast && bright && minor) genre = "City Pop";
  else if (features.bpm >= 104 && features.bpm <= 118) genre = "Afro-fusion";
  else if (slow) genre = "R&B";
  else if (punchy && features.bpm < 120) genre = "Indie Folk";

  let mood = minor ? "nocturnal, bittersweet, focused" : "open, forward, bright";
  if (genre === "Ballad") mood = "close, aching, restrained";
  if (genre === "City Pop") mood = "night-drive, glossy, wistful";
  if (genre === "Phonk") mood = "dark, tense, street-level";
  if (genre === "House") mood = "physical, steady, late-night";
  if (genre === "Afro-fusion") mood = "warm, rolling, sunlit";

  const instruments = [
    dark ? "warm analog bass" : "tight bass locked to the kick",
    punchy ? "dry drum kit, clear snare" : "soft programmed drums",
    bright ? "clean guitar or bright keys" : "muted electric piano",
    features.width > 0.28 ? "a wide pad only in the chorus" : "a close mono pad",
  ].join(", ");

  const production = flat
    ? "controlled modern compression, short room on the snare, vocal in front"
    : "dynamic transients, gentle bus compression, space kept for the hook";

  return {
    genre,
    mood,
    vocals:
      "close lead vocal, intelligible diction, open vowels on held notes, light doubles only on the hook, no spoken asides",
    instruments,
    production,
    language: "vi",
    reference: "",
  };
}

export function buildStylePrompt(features: AudioFeatures | null, draft: StyleDraft): string {
  const bpm = Math.round(features?.bpm || 104) || 104;
  const key = features?.key || "A minor";
  const vocal =
    draft.language === "instrumental"
      ? "Instrumental only. No vocals, no humming, no spoken count-in. A two-bar motif replaces the lyric hook and returns unchanged."
      : `Vocals: ${clampLine(draft.vocals)}. Sung language: ${draft.language === "vi" ? "Vietnamese" : "English"}.`;
  const diction =
    draft.language === "vi"
      ? "Vietnamese diction stays clear if the tune flattens tone: held notes use open vowels, line endings breathe, and no spoken directions sit in the lyric."
      : "";
  const measured = features
    ? `Measured flavor, not a sample to copy: ${features.durationSec.toFixed(0)} seconds, brightness ${Math.round(features.brightness)} Hz, crest ${features.crestDb.toFixed(1)} dB, loudness about ${features.lufs.toFixed(0)} LUFS.`
    : "No audio measurement yet. Treat the tempo and key as the brief.";
  const color = clampLine(draft.reference);
  const parts = [
    `${clampLine(draft.genre)} at ${bpm} BPM in ${key}. Mood: ${clampLine(draft.mood)}.`,
    vocal,
    diction,
    `Instruments: ${clampLine(draft.instruments)}.`,
    `Production: ${clampLine(draft.production)}.`,
    color ? `Color note: ${color}.` : "",
    "Write a full song of at least four minutes: 8-bar intro, verse, pre-chorus, chorus, verse two, pre-chorus, chorus, 8-bar bridge, bigger final chorus, outro.",
    "The hook is under eight words, identical every chorus, and lands on the downbeat.",
    "Verses sit quieter and narrower. Choruses open wider and louder. The bridge lifts once, then the last chorus adds one harmony without a new lyric.",
    "Mix near -14 LUFS integrated, true peak under -1 dBTP, sub mono below 90 Hz, lead in front of the band.",
    measured,
  ].filter(Boolean);
  return exact995(parts.join(" "));
}

function hookLine(draft: StyleDraft) {
  return hookFor(draft.language, draft);
}

export function buildLyrics(features: AudioFeatures | null, draft: StyleDraft) {
  const bpm = Math.max(70, Math.round(features?.bpm || 104) || 104);
  const secPerBar = (60 / bpm) * 4;
  const base = [
    ["Intro", 8],
    ["Verse 1", 16],
    ["Pre-Chorus", 8],
    ["Chorus", 16],
    ["Verse 2", 16],
    ["Pre-Chorus", 8],
    ["Chorus", 16],
    ["Bridge", 8],
    ["Chorus", 16],
    ["Outro", 8],
  ] as const;
  let bars = base.reduce((n, row) => n + row[1], 0);
  const extra = Math.max(0, Math.ceil(240 / secPerBar) - bars);
  const plan = base.map((row) => [row[0], row[1]] as [string, number]);
  let finalChorus: [string, number] | undefined;
  for (let i = plan.length - 1; i >= 0; i--) {
    if (plan[i]?.[0] === "Chorus") {
      finalChorus = plan[i];
      break;
    }
  }
  if (finalChorus) finalChorus[1] += extra;
  bars = plan.reduce((n, row) => n + row[1], 0);
  return { text: singableLyrics(draft, bpm), seconds: bars * secPerBar, bars, hook: hookLine(draft) };
}

const TREND: Record<string, number> = {
  "V-Pop": 86,
  "City Pop": 84,
  Ballad: 74,
  "R&B": 80,
  "Afro-fusion": 90,
  Amapiano: 88,
  Phonk: 78,
  "Melodic Trap": 76,
  House: 80,
  "Indie Folk": 70,
  Synthwave: 68,
  "Disco Funk": 82,
  "Lo-fi": 62,
  Rock: 66,
};

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreWork(
  features: AudioFeatures | null,
  draft: StyleDraft,
  styleText: string,
  lyrics: string,
): QcReport {
  const built = buildLyrics(features, draft);
  const notes: string[] = [];
  const hook = built.hook;
  const chorusBlocks = lyrics.split("[Chorus").length - 1;
  const hookHits = hook ? lyrics.split(hook).length - 1 : (styleText.match(/motif/gi)?.length ?? 0);
  let catchiness = 38;
  if (chorusBlocks >= 2) catchiness += 18;
  else notes.push("Thiếu khối Chorus lặp. Hook cần xuất hiện ít nhất hai lần.");
  if (hookHits >= 3) catchiness += 22;
  else if (hookHits >= 1) catchiness += 10;
  else notes.push("Chưa thấy câu hook lặp nguyên văn.");
  if (hook && hook.split(/\s+/).length <= 8) catchiness += 8;
  const bpm = features?.bpm || 0;
  if (bpm >= 92 && bpm <= 132) catchiness += 8;
  const energies = features?.energy ?? [];
  if (energies.length > 4) {
    const third = Math.floor(energies.length / 3);
    const verseE = avg(energies.slice(third, third * 2));
    const high = Math.max(...energies);
    if (high - verseE > 0.18) catchiness += 8;
    else notes.push("Năng lượng nguồn khá đều. Prompt đã bắt chorus phải to và rộng hơn verse.");
  }
  catchiness = clampScore(catchiness);

  let trending = TREND[draft.genre] ?? 72;
  if (draft.language === "vi" && (draft.genre === "V-Pop" || draft.genre === "City Pop" || draft.genre === "Ballad"))
    trending += 4;
  if (draft.genre === "Lo-fi") notes.push("Lo-fi 2026 dễ chìm. Giữ hook ngắn nếu vẫn chọn hướng này.");
  if (styleText.length > 1000) trending -= 12;
  trending = clampScore(trending);
  notes.push("Điểm xu hướng là luật cục bộ 2026, không phải số liệu thị trường.");

  let length = 40;
  if (built.seconds >= 240) length += 35;
  else notes.push(`Cấu trúc hiện ước tính ${formatClock(built.seconds)}, dưới 4 phút.`);
  if (styleText.length >= 960 && styleText.length <= 995) length += 25;
  else if (styleText.length <= 1000) length += 12;
  else notes.push("Style vượt 1000 ký tự. Suno có thể cắt cụt.");
  length = clampScore(length);

  let coherence = 92;
  const bpmInText = styleText.match(/(\d+)\s*BPM/i);
  if (features && bpmInText && Math.abs(Number(bpmInText[1]) - Math.round(features.bpm)) > 2) {
    coherence -= 18;
    notes.push("BPM trong prompt không khớp số đo.");
  }
  if (features && features.key && !styleText.includes(features.key)) {
    coherence -= 12;
    notes.push("Tông trong prompt không khớp số đo.");
  }
  if (draft.language === "instrumental" && /lead vocal/i.test(styleText)) {
    coherence -= 15;
    notes.push("Đang chọn không lời nhưng prompt vẫn mô tả giọng hát.");
  }
  if (draft.genre === "Lo-fi" && /festival drop|big room/i.test(styleText)) {
    coherence -= 10;
    notes.push("Lo-fi và festival drop đang kéo hai hướng.");
  }
  coherence = clampScore(coherence);

  const phonetic = auditLyrics(lyrics, { language: draft.language, bpm: features?.bpm || 104, hook: built.hook });
  if (phonetic.safe < 70) notes.unshift("Ô lời còn hướng dẫn. Suno sẽ hát nhầm. Lọc lời trước khi chép.");
  for (const issue of phonetic.issues) {
    if (!notes.includes(issue) && !issue.startsWith("Lời trong")) notes.push(issue);
  }

  let overall = clampScore(catchiness * 0.28 + trending * 0.16 + length * 0.18 + coherence * 0.16 + phonetic.diction * 0.12 + phonetic.safe * 0.1);
  if (phonetic.safe < 70) overall = Math.min(overall, 64);
  if (overall >= 80 && phonetic.safe >= 90) notes.unshift("Đủ sức mang đi Suno. Ô lời chỉ có câu hát và thẻ đoạn.");
  else if (overall >= 80) notes.unshift("Đủ sức mang đi Suno. Nghe thử một bản rồi siết câu hook nếu cần.");
  else notes.unshift("Chưa nên chốt. Sửa các dòng phía dưới rồi viết lại prompt.");

  return {
    catchiness,
    trending,
    length,
    coherence,
    diction: phonetic.diction,
    sunoSafe: phonetic.safe,
    overall,
    seconds: built.seconds,
    notes: notes.slice(0, 6),
  };
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function emptyDraft(): StyleDraft {
  return {
    genre: "V-Pop",
    mood: "nocturnal, bittersweet, focused",
    vocals: "close lead vocal, intelligible diction, open vowels on held notes, light doubles only on the hook, no spoken asides",
    instruments: "tight bass, dry drums, muted electric piano",
    production: "gentle bus compression, vocal in front",
    language: "vi",
    reference: "",
  };
}
