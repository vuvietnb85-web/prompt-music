export type Section = {
  label: string;
  start: number;
  end: number;
  energy: number;
};

export type AudioFeatures = {
  durationSec: number;
  sampleRate: number;
  channels: number;
  rmsDb: number;
  peakDb: number;
  crestDb: number;
  lufs: number;
  bpm: number;
  bpmConfidence: number;
  key: string;
  keyConfidence: number;
  brightness: number;
  zcr: number;
  width: number;
  energy: number[];
  peaks: number[];
  sections: Section[];
};

export type PcmInput = {
  sampleRate: number;
  channels: Float32Array[];
};

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number };

function normBiquad(b0: number, b1: number, b2: number, a0: number, a1: number, a2: number): Biquad {
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function highpass(fs: number, f: number): Biquad {
  const w0 = (2 * Math.PI * f) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * 0.707);
  return normBiquad((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
}

function highshelf(fs: number, f: number, gainDb: number): Biquad {
  const A = 10 ** (gainDb / 40);
  const w0 = (2 * Math.PI * f) / fs;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * 0.707);
  const sqrtA = Math.sqrt(A);
  const b0 = A * (A + 1 + (A - 1) * cos + 2 * sqrtA * alpha);
  const b1 = -2 * A * (A - 1 + (A + 1) * cos);
  const b2 = A * (A + 1 + (A - 1) * cos - 2 * sqrtA * alpha);
  const a0 = A + 1 - (A - 1) * cos + 2 * sqrtA * alpha;
  const a1 = 2 * (A - 1 - (A + 1) * cos);
  const a2 = A + 1 - (A - 1) * cos - 2 * sqrtA * alpha;
  return normBiquad(b0, b1, b2, a0, a1, a2);
}

function applyBiquad(x: Float32Array, c: Biquad): Float32Array {
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xn = x[i] ?? 0;
    const yn = c.b0 * xn + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = xn;
    y2 = y1;
    y1 = yn;
    y[i] = yn;
  }
  return y;
}

function fft(re: Float32Array, im: Float32Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i] ?? 0;
      re[i] = re[j] ?? 0;
      re[j] = tr;
      const ti = im[i] ?? 0;
      im[i] = im[j] ?? 0;
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1;
      let wIm = 0;
      const half = len >> 1;
      for (let j = 0; j < half; j++) {
        const uRe = re[i + j] ?? 0;
        const uIm = im[i + j] ?? 0;
        const vr = re[i + j + half] ?? 0;
        const vi = im[i + j + half] ?? 0;
        const vRe = vr * wRe - vi * wIm;
        const vIm = vr * wIm + vi * wRe;
        re[i + j] = uRe + vRe;
        im[i + j] = uIm + vIm;
        re[i + j + half] = uRe - vRe;
        im[i + j + half] = uIm - vIm;
        const nWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nWRe;
      }
    }
  }
}

function db(value: number) {
  return 20 * Math.log10(Math.max(value, 1e-9));
}

function sliceRegion(
  channels: Float32Array[],
  srcRate: number,
  startSec: number,
  durSec: number,
  dstRate: number,
): Float32Array {
  const srcLen = channels[0]?.length ?? 0;
  const start = Math.max(0, Math.floor(startSec * srcRate));
  const end = Math.min(srcLen, Math.floor((startSec + durSec) * srcRate));
  if (end - start < 8) return new Float32Array(0);
  const ratio = srcRate / dstRate;
  const outLen = Math.max(1, Math.floor((end - start) / ratio));
  const out = new Float32Array(outLen);
  const nCh = channels.length;
  for (let i = 0; i < outLen; i++) {
    const a = start + Math.floor(i * ratio);
    const b = Math.min(end, start + Math.floor((i + 1) * ratio));
    const step = Math.max(1, Math.floor((b - a) / 8));
    let acc = 0;
    let count = 0;
    for (let j = a; j < b; j += step) {
      let s = 0;
      for (let c = 0; c < nCh; c++) s += channels[c]?.[j] ?? 0;
      acc += s / nCh;
      count++;
    }
    out[i] = count ? acc / count : 0;
  }
  return out;
}

