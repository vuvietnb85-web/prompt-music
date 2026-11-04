import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hookFor,
  inspectSyllable,
  lineDensity,
  sanitizeForSuno,
  singableLyrics,
  syllableCount,
  syllablesOf,
} from "./viet-lyric.ts";

const GENRES = [
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
];

function sungLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("["));
}

describe("vietnamese lyric skill", () => {
  it("strips directions Suno would sing", () => {
    const dirty = "[Intro]\n(8 bars, about 15s — instrumental)\n[Chorus]\nĐèn vàng còn đây\nĐừng viết thêm lời, chỉ nâng quãng\n(repeat)";
    const clean = sanitizeForSuno(dirty);
    assert.equal(clean.includes("("), false);
    assert.match(clean, /\[Intro\]/);
    assert.match(clean, /Đèn vàng còn đây/);
    assert.equal(/bars|instrumental|đừng viết|repeat/i.test(clean), false);
  });

  it("writes Vietnamese lines that can sustain and carry meaning", () => {
    for (const genre of GENRES) {
      for (const bpm of [80, 110, 140]) {
        const draft = { genre, mood: "nocturnal, bittersweet, focused", language: "vi" as const };
        const text = singableLyrics(draft, bpm);
        const hook = hookFor("vi", draft);
        const density = lineDensity(bpm);
        assert.equal(text.includes("("), false, text);
        assert.equal(/\*|\{|\}|bars|lặp lại|không lời|đừng viết|instrumental/i.test(text), false);
        for (const line of sungLines(text)) {
          if (line === hook) continue;
          assert.equal(syllableCount(line), density, `${genre} ${bpm}: ${line}`);
          const last = syllablesOf(line).at(-1) ?? "";
          const info = inspectSyllable(last);
          assert.notEqual(info.coda, "stop", `${line} → ${last}`);
          assert.ok(info.tone === "ngang" || info.tone === "huyen", `${last} ${info.tone}`);
        }
        assert.ok(text.split(hook).length - 1 >= 6, hook);
      }
    }
  });

  it("keeps instrumental lyrics as tags only", () => {
    const text = singableLyrics({ genre: "V-Pop", mood: "", language: "instrumental" }, 104);
    assert.equal(sungLines(text).length, 0);
    assert.match(text, /\[Instrumental\]/);
    assert.equal(text.includes("("), false);
  });
});