function concatRegions(channels: Float32Array[], srcRate: number, dstRate: number, durationSec: number) {
  const windows: Array<[number, number]> = [[0, 22]];
  if (durationSec > 40) windows.push([durationSec * 0.38, 16]);
  if (durationSec > 70) windows.push([Math.max(0, durationSec * 0.68), 16]);
  const parts = windows
    .map(([s, d]) => sliceRegion(channels, srcRate, s, d, dstRate))
    .filter((p) => p.length > 0);
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Float32Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function levels(channels: Float32Array[]) {
  const n = channels[0]?.length ?? 0;
  const step = Math.max(1, Math.floor(n / 250000));
  let sum = 0;
  let count = 0;
  let peak = 0;
  let midE = 0;
  let sideE = 0;
  const stereo = channels.length > 1;
  for (let i = 0; i < n; i += step) {
    const l = channels[0]?.[i] ?? 0;
    const r = stereo ? (channels[1]?.[i] ?? l) : l;
    const m = (l + r) / 2;
    const s = (l - r) / 2;
    sum += m * m;
    count++;
    peak = Math.max(peak, Math.abs(l), Math.abs(r));
    midE += m * m;
    sideE += s * s;
  }
  const rms = Math.sqrt(sum / Math.max(1, count));
  const width = stereo ? sideE / Math.max(1e-9, midE + sideE) : 0;
  return { rms, peak, width };
}

function envelope(channel: Float32Array, buckets: number) {
  const n = channel.length;
  const out = new Array<number>(buckets).fill(0);
  if (n === 0) return out;
  const size = Math.floor(n / buckets);
  for (let i = 0; i < buckets; i++) {
    const start = i * size;
    const end = i === buckets - 1 ? n : start + size;
    const step = Math.max(1, Math.floor((end - start) / 1800));
    let s = 0;
    let c = 0;
    for (let j = start; j < end; j += step) {
      const v = channel[j] ?? 0;
      s += v * v;
      c++;
    }
    out[i] = Math.sqrt(s / Math.max(1, c));
  }
  return out;
}

function peaksOf(channel: Float32Array, count: number) {
  const n = channel.length;
  const out = new Array<number>(count).fill(0);
  if (n === 0) return out;
  const size = Math.floor(n / count);
  for (let i = 0; i < count; i++) {
    const start = i * size;
    const end = i === count - 1 ? n : start + size;
    const step = Math.max(1, Math.floor((end - start) / 80));
    let p = 0;
    for (let j = start; j < end; j += step) p = Math.max(p, Math.abs(channel[j] ?? 0));
    out[i] = p;
  }
  const max = Math.max(...out, 1e-6);
  return out.map((v) => v / max);
}

function sectionsFrom(curve: number[]): Section[] {
  if (curve.every((v) => v < 1e-5)) return [];
  const sorted = [...curve].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.34)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.67)] ?? 1;
  const kind = curve.map((v) => (v >= hi ? "high" : v <= lo ? "low" : "mid"));
  const runs: { k: string; a: number; b: number; e: number }[] = [];
  for (let i = 0; i < kind.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.k === kind[i]) {
      last.b = i;
      last.e = Math.max(last.e, curve[i] ?? 0);
    } else {
      runs.push({ k: kind[i] ?? "mid", a: i, b: i, e: curve[i] ?? 0 });
    }
  }
  const merged = runs.filter((r) => r.b - r.a >= 0);
  return merged.map((r, i) => {
    let label = "Verse";
    if (i === 0 && r.k !== "high") label = "Intro";
    else if (i === merged.length - 1 && r.k !== "high") label = "Outro";
    else if (r.k === "high") label = "Chorus";
    else if (r.k === "low") label = "Bridge";
    else if (r.k === "mid" && i > 0 && merged[i - 1]?.k === "low") label = "Pre-Chorus";
    const start = r.a / curve.length;
    const end = (r.b + 1) / curve.length;
    return { label, start, end, energy: r.e };
  });
}

function pearson(a: number[], b: number[]) {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i] ?? 0;
    mb += b[i] ?? 0;
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = (a[i] ?? 0) - ma;
    const xb = (b[i] ?? 0) - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da < 1e-12 || db < 1e-12) return 0;
  return num / Math.sqrt(da * db);
}

function rotate(profile: number[], shift: number) {
  return profile.map((_, i) => profile[(i - shift + 12) % 12] ?? 0);
}

function tonal(pcm: Float32Array, sampleRate: number) {
  const n = 2048;
  if (pcm.length < n) {
    return { key: "C major", confidence: 0, brightness: 0, zcr: 0 };
  }
  const windows = 48;
  const hop = Math.max(n, Math.floor((pcm.length - n) / windows));
  const chroma = new Array(12).fill(0);
  let brightNum = 0;
  let brightDen = 0;
  let crossings = 0;
  let counted = 0;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let w = 0; w < windows; w++) {
    const start = Math.min(pcm.length - n, w * hop);
    for (let i = 0; i < n; i++) {
      const win = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (n - 1));
      re[i] = (pcm[start + i] ?? 0) * win;
      im[i] = 0;
      if (i > 0 && (pcm[start + i] ?? 0) * (pcm[start + i - 1] ?? 0) < 0) crossings++;
      counted++;
    }
    fft(re, im);
    let num = 0;
    let den = 0;
    for (let k = 1; k < n / 2; k++) {
      const mag = Math.hypot(re[k] ?? 0, im[k] ?? 0);
      const freq = (k * sampleRate) / n;
      if (freq < 70 || freq > 4200) continue;
      num += freq * mag;
      den += mag;
      if (freq < 80 || freq > 2200 || mag < 1e-4) continue;
      const midi = 69 + 12 * Math.log2(freq / 440);
      const nearest = Math.round(midi);
      const dev = Math.abs(midi - nearest);
      if (dev > 0.35) continue;
      const pc = ((nearest % 12) + 12) % 12;
      chroma[pc] += mag * (1 - dev);
    }
    if (den > 0) {
      brightNum += num / den;
      brightDen++;
    }
  }
  let best = -2;
  let second = -2;
  let name = "C major";
  for (let shift = 0; shift < 12; shift++) {
    const maj = pearson(chroma, rotate(MAJOR, shift));
    const min = pearson(chroma, rotate(MINOR, shift));
    if (maj > best) {
      second = best;
      best = maj;
      name = `${NOTES[shift]} major`;
    } else if (maj > second) second = maj;
    if (min > best) {
      second = best;
      best = min;
      name = `${NOTES[shift]} minor`;
    } else if (min > second) second = min;
  }
  const confidence = best <= 0 ? 0 : Math.max(0, Math.min(1, (best - Math.max(0, second)) / Math.max(0.15, best)));
  const zcr = counted > 0 ? (crossings / counted) * sampleRate : 0;
  return {
    key: name,
    confidence,
    brightness: brightDen ? brightNum / brightDen : 0,
    zcr,
  };
}

function estimateBpm(pcm: Float32Array, sampleRate: number) {
  const frame = 512;
  const hop = 128;
  const nFrames = Math.floor((pcm.length - frame) / hop);
  if (nFrames < 40) return { bpm: 0, confidence: 0 };
  const onset = new Float32Array(nFrames);
  let prev = 0;
  let maxE = 0;
  let sumE = 0;
  for (let i = 0; i < nFrames; i++) {
    let s = 0;
    const off = i * hop;
    for (let j = 0; j < frame; j += 2) {
      const v = pcm[off + j] ?? 0;
      s += v * v;
    }
    const e = Math.sqrt(s / (frame / 2));
    maxE = Math.max(maxE, e);
    sumE += e;
    onset[i] = Math.max(0, e - prev);
    prev = e;
  }
  if (maxE < (sumE / nFrames) * 1.25) return { bpm: 0, confidence: 0 };
  let onsetEnergy = 0;
  for (let i = 0; i < nFrames; i++) onsetEnergy += onset[i] ?? 0;
  if (onsetEnergy < 1e-3) return { bpm: 0, confidence: 0 };
  const frameRate = sampleRate / hop;
  const lagMin = Math.max(1, Math.round((frameRate * 60) / 180));
  const lagMax = Math.round((frameRate * 60) / 70);
  const scores = new Float32Array(lagMax + 2);
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let acc = 0;
    let c = 0;
    for (let i = 0; i + lag < nFrames; i++) {
      acc += (onset[i] ?? 0) * (onset[i + lag] ?? 0);
      c++;
    }
    const half = lag * 2;
    let harm = 0;
    if (half <= lagMax) {
      let h = 0;
      let hc = 0;
      for (let i = 0; i + half < nFrames; i += 2) {
        h += (onset[i] ?? 0) * (onset[i + half] ?? 0);
        hc++;
      }
      harm = hc ? h / hc : 0;
    }
    scores[lag] = (c ? acc / c : 0) + 0.45 * harm;
  }
  let bestLag = lagMin;
  let best = -1;
  for (let lag = lagMin + 1; lag < lagMax; lag++) {
    const s = scores[lag] ?? 0;
    if (s >= (scores[lag - 1] ?? 0) && s >= (scores[lag + 1] ?? 0) && s > best) {
      best = s;
      bestLag = lag;
    }
  }
  if (best < 0) return { bpm: 0, confidence: 0 };
  let second = 0;
  for (let lag = lagMin; lag <= lagMax; lag++) {
    if (Math.abs(lag - bestLag) <= 2) continue;
    second = Math.max(second, scores[lag] ?? 0);
  }
  const raw = (frameRate * 60) / bestLag;
  const candidates = [raw / 2, raw, raw * 2].filter((b) => b >= 72 && b <= 176);
  let chosen = raw;
  let chosenScore = scores[bestLag] ?? 0;
  for (const b of candidates) {
    const lag = Math.round((frameRate * 60) / b);
    const sc = scores[lag] ?? 0;
    const pocket = b >= 94 && b <= 146;
    const chosenPocket = chosen >= 94 && chosen <= 146;
    if (sc >= chosenScore * 0.84 && pocket && !chosenPocket) {
      chosen = b;
      chosenScore = sc;
    } else if (sc > chosenScore * 1.04) {
      chosen = b;
      chosenScore = sc;
    }
  }
  return {
    bpm: Math.round(chosen),
    confidence: Math.max(0, Math.min(1, (best - second) / Math.max(best, 1e-9))),
  };
}

function lufsOf(pcm: Float32Array, sampleRate: number) {
  if (pcm.length < 64) return -70;
  const weighted = applyBiquad(applyBiquad(pcm, highpass(sampleRate, 70)), highshelf(sampleRate, 1500, 4));
  let ms = 0;
  const step = Math.max(1, Math.floor(weighted.length / 200000));
  let c = 0;
  for (let i = 0; i < weighted.length; i += step) {
    const v = weighted[i] ?? 0;
    ms += v * v;
    c++;
  }
  ms /= Math.max(1, c);
  if (ms < 1e-12) return -70;
  return -0.691 + 10 * Math.log10(ms);
}

export function analyzeChannels(input: PcmInput): AudioFeatures {
  const channels = input.channels.filter((c) => c.length > 0);
  const sampleRate = input.sampleRate;
  const primary = channels[0] ?? new Float32Array(0);
  const durationSec = sampleRate > 0 ? primary.length / sampleRate : 0;
  const { rms, peak, width } = levels(channels.length ? channels : [primary]);
  const dstRate = 11025;
  const mono = concatRegions(channels.length ? channels : [primary], sampleRate, dstRate, durationSec);
  const tone = tonal(mono, dstRate);
  const tempo = estimateBpm(mono, dstRate);
  const rawEnergy = envelope(primary, 24);
  const emax = Math.max(...rawEnergy, 1e-6);
  const energy = rawEnergy.map((v) => v / emax);
  const rmsDb = db(rms);
  const peakDb = db(peak);
  return {
    durationSec,
    sampleRate,
    channels: Math.max(1, channels.length),
    rmsDb,
    peakDb,
    crestDb: peakDb - rmsDb,
    lufs: lufsOf(mono, dstRate),
    bpm: tempo.bpm,
    bpmConfidence: tempo.confidence,
    key: tone.key,
    keyConfidence: tone.confidence,
    brightness: tone.brightness,
    zcr: tone.zcr,
    width,
    energy,
    peaks: peaksOf(primary, 240),
    sections: sectionsFrom(energy),
  };
}

export async function analyzeChannelsAsync(input: PcmInput): Promise<AudioFeatures> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  return analyzeChannels(input);
}
