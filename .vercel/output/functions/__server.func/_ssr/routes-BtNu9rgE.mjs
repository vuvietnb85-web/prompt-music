import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as sanitizeForSuno, i as hookFor, n as LYRIC_SKILL, o as singableLyrics, r as auditLyrics } from "./viet-lyric-l07g51rD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BtNu9rgE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NOTES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B"
];
var MAJOR = [
	6.35,
	2.23,
	3.48,
	2.33,
	4.38,
	4.09,
	2.52,
	5.19,
	2.39,
	3.66,
	2.29,
	2.88
];
var MINOR = [
	6.33,
	2.68,
	3.52,
	5.38,
	2.6,
	3.53,
	2.54,
	4.75,
	3.98,
	2.69,
	3.34,
	3.17
];
function normBiquad(b0, b1, b2, a0, a1, a2) {
	return {
		b0: b0 / a0,
		b1: b1 / a0,
		b2: b2 / a0,
		a1: a1 / a0,
		a2: a2 / a0
	};
}
function highpass(fs, f) {
	const w0 = 2 * Math.PI * f / fs;
	const cos = Math.cos(w0);
	const alpha = Math.sin(w0) / 1.414;
	return normBiquad((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha);
}
function highshelf(fs, f, gainDb) {
	const A = 10 ** (gainDb / 40);
	const w0 = 2 * Math.PI * f / fs;
	const cos = Math.cos(w0);
	const alpha = Math.sin(w0) / 1.414;
	const sqrtA = Math.sqrt(A);
	return normBiquad(A * (A + 1 + (A - 1) * cos + 2 * sqrtA * alpha), -2 * A * (A - 1 + (A + 1) * cos), A * (A + 1 + (A - 1) * cos - 2 * sqrtA * alpha), A + 1 - (A - 1) * cos + 2 * sqrtA * alpha, 2 * (A - 1 - (A + 1) * cos), A + 1 - (A - 1) * cos - 2 * sqrtA * alpha);
}
function applyBiquad(x, c) {
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
function fft(re, im) {
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
		const ang = -2 * Math.PI / len;
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
function db(value) {
	return 20 * Math.log10(Math.max(value, 1e-9));
}
function sliceRegion(channels, srcRate, startSec, durSec, dstRate) {
	const srcLen = channels[0]?.length ?? 0;
	const start = Math.max(0, Math.floor(startSec * srcRate));
	const end = Math.min(srcLen, Math.floor((startSec + durSec) * srcRate));
	if (end - start < 8) return /* @__PURE__ */ new Float32Array(0);
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
function concatRegions(channels, srcRate, dstRate, durationSec) {
	const windows = [[0, 22]];
	if (durationSec > 40) windows.push([durationSec * .38, 16]);
	if (durationSec > 70) windows.push([Math.max(0, durationSec * .68), 16]);
	const parts = windows.map(([s, d]) => sliceRegion(channels, srcRate, s, d, dstRate)).filter((p) => p.length > 0);
	const total = parts.reduce((n, p) => n + p.length, 0);
	const out = new Float32Array(total);
	let o = 0;
	for (const p of parts) {
		out.set(p, o);
		o += p.length;
	}
	return out;
}
function levels(channels) {
	const n = channels[0]?.length ?? 0;
	const step = Math.max(1, Math.floor(n / 25e4));
	let sum = 0;
	let count = 0;
	let peak = 0;
	let midE = 0;
	let sideE = 0;
	const stereo = channels.length > 1;
	for (let i = 0; i < n; i += step) {
		const l = channels[0]?.[i] ?? 0;
		const r = stereo ? channels[1]?.[i] ?? l : l;
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
	return {
		rms,
		peak,
		width
	};
}
function envelope(channel, buckets) {
	const n = channel.length;
	const out = new Array(buckets).fill(0);
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
function peaksOf(channel, count) {
	const n = channel.length;
	const out = new Array(count).fill(0);
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
function sectionsFrom(curve) {
	if (curve.every((v) => v < 1e-5)) return [];
	const sorted = [...curve].sort((a, b) => a - b);
	const lo = sorted[Math.floor(sorted.length * .34)] ?? 0;
	const hi = sorted[Math.floor(sorted.length * .67)] ?? 1;
	const kind = curve.map((v) => v >= hi ? "high" : v <= lo ? "low" : "mid");
	const runs = [];
	for (let i = 0; i < kind.length; i++) {
		const last = runs[runs.length - 1];
		if (last && last.k === kind[i]) {
			last.b = i;
			last.e = Math.max(last.e, curve[i] ?? 0);
		} else runs.push({
			k: kind[i] ?? "mid",
			a: i,
			b: i,
			e: curve[i] ?? 0
		});
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
		return {
			label,
			start,
			end,
			energy: r.e
		};
	});
}
function pearson(a, b) {
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
function rotate(profile, shift) {
	return profile.map((_, i) => profile[(i - shift + 12) % 12] ?? 0);
}
function tonal(pcm, sampleRate) {
	const n = 2048;
	if (pcm.length < n) return {
		key: "C major",
		confidence: 0,
		brightness: 0,
		zcr: 0
	};
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
			const win = .42 - .5 * Math.cos(2 * Math.PI * i / 2047) + .08 * Math.cos(4 * Math.PI * i / 2047);
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
			const freq = k * sampleRate / n;
			if (freq < 70 || freq > 4200) continue;
			num += freq * mag;
			den += mag;
			if (freq < 80 || freq > 2200 || mag < 1e-4) continue;
			const midi = 69 + 12 * Math.log2(freq / 440);
			const nearest = Math.round(midi);
			const dev = Math.abs(midi - nearest);
			if (dev > .35) continue;
			const pc = (nearest % 12 + 12) % 12;
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
	const confidence = best <= 0 ? 0 : Math.max(0, Math.min(1, (best - Math.max(0, second)) / Math.max(.15, best)));
	const zcr = counted > 0 ? crossings / counted * sampleRate : 0;
	return {
		key: name,
		confidence,
		brightness: brightDen ? brightNum / brightDen : 0,
		zcr
	};
}
function estimateBpm(pcm, sampleRate) {
	const frame = 512;
	const hop = 128;
	const nFrames = Math.floor((pcm.length - frame) / hop);
	if (nFrames < 40) return {
		bpm: 0,
		confidence: 0
	};
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
	if (maxE < sumE / nFrames * 1.25) return {
		bpm: 0,
		confidence: 0
	};
	let onsetEnergy = 0;
	for (let i = 0; i < nFrames; i++) onsetEnergy += onset[i] ?? 0;
	if (onsetEnergy < .001) return {
		bpm: 0,
		confidence: 0
	};
	const frameRate = sampleRate / hop;
	const lagMin = Math.max(1, Math.round(frameRate * 60 / 180));
	const lagMax = Math.round(frameRate * 60 / 70);
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
		scores[lag] = (c ? acc / c : 0) + .45 * harm;
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
	if (best < 0) return {
		bpm: 0,
		confidence: 0
	};
	let second = 0;
	for (let lag = lagMin; lag <= lagMax; lag++) {
		if (Math.abs(lag - bestLag) <= 2) continue;
		second = Math.max(second, scores[lag] ?? 0);
	}
	const raw = frameRate * 60 / bestLag;
	const candidates = [
		raw / 2,
		raw,
		raw * 2
	].filter((b) => b >= 72 && b <= 176);
	let chosen = raw;
	let chosenScore = scores[bestLag] ?? 0;
	for (const b of candidates) {
		const sc = scores[Math.round(frameRate * 60 / b)] ?? 0;
		const pocket = b >= 94 && b <= 146;
		const chosenPocket = chosen >= 94 && chosen <= 146;
		if (sc >= chosenScore * .84 && pocket && !chosenPocket) {
			chosen = b;
			chosenScore = sc;
		} else if (sc > chosenScore * 1.04) {
			chosen = b;
			chosenScore = sc;
		}
	}
	return {
		bpm: Math.round(chosen),
		confidence: Math.max(0, Math.min(1, (best - second) / Math.max(best, 1e-9)))
	};
}
function lufsOf(pcm, sampleRate) {
	if (pcm.length < 64) return -70;
	const weighted = applyBiquad(applyBiquad(pcm, highpass(sampleRate, 70)), highshelf(sampleRate, 1500, 4));
	let ms = 0;
	const step = Math.max(1, Math.floor(weighted.length / 2e5));
	let c = 0;
	for (let i = 0; i < weighted.length; i += step) {
		const v = weighted[i] ?? 0;
		ms += v * v;
		c++;
	}
	ms /= Math.max(1, c);
	if (ms < 1e-12) return -70;
	return -.691 + 10 * Math.log10(ms);
}
function analyzeChannels(input) {
	const channels = input.channels.filter((c) => c.length > 0);
	const sampleRate = input.sampleRate;
	const primary = channels[0] ?? /* @__PURE__ */ new Float32Array(0);
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
		sections: sectionsFrom(energy)
	};
}
async function analyzeChannelsAsync(input) {
	await new Promise((resolve) => setTimeout(resolve, 0));
	return analyzeChannels(input);
}
function makeDemo() {
	const sampleRate = 22050;
	const seconds = 24;
	const beat = 60 / 120;
	const n = sampleRate * seconds;
	const x = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const t = i / sampleRate;
		const p = t / seconds;
		let amp = .5;
		if (p < .12) amp = .28;
		else if (p < .36) amp = .62;
		else if (p < .58) amp = 1;
		else if (p < .74) amp = .4;
		else if (p < .9) amp = 1;
		else amp = .26;
		const into = t % beat;
		const beatIndex = Math.floor(t / beat);
		const kick = Math.exp(-into * 26) * Math.sin(2 * Math.PI * (70 + 80 * Math.exp(-into * 10)) * into);
		const snare = (beatIndex % 2 === 1 && into < .045 ? 1 - into / .045 : 0) * (i * 37 % 97 / 97 - .5);
		const root = [
			220,
			220,
			174.61,
			196
		][beatIndex % 4] ?? 220;
		const bass = Math.sin(2 * Math.PI * root * t) * (.35 + .65 * Math.exp(-into * 2.4));
		const f = [
			440,
			523.25,
			659.25,
			587.33
		][beatIndex % 4] ?? 440;
		const voice = (into < beat * .82 ? Math.exp(-into * 1.5) : 0) * (Math.sin(2 * Math.PI * f * t) + .22 * Math.sin(2 * Math.PI * f * 2 * t) + .12 * Math.sin(2 * Math.PI * (f * 1.5) * t));
		const hat = into > beat * .48 && into < beat * .53 ? (i * 13 % 50 / 50 - .5) * .35 : 0;
		x[i] = (kick * .85 + snare * .28 + bass * .42 + voice * .2 + hat) * amp;
	}
	let peak = 0;
	for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i] ?? 0));
	if (peak > 0) for (let i = 0; i < n; i++) x[i] = (x[i] ?? 0) / peak * .9;
	return {
		sampleRate,
		channels: [x]
	};
}
function encodeWav(channel, sampleRate) {
	const n = channel.length;
	const buffer = /* @__PURE__ */ new ArrayBuffer(44 + n * 2);
	const view = new DataView(buffer);
	const write = (offset, text) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};
	write(0, "RIFF");
	view.setUint32(4, 36 + n * 2, true);
	write(8, "WAVE");
	write(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	write(36, "data");
	view.setUint32(40, n * 2, true);
	let offset = 44;
	for (let i = 0; i < n; i++) {
		const s = Math.max(-1, Math.min(1, channel[i] ?? 0));
		view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true);
		offset += 2;
	}
	return new Blob([buffer], { type: "audio/wav" });
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var refineWithGrok = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || typeof input !== "object") throw new Error("Thiếu dữ liệu");
	const raw = input;
	const style = String(raw.style ?? "").slice(0, 4e3);
	const lyrics = String(raw.lyrics ?? "").slice(0, 8e3);
	const brief = String(raw.brief ?? "").slice(0, 2e3);
	if (!style && !brief) throw new Error("Chưa có prompt để tinh chỉnh");
	return {
		style,
		lyrics,
		brief
	};
}).handler(createSsrRpc("21a666dbe39f7dd48bf3b070f2adf075839f80e110cc87bcf6739715ce9c19a3"));
var GENRES = [
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
	"Rock"
];
var TOKENS = [
	" true",
	" still",
	" now",
	" too",
	" steady",
	" clean",
	" and",
	" soft",
	" line",
	" a"
];
function fillGap(gap) {
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
	const parts = [];
	let cursor = gap;
	while (cursor > 0) {
		const token = TOKENS[used[cursor] ?? 0] ?? "";
		parts.push(token);
		cursor = prev[cursor] ?? 0;
	}
	return parts.reverse().join("");
}
function exact995(input, target = 995) {
	let text = input.replace(/\s+/g, " ").trim();
	if (!text) text = "Instrumental groove with a short repeated motif.";
	if (!text.endsWith(".")) text += ".";
	const addon = " Steady groove holds.";
	while (text.length + 21 <= target) text += addon;
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
	} else if (gap > 0) text = `${text}${fillGap(gap) ?? ""}`;
	if (text.length > target) text = `${text.slice(0, target - 1)}.`;
	if (text.length < target) {
		const hole = target - text.length;
		text = `${text.slice(0, -1)}${".".repeat(hole)}.`;
	}
	if (!text.endsWith(".")) text = `${text.slice(0, target - 1)}.`;
	return text.slice(0, target);
}
function clampLine(text) {
	return text.replace(/\s+/g, " ").trim();
}
function inferDraft(features) {
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
		features.width > .28 ? "a wide pad only in the chorus" : "a close mono pad"
	].join(", ");
	return {
		genre,
		mood,
		vocals: "close lead vocal, intelligible diction, open vowels on held notes, light doubles only on the hook, no spoken asides",
		instruments,
		production: flat ? "controlled modern compression, short room on the snare, vocal in front" : "dynamic transients, gentle bus compression, space kept for the hook",
		language: "vi",
		reference: ""
	};
}
function buildStylePrompt(features, draft) {
	const bpm = Math.round(features?.bpm || 104) || 104;
	const key = features?.key || "A minor";
	const vocal = draft.language === "instrumental" ? "Instrumental only. No vocals, no humming, no spoken count-in. A two-bar motif replaces the lyric hook and returns unchanged." : `Vocals: ${clampLine(draft.vocals)}. Sung language: ${draft.language === "vi" ? "Vietnamese" : "English"}.`;
	const diction = draft.language === "vi" ? "Vietnamese diction stays clear if the tune flattens tone: held notes use open vowels, line endings breathe, and no spoken directions sit in the lyric." : "";
	const measured = features ? `Measured flavor, not a sample to copy: ${features.durationSec.toFixed(0)} seconds, brightness ${Math.round(features.brightness)} Hz, crest ${features.crestDb.toFixed(1)} dB, loudness about ${features.lufs.toFixed(0)} LUFS.` : "No audio measurement yet. Treat the tempo and key as the brief.";
	const color = clampLine(draft.reference);
	return exact995([
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
		measured
	].filter(Boolean).join(" "));
}
function hookLine(draft) {
	return hookFor(draft.language, draft);
}
function buildLyrics(features, draft) {
	const bpm = Math.max(70, Math.round(features?.bpm || 104) || 104);
	const secPerBar = 60 / bpm * 4;
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
		["Outro", 8]
	];
	let bars = base.reduce((n, row) => n + row[1], 0);
	const extra = Math.max(0, Math.ceil(240 / secPerBar) - bars);
	const plan = base.map((row) => [row[0], row[1]]);
	let finalChorus;
	for (let i = plan.length - 1; i >= 0; i--) if (plan[i]?.[0] === "Chorus") {
		finalChorus = plan[i];
		break;
	}
	if (finalChorus) finalChorus[1] += extra;
	bars = plan.reduce((n, row) => n + row[1], 0);
	return {
		text: singableLyrics(draft, bpm),
		seconds: bars * secPerBar,
		bars,
		hook: hookLine(draft)
	};
}
var TREND = {
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
	Rock: 66
};
function clampScore(n) {
	return Math.max(0, Math.min(100, Math.round(n)));
}
function scoreWork(features, draft, styleText, lyrics) {
	const built = buildLyrics(features, draft);
	const notes = [];
	const hook = built.hook;
	const chorusBlocks = lyrics.split("[Chorus").length - 1;
	const hookHits = hook ? lyrics.split(hook).length - 1 : styleText.match(/motif/gi)?.length ?? 0;
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
		if (Math.max(...energies) - verseE > .18) catchiness += 8;
		else notes.push("Năng lượng nguồn khá đều. Prompt đã bắt chorus phải to và rộng hơn verse.");
	}
	catchiness = clampScore(catchiness);
	let trending = TREND[draft.genre] ?? 72;
	if (draft.language === "vi" && (draft.genre === "V-Pop" || draft.genre === "City Pop" || draft.genre === "Ballad")) trending += 4;
	if (draft.genre === "Lo-fi") notes.push("Lo-fi 2026 dễ chìm. Giữ hook ngắn nếu vẫn chọn hướng này.");
	if (styleText.length > 1e3) trending -= 12;
	trending = clampScore(trending);
	notes.push("Điểm xu hướng là luật cục bộ 2026, không phải số liệu thị trường.");
	let length = 40;
	if (built.seconds >= 240) length += 35;
	else notes.push(`Cấu trúc hiện ước tính ${formatClock(built.seconds)}, dưới 4 phút.`);
	if (styleText.length >= 960 && styleText.length <= 995) length += 25;
	else if (styleText.length <= 1e3) length += 12;
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
	const phonetic = auditLyrics(lyrics, {
		language: draft.language,
		bpm: features?.bpm || 104,
		hook: built.hook
	});
	if (phonetic.safe < 70) notes.unshift("Ô lời còn hướng dẫn. Suno sẽ hát nhầm. Lọc lời trước khi chép.");
	for (const issue of phonetic.issues) if (!notes.includes(issue) && !issue.startsWith("Lời trong")) notes.push(issue);
	let overall = clampScore(catchiness * .28 + trending * .16 + length * .18 + coherence * .16 + phonetic.diction * .12 + phonetic.safe * .1);
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
		notes: notes.slice(0, 6)
	};
}
function avg(values) {
	if (!values.length) return 0;
	return values.reduce((s, n) => s + n, 0) / values.length;
}
function formatClock(seconds) {
	const s = Math.max(0, Math.round(seconds));
	return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
function emptyDraft() {
	return {
		genre: "V-Pop",
		mood: "nocturnal, bittersweet, focused",
		vocals: "close lead vocal, intelligible diction, open vowels on held notes, light doubles only on the hook, no spoken asides",
		instruments: "tight bass, dry drums, muted electric piano",
		production: "gentle bus compression, vocal in front",
		language: "vi",
		reference: ""
	};
}
var PI = Math.PI;
function jdFromDate(dd, mm, yy) {
	const a = Math.floor((14 - mm) / 12);
	const y = yy + 4800 - a;
	const m = mm + 12 * a - 3;
	let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
	if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
	return jd;
}
function getNewMoonDay(k, timeZone) {
	const T = k / 1236.85;
	const T2 = T * T;
	const T3 = T2 * T;
	const dr = PI / 180;
	let Jd1 = 2415020.75933 + 29.53058868 * k + 1178e-7 * T2 - 155e-9 * T3;
	Jd1 += 33e-5 * Math.sin((166.56 + 132.87 * T - .009173 * T2) * dr);
	const M = 359.2242 + 29.10535608 * k - 333e-7 * T2 - 347e-8 * T3;
	const Mpr = 306.0253 + 385.81691806 * k + .0107306 * T2 + 1236e-8 * T3;
	const F = 21.2964 + 390.67050646 * k - .0016528 * T2 - 239e-8 * T3;
	let C1 = (.1734 - 393e-6 * T) * Math.sin(M * dr) + .0021 * Math.sin(2 * dr * M);
	C1 = C1 - .4068 * Math.sin(Mpr * dr) + .0161 * Math.sin(2 * dr * Mpr);
	C1 = C1 - 4e-4 * Math.sin(3 * dr * Mpr);
	C1 = C1 + .0104 * Math.sin(2 * dr * F) - .0051 * Math.sin(dr * (M + Mpr));
	C1 = C1 - .0074 * Math.sin(dr * (M - Mpr)) + 4e-4 * Math.sin(dr * (2 * F + M));
	C1 = C1 - 4e-4 * Math.sin(dr * (2 * F - M)) - 6e-4 * Math.sin(dr * (2 * F + Mpr));
	C1 = C1 + .001 * Math.sin(dr * (2 * F - Mpr)) + 5e-4 * Math.sin(dr * (2 * Mpr + M));
	const deltat = T < -11 ? .001 + 839e-6 * T + 2261e-7 * T2 - 845e-8 * T3 - 81e-9 * T * T3 : -278e-6 + 265e-6 * T + 262e-6 * T2;
	return Math.floor(Jd1 + C1 - deltat + .5 + timeZone / 24);
}
function getSunLongitude(jdn, timeZone) {
	const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
	const T2 = T * T;
	const dr = PI / 180;
	const M = 357.5291 + 35999.0503 * T - 1559e-7 * T2 - 48e-8 * T * T2;
	const L0 = 280.46645 + 36000.76983 * T + 3032e-7 * T2;
	let DL = (1.9146 - .004817 * T - 14e-6 * T2) * Math.sin(dr * M);
	DL += (.019993 - 101e-6 * T) * Math.sin(dr * 2 * M) + 29e-5 * Math.sin(dr * 3 * M);
	let L = (L0 + DL) * dr;
	L -= PI * 2 * Math.floor(L / (PI * 2));
	return Math.floor(L / PI * 6);
}
function getLunarMonth11(yy, timeZone) {
	const off = jdFromDate(31, 12, yy) - 2415021;
	const k = Math.floor(off / 29.530588853);
	let nm = getNewMoonDay(k, timeZone);
	if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone);
	return nm;
}
function getLeapMonthOffset(a11, timeZone) {
	const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + .5);
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
function solarToLunar(dd, mm, yy, timeZone = 7) {
	const dayNumber = jdFromDate(dd, mm, yy);
	const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
	let monthStart = getNewMoonDay(k + 1, timeZone);
	if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
	let a11 = getLunarMonth11(yy, timeZone);
	let b11 = a11;
	let lunarYear;
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
	return {
		day: lunarDay,
		month: lunarMonth,
		year: lunarYear,
		leap
	};
}
var CAN = [
	"Giáp",
	"Ất",
	"Bính",
	"Đinh",
	"Mậu",
	"Kỷ",
	"Canh",
	"Tân",
	"Nhâm",
	"Quý"
];
var CHI = [
	"Tý",
	"Sửu",
	"Dần",
	"Mão",
	"Thìn",
	"Tỵ",
	"Ngọ",
	"Mùi",
	"Thân",
	"Dậu",
	"Tuất",
	"Hợi"
];
function canChiYear(lunarYear) {
	return `${CAN[(lunarYear + 6) % 10]} ${CHI[(lunarYear + 8) % 12]}`;
}
var WEEKDAYS = [
	"CN",
	"T2",
	"T3",
	"T4",
	"T5",
	"T6",
	"T7"
];
function atMidnight(d) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function upcomingEvents(now = /* @__PURE__ */ new Date()) {
	const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
	const lunarLabel = `${lunar.day}/${lunar.month}${lunar.leap ? " nhuận" : ""} âm`;
	const solarLabel = `${WEEKDAYS[now.getDay()]} ${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
	const today = atMidnight(now).getTime();
	const events = [];
	for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y++) events.push({
		name: "30/4",
		date: new Date(y, 3, 30)
	}, {
		name: "1/5",
		date: new Date(y, 4, 1)
	}, {
		name: "2/9",
		date: new Date(y, 8, 2)
	}, {
		name: "Giáng sinh",
		date: new Date(y, 11, 25)
	});
	for (let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate()); cursor.getFullYear() <= now.getFullYear() + 1; cursor.setDate(cursor.getDate() + 1)) {
		const l = solarToLunar(cursor.getDate(), cursor.getMonth() + 1, cursor.getFullYear());
		if (l.day === 1 && l.month === 1 && !l.leap) events.push({
			name: "Tết",
			date: new Date(cursor.getTime())
		});
		if (l.day === 10 && l.month === 3 && !l.leap) events.push({
			name: "Giỗ Tổ",
			date: new Date(cursor.getTime())
		});
		if (l.day === 15 && l.month === 8 && !l.leap) events.push({
			name: "Trung thu",
			date: new Date(cursor.getTime())
		});
	}
	const next = events.map((event) => ({
		...event,
		days: Math.round((atMidnight(event.date).getTime() - today) / 864e5)
	})).filter((event) => event.days >= 0).sort((a, b) => a.days - b.days)[0] ?? {
		name: "Tết",
		date: now,
		days: 0
	};
	return {
		lunarLabel,
		solarLabel,
		yearName: canChiYear(lunar.year),
		next
	};
}
var getUsdVnd = createServerFn({ method: "GET" }).handler(createSsrRpc("a0cdaf075ba169971a25549de629f4725e8f274ae6c3dc3697e3d54004e8f031"));
var WEATHER = {
	0: "quang",
	1: "ít mây",
	2: "mây",
	3: "kín mây",
	45: "sương",
	61: "mưa",
	63: "mưa vừa",
	65: "mưa to",
	80: "mưa rào",
	95: "dông"
};
var MORSE = {
	A: ".-",
	B: "-...",
	C: "-.-.",
	D: "-..",
	E: ".",
	F: "..-.",
	G: "--.",
	H: "....",
	I: "..",
	J: ".---",
	K: "-.-",
	L: ".-..",
	M: "--",
	N: "-.",
	O: "---",
	P: ".--.",
	Q: "--.-",
	R: ".-.",
	S: "...",
	T: "-",
	U: "..-",
	V: "...-",
	W: ".--",
	X: "-..-",
	Y: "-.--",
	Z: "--..",
	"0": "-----",
	"1": ".----",
	"2": "..---",
	"3": "...--",
	"4": "....-",
	"5": ".....",
	"6": "-....",
	"7": "--...",
	"8": "---..",
	"9": "----."
};
async function playMorse(text) {
	const ctx = new AudioContext();
	const gain = ctx.createGain();
	gain.gain.value = .07;
	gain.connect(ctx.destination);
	const dit = .08;
	let t = ctx.currentTime + .04;
	const cleaned = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
	for (const ch of cleaned) {
		if (ch === " " || ch === "\n") {
			t += dit * 7;
			continue;
		}
		const pat = MORSE[ch];
		if (!pat) continue;
		for (const sym of pat) {
			const dur = sym === "-" ? dit * 3 : dit;
			const osc = ctx.createOscillator();
			osc.type = "sine";
			osc.frequency.value = 680;
			osc.connect(gain);
			osc.start(t);
			osc.stop(t + dur);
			t += dur + dit;
		}
		t += dit * 2;
	}
	window.setTimeout(() => void ctx.close(), Math.max(300, (t - ctx.currentTime) * 1e3 + 200));
}
function CuDock({ sheet, setSheet, onRadio }) {
	const [clock, setClock] = (0, import_react.useState)(null);
	const [temp, setTemp] = (0, import_react.useState)("Nam Định …");
	const [fx, setFx] = (0, import_react.useState)("USD …");
	const [coords, setCoords] = (0, import_react.useState)({
		lat: 20.42,
		lon: 106.17,
		label: "Nam Định"
	});
	const [placeNote, setPlaceNote] = (0, import_react.useState)("");
	const [stations, setStations] = (0, import_react.useState)([]);
	const [radioError, setRadioError] = (0, import_react.useState)("");
	const [radioOn, setRadioOn] = (0, import_react.useState)(false);
	const radioRef = (0, import_react.useRef)(null);
	const [takes, setTakes] = (0, import_react.useState)([]);
	const [recOn, setRecOn] = (0, import_react.useState)(false);
	const [recNote, setRecNote] = (0, import_react.useState)("Bấm Thu sẽ xin quyền micro. File ở lại trên máy.");
	const recRef = (0, import_react.useRef)(null);
	const [morse, setMorse] = (0, import_react.useState)("PROMPT");
	const [payError, setPayError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setClock(upcomingEvents(/* @__PURE__ */ new Date()));
		const id = window.setInterval(() => setClock(upcomingEvents(/* @__PURE__ */ new Date())), 6e4);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		let cancel = false;
		const run = async () => {
			try {
				const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=Asia%2FBangkok`;
				const res = await fetch(url);
				if (!res.ok) throw new Error("weather");
				const body = await res.json();
				if (cancel) return;
				const c = body.current;
				const word = WEATHER[c?.weather_code ?? -1] ?? "thời tiết";
				setTemp(`${coords.label} ${Math.round(c?.temperature_2m ?? 0)}° ${word}`);
			} catch {
				if (!cancel) setTemp(`${coords.label} — không lấy được thời tiết`);
			}
		};
		run();
		return () => {
			cancel = true;
		};
	}, [coords]);
	(0, import_react.useEffect)(() => {
		let cancel = false;
		const run = async () => {
			try {
				const result = await getUsdVnd();
				if (cancel) return;
				setFx(result.ok ? `USD ${Math.round(result.vnd).toLocaleString("vi-VN")}đ` : "Tỉ giá không tải được");
			} catch {
				if (!cancel) setFx("Tỉ giá không tải được");
			}
		};
		run();
		return () => {
			cancel = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (sheet !== "paypal") return;
		const render = () => {
			const target = document.getElementById("paypal-container-T7AZ748Y27248");
			if (!target || !window.paypal) return;
			target.replaceChildren();
			window.paypal.HostedButtons({ hostedButtonId: "T7AZ748Y27248" }).render("#paypal-container-T7AZ748Y27248").catch(() => setPayError(true));
		};
		if (window.paypal) {
			render();
			return;
		}
		let script = document.getElementById("paypal-sdk");
		if (!script) {
			script = document.createElement("script");
			script.id = "paypal-sdk";
			script.async = true;
			script.src = "https://www.paypal.com/sdk/js?client-id=BAAIfuQli_a3Qud-8CIRqCRCeohqtiW29_i2Txx2rQM35pqMc-pbCIZX6L8tx1zbyOj_vp8AUE_dpSqOhc&components=hosted-buttons&disable-funding=venmo&currency=USD";
			document.body.appendChild(script);
		}
		const onErr = () => setPayError(true);
		script.addEventListener("load", render);
		script.addEventListener("error", onErr);
		return () => {
			script?.removeEventListener("load", render);
			script?.removeEventListener("error", onErr);
		};
	}, [sheet]);
	const ticker = clock ? `${clock.solarLabel}  ·  ${clock.lunarLabel}  ·  ${clock.yearName}  ·  ${temp}  ·  ${fx}  ·  ${clock.next.name} còn ${clock.next.days} ngày  ·  PROMPT phân tích nhạc và viết prompt Suno` : "Đang đọc lịch, thời tiết và tỉ giá";
	const openRadio = async () => {
		setSheet("radio");
		if (stations.length) return;
		setRadioError("");
		try {
			const res = await fetch("https://de1.api.radio-browser.info/json/stations/search?countrycode=VN&hidebroken=true&limit=25&order=votes&reverse=true");
			if (!res.ok) throw new Error("radio");
			const list = (await res.json()).map((s) => ({
				name: s.name?.trim() || "Đài",
				url: s.url_resolved || ""
			})).filter((s) => s.url.startsWith("http"));
			if (!list.length) throw new Error("empty");
			setStations(list);
		} catch {
			setRadioError("Không tải được danh sách đài Việt Nam. Thử lại khi có mạng.");
		}
	};
	const playStation = async (station) => {
		const audio = radioRef.current;
		if (!audio) return;
		onRadio();
		audio.src = station.url;
		try {
			await audio.play();
			setRadioOn(true);
			setRadioError("");
		} catch {
			setRadioOn(false);
			setRadioError("Đài không phát được. Chọn đài khác.");
		}
	};
	const startRec = async () => {
		setRecNote("Đang xin quyền micro…");
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const rec = new MediaRecorder(stream);
			const chunks = [];
			rec.ondataavailable = (event) => {
				if (event.data.size) chunks.push(event.data);
			};
			rec.onstop = () => {
				stream.getTracks().forEach((track) => track.stop());
				const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
				const stamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("vi-VN", {
					hour: "2-digit",
					minute: "2-digit"
				});
				setTakes((prev) => [{
					url: URL.createObjectURL(blob),
					label: `Thu ${stamp}`
				}, ...prev].slice(0, 6));
				setRecOn(false);
				setRecNote("Đã cắt đoạn. Nghe lại bên dưới. File không rời máy.");
			};
			rec.start(1e3);
			recRef.current = rec;
			setRecOn(true);
			setRecNote("Đang thu. Bấm Dừng để xả đoạn.");
		} catch {
			setRecOn(false);
			setRecNote("Không mở được micro. Hãy cho phép quyền rồi bấm lại.");
		}
	};
	const stopRec = () => {
		if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
	};
	const askPlace = () => {
		setPlaceNote("Xin quyền vị trí chỉ khi bạn bấm. Tọa độ không được lưu.");
		if (!navigator.geolocation) {
			setPlaceNote("Máy không có định vị. Giữ mốc Nam Định.");
			return;
		}
		navigator.geolocation.getCurrentPosition((pos) => {
			setCoords({
				lat: pos.coords.latitude,
				lon: pos.coords.longitude,
				label: "Tại chỗ"
			});
			setPlaceNote("");
		}, () => setPlaceNote("Không lấy được vị trí. Giữ mốc Nam Định."), {
			enableHighAccuracy: false,
			maximumAge: 6e4,
			timeout: 8e3
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: radioRef,
				preload: "none",
				className: "hidden",
				onPause: () => setRadioOn(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden border-b border-gold/40",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ticker-track py-1 font-display text-xs tracking-widest text-gold uppercase",
					children: ticker
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid flex-1 grid-cols-2 gap-1 px-2 py-1.5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate font-display tracking-wide text-fg uppercase",
						children: clock?.lunarLabel ?? "Âm lịch"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "truncate text-right text-muted",
						children: fx
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "col-span-2 truncate text-muted",
						children: temp
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-4 gap-1 px-2 pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockButton, {
						active: radioOn,
						onClick: () => void openRadio(),
						children: "Đài"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockButton, {
						onClick: () => setSheet("rec"),
						children: "Thu"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockButton, {
						onClick: () => setSheet("morse"),
						children: "Morse"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DockButton, {
						onClick: () => setSheet("paypal"),
						children: "Ủng hộ"
					})
				]
			}),
			sheet ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex flex-col bg-bg/95 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-3 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg tracking-widest text-gold uppercase",
						children: sheet === "radio" ? "Đài Việt Nam" : sheet === "rec" ? "Thu âm" : sheet === "morse" ? "Morse" : "Ủng hộ"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 border border-gold/50 px-3 font-display text-sm tracking-widest text-gold uppercase",
						onClick: () => setSheet(null),
						children: "Đóng"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children: [
						sheet === "radio" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Phát qua loa máy, không qua chuỗi nhạc đang phân tích."
								}),
								radioError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-fg",
									children: radioError
								}) : null,
								radioOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "min-h-11 border border-gold px-3 font-display tracking-widest text-gold uppercase",
									onClick: () => radioRef.current?.pause(),
									children: "Dừng đài"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1",
									children: stations.map((station) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "min-h-11 w-full border border-gold/30 px-3 text-left text-sm text-fg",
										onClick: () => void playStation(station),
										children: station.name
									}) }, station.url))
								})
							]
						}) : null,
						sheet === "rec" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: recNote
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
										onClick: () => void startRec(),
										disabled: recOn,
										children: "Thu"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "min-h-11 border border-gold px-4 font-display tracking-widest text-gold uppercase",
										onClick: stopRec,
										disabled: !recOn,
										children: "Dừng"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-2",
									children: takes.map((take) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "border border-gold/30 p-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-1 text-sm text-fg",
											children: take.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
											controls: true,
											src: take.url,
											className: "w-full"
										})]
									}, take.url))
								})
							]
						}) : null,
						sheet === "morse" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Âm 680 Hz, tốc độ khoảng 15 từ/phút. Dấu tiếng Việt được bỏ."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: morse,
									onChange: (event) => setMorse(event.target.value),
									rows: 4,
									className: "w-full border border-gold/40 bg-surface px-3 py-2 text-fg"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
									onClick: () => void playMorse(morse),
									children: "Phát Morse"
								})
							]
						}) : null,
						sheet === "paypal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Nút PayPal mở trang thanh toán. Không chạy nếu mạng chặn script."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { id: "paypal-container-T7AZ748Y27248" }),
								payError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-fg",
									children: "Nút PayPal chưa tải. Kiểm tra mạng rồi mở lại mục này."
								}) : null
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "mt-4 text-sm text-gold underline",
							onClick: askPlace,
							children: "Lấy thời tiết tại chỗ"
						}),
						placeNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: placeNote
						}) : null
					]
				})]
			}) : null
		]
	});
}
function DockButton({ children, onClick, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: `min-h-11 border font-display text-xs tracking-widest uppercase ${active ? "border-gold bg-gold text-bg" : "border-gold/40 text-gold"}`,
		children
	});
}
function shape(g, loa, dsp, userGain) {
	const base = loa === "LOA3" ? 1.25 : 1.15;
	g.gain.gain.value = base * userGain;
	g.pan.pan.value = loa === "LOA1" ? -.55 : loa === "LOA2" ? .55 : 0;
	if (dsp === "tvpt") {
		g.hp.frequency.value = 180;
		g.low.frequency.value = 140;
		g.low.gain.value = -2;
		g.mid.frequency.value = 450;
		g.mid.gain.value = -2;
		g.mid.Q.value = .8;
		g.presence.frequency.value = 2800;
		g.presence.gain.value = 6;
		g.presence.Q.value = .9;
		g.deess.frequency.value = 7200;
		g.deess.gain.value = -1;
		g.deess.Q.value = .7;
		g.air.frequency.value = 1e4;
		g.air.gain.value = 1;
		g.comp.threshold.value = -24;
		g.comp.ratio.value = 6;
		g.comp.attack.value = .004;
		g.comp.release.value = .12;
		return;
	}
	if (dsp === "tvqc") {
		g.hp.frequency.value = 80;
		g.low.frequency.value = 120;
		g.low.gain.value = 1;
		g.mid.frequency.value = 350;
		g.mid.gain.value = -2;
		g.presence.frequency.value = 3e3;
		g.presence.gain.value = 2.2;
		g.presence.Q.value = .8;
		g.deess.frequency.value = 7e3;
		g.deess.gain.value = -3.5;
		g.deess.Q.value = 1.1;
		g.air.frequency.value = 11e3;
		g.air.gain.value = .4;
		g.comp.threshold.value = -18;
		g.comp.ratio.value = 2;
		g.comp.attack.value = .012;
		g.comp.release.value = .22;
		return;
	}
	g.hp.frequency.value = loa === "LOA1" ? 75 : 32;
	g.low.frequency.value = 95;
	g.low.gain.value = loa === "LOA2" ? -1.5 : 2.8;
	g.mid.frequency.value = 340;
	g.mid.gain.value = -1.4;
	g.mid.Q.value = .8;
	g.presence.frequency.value = loa === "LOA1" ? 2500 : 3200;
	g.presence.gain.value = loa === "LOA1" ? 4 : loa === "LOA2" ? 1.4 : 2.2;
	g.presence.Q.value = .85;
	g.deess.frequency.value = 6800;
	g.deess.gain.value = -1.2;
	g.deess.Q.value = .8;
	g.air.frequency.value = 10500;
	g.air.gain.value = loa === "LOA2" ? 2.8 : 1.4;
	g.comp.threshold.value = -18;
	g.comp.ratio.value = 2.8;
	g.comp.attack.value = .01;
	g.comp.release.value = .24;
}
function usePreview(audioRef) {
	const graph = (0, import_react.useRef)(null);
	const loaRef = (0, import_react.useRef)("LOA3");
	const dspRef = (0, import_react.useRef)("music");
	const gainRef = (0, import_react.useRef)(.86);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [time, setTime] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [level, setLevel] = (0, import_react.useState)(0);
	const [loa, setLoaState] = (0, import_react.useState)("LOA3");
	const [dsp, setDspState] = (0, import_react.useState)("music");
	const [gain, setGainState] = (0, import_react.useState)(.86);
	const ensure = async () => {
		const audio = audioRef.current;
		if (!audio) return null;
		if (!graph.current) {
			const ctx = new AudioContext();
			const src = ctx.createMediaElementSource(audio);
			const hp = ctx.createBiquadFilter();
			hp.type = "highpass";
			const low = ctx.createBiquadFilter();
			low.type = "lowshelf";
			const mid = ctx.createBiquadFilter();
			mid.type = "peaking";
			const presence = ctx.createBiquadFilter();
			presence.type = "peaking";
			const deess = ctx.createBiquadFilter();
			deess.type = "peaking";
			const air = ctx.createBiquadFilter();
			air.type = "highshelf";
			const comp = ctx.createDynamicsCompressor();
			const lim = ctx.createDynamicsCompressor();
			lim.threshold.value = -1.4;
			lim.knee.value = 0;
			lim.ratio.value = 16;
			lim.attack.value = .003;
			lim.release.value = .08;
			const gainNode = ctx.createGain();
			const pan = ctx.createStereoPanner();
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 256;
			src.connect(hp);
			hp.connect(low);
			low.connect(mid);
			mid.connect(presence);
			presence.connect(deess);
			deess.connect(air);
			air.connect(comp);
			comp.connect(lim);
			lim.connect(gainNode);
			gainNode.connect(pan);
			pan.connect(analyser);
			analyser.connect(ctx.destination);
			graph.current = {
				ctx,
				hp,
				low,
				mid,
				presence,
				deess,
				air,
				comp,
				gain: gainNode,
				pan,
				analyser
			};
		}
		shape(graph.current, loaRef.current, dspRef.current, gainRef.current);
		if (graph.current.ctx.state !== "running") await graph.current.ctx.resume();
		return graph.current;
	};
	(0, import_react.useEffect)(() => {
		const audio = audioRef.current;
		if (!audio) return;
		let raf = 0;
		const loop = () => {
			setTime(audio.currentTime || 0);
			setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
			const g = graph.current;
			if (g) {
				const buf = new Uint8Array(g.analyser.fftSize);
				g.analyser.getByteTimeDomainData(buf);
				let peak = 0;
				for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs((buf[i] ?? 128) - 128) / 128);
				setLevel(peak);
			}
			raf = requestAnimationFrame(loop);
		};
		const sync = () => {
			setTime(audio.currentTime || 0);
			setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
		};
		audio.addEventListener("loadedmetadata", sync);
		audio.addEventListener("durationchange", sync);
		const onPlay = () => {
			setPlaying(true);
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(loop);
		};
		const onStop = () => {
			setPlaying(false);
			setLevel(0);
			cancelAnimationFrame(raf);
			setTime(audio.currentTime || 0);
		};
		audio.addEventListener("play", onPlay);
		audio.addEventListener("pause", onStop);
		audio.addEventListener("ended", onStop);
		return () => {
			cancelAnimationFrame(raf);
			audio.removeEventListener("play", onPlay);
			audio.removeEventListener("pause", onStop);
			audio.removeEventListener("ended", onStop);
			audio.removeEventListener("loadedmetadata", sync);
			audio.removeEventListener("durationchange", sync);
		};
	}, [audioRef]);
	const load = (url) => {
		const audio = audioRef.current;
		if (!audio) return;
		audio.pause();
		audio.src = url;
		setTime(0);
		setPlaying(false);
	};
	const toggle = async () => {
		const audio = audioRef.current;
		if (!audio?.src) return false;
		await ensure();
		if (audio.paused) {
			await audio.play();
			return true;
		}
		audio.pause();
		return false;
	};
	const pause = () => audioRef.current?.pause();
	const scrub = (ratio) => {
		const audio = audioRef.current;
		if (!audio || !Number.isFinite(audio.duration)) return;
		audio.currentTime = Math.max(0, Math.min(.999, ratio)) * audio.duration;
		setTime(audio.currentTime);
	};
	const setLoa = (next) => {
		loaRef.current = next;
		setLoaState(next);
		if (graph.current) shape(graph.current, next, dspRef.current, gainRef.current);
	};
	const setDsp = (next) => {
		dspRef.current = next;
		setDspState(next);
		if (graph.current) shape(graph.current, loaRef.current, next, gainRef.current);
	};
	const setGain = (next) => {
		const value = Math.max(0, Math.min(1, next));
		gainRef.current = value;
		setGainState(value);
		if (graph.current) shape(graph.current, loaRef.current, dspRef.current, value);
	};
	return {
		playing,
		time,
		duration,
		level,
		loa,
		dsp,
		gain,
		load,
		toggle,
		pause,
		scrub,
		setLoa,
		setDsp,
		setGain,
		ensure
	};
}
var SAVE_KEY = "prompt.saves.v1";
function readSaves() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
	} catch {
		return [];
	}
}
async function copyText(text) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		const area = document.createElement("textarea");
		area.value = text;
		document.body.appendChild(area);
		area.select();
		document.execCommand("copy");
		area.remove();
	}
}
function speakVietnamese(text) {
	const synth = window.speechSynthesis;
	synth.cancel();
	const utter = new SpeechSynthesisUtterance(text.slice(0, 700));
	const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith("vi"));
	utter.lang = voice?.lang ?? "vi-VN";
	if (voice) utter.voice = voice;
	synth.speak(utter);
}
function Studio() {
	const audioRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const urlRef = (0, import_react.useRef)(null);
	const pushed = (0, import_react.useRef)(false);
	const preview = usePreview(audioRef);
	const [tab, setTab] = (0, import_react.useState)("signal");
	const [fileName, setFileName] = (0, import_react.useState)(null);
	const [features, setFeatures] = (0, import_react.useState)(null);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [styleText, setStyleText] = (0, import_react.useState)("");
	const [lyrics, setLyrics] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [ngame, setNgame] = (0, import_react.useState)(false);
	const [sheet, setSheet] = (0, import_react.useState)(null);
	const [pwamc, setPwamc] = (0, import_react.useState)(false);
	const [saves, setSaves] = (0, import_react.useState)([]);
	const [showSaves, setShowSaves] = (0, import_react.useState)(false);
	const [grokNote, setGrokNote] = (0, import_react.useState)("");
	const [grokBusy, setGrokBusy] = (0, import_react.useState)(false);
	const [offer, setOffer] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setSaves(readSaves());
		const onPop = () => {
			pushed.current = false;
			setSheet(null);
			setPwamc(false);
		};
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);
	const qc = (0, import_react.useMemo)(() => styleText ? scoreWork(features, draft, styleText, lyrics) : null, [
		features,
		draft,
		styleText,
		lyrics
	]);
	const openSheet = (next) => {
		if (next && !pushed.current) {
			history.pushState({ prompt: "sheet" }, "");
			pushed.current = true;
		}
		if (!next && pushed.current) {
			history.back();
			return;
		}
		setSheet(next);
	};
	const remember = (entry) => {
		const next = [entry, ...readSaves().filter((item) => item.id !== entry.id)].slice(0, 8);
		localStorage.setItem(SAVE_KEY, JSON.stringify(next));
		setSaves(next);
	};
	const publish = (nextFeatures, name) => {
		const nextDraft = inferDraft(nextFeatures);
		const nextStyle = buildStylePrompt(nextFeatures, nextDraft);
		const nextLyrics = buildLyrics(nextFeatures, nextDraft).text;
		setFeatures(nextFeatures);
		setDraft(nextDraft);
		setStyleText(nextStyle);
		setLyrics(nextLyrics);
		setFileName(name);
		remember({
			id: `${Date.now()}`,
			at: Date.now(),
			name,
			draft: nextDraft,
			styleText: nextStyle,
			lyrics: nextLyrics,
			features: nextFeatures
		});
		setTab("signal");
	};
	const replaceUrl = (url) => {
		if (urlRef.current) URL.revokeObjectURL(urlRef.current);
		urlRef.current = url;
		preview.load(url);
	};
	const onFile = async (file) => {
		setBusy(true);
		setError("");
		setNote("");
		setStatus(file.size > 50331648 ? "Tệp lớn. Đang giải mã, máy có thể chậm…" : "Đang giải mã…");
		replaceUrl(URL.createObjectURL(file));
		setFileName(file.name);
		try {
			const ctx = new AudioContext();
			const raw = await file.arrayBuffer();
			const audio = await ctx.decodeAudioData(raw);
			const channels = [];
			for (let i = 0; i < audio.numberOfChannels; i++) channels.push(audio.getChannelData(i));
			setStatus("Đang đo BPM, tông và độ lớn…");
			const measured = await analyzeChannelsAsync({
				sampleRate: audio.sampleRate,
				channels
			});
			await ctx.close();
			publish(measured, file.name);
			setStatus("");
		} catch {
			setError("Không giải mã được. Hãy dùng MP3, WAV, OGG hoặc M4A.");
			setStatus("");
		} finally {
			setBusy(false);
		}
	};
	const onDemo = async () => {
		setBusy(true);
		setError("");
		setStatus("Đang dựng tín hiệu mẫu 120 BPM…");
		try {
			const pcm = makeDemo();
			const blob = encodeWav(pcm.channels[0] ?? /* @__PURE__ */ new Float32Array(), pcm.sampleRate);
			replaceUrl(URL.createObjectURL(blob));
			const measured = await analyzeChannelsAsync(pcm);
			publish(measured, "Tín hiệu mẫu 120 BPM");
			setStatus("");
		} catch {
			setError("Không tạo được tín hiệu mẫu.");
			setStatus("");
		} finally {
			setBusy(false);
		}
	};
	const rebuild = () => {
		const nextStyle = buildStylePrompt(features, draft);
		const nextLyrics = buildLyrics(features, draft).text;
		setStyleText(nextStyle);
		setLyrics(nextLyrics);
		setNote("Đã viết lại prompt từ phong cách.");
		setTab("prompt");
	};
	const askGrok = async () => {
		if (grokBusy) return;
		setGrokBusy(true);
		setGrokNote("");
		setOffer(null);
		const brief = features ? `BPM ${Math.round(features.bpm)}, key ${features.key}, ${features.durationSec.toFixed(0)}s, brightness ${Math.round(features.brightness)} Hz, crest ${features.crestDb.toFixed(1)} dB, genre ${draft.genre}, language ${draft.language}.` : `No measurement. Genre ${draft.genre}, language ${draft.language}.`;
		const result = await refineWithGrok({ data: {
			style: styleText,
			lyrics,
			brief
		} });
		setGrokBusy(false);
		if (!result.ok) {
			setGrokNote(result.error);
			return;
		}
		setOffer(result);
		setGrokNote("Grok đã trả một bản. Đối chiếu rồi mới thay.");
	};
	const progress = preview.duration > 0 ? preview.time / preview.duration : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex h-dvh w-full max-w-3xl flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				preload: "auto",
				className: "hidden"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ngame, {
				open: ngame,
				onToggle: () => setNgame((value) => !value),
				onPlay: () => void preview.toggle(),
				onCopy: () => void copyText(styleText).then(() => setNote("Đã chép style prompt.")),
				onRebuild: rebuild,
				onQc: () => setTab("qc"),
				onScrub: preview.scrub,
				onGain: preview.setGain,
				gain: preview.gain,
				progress,
				playing: preview.playing
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `shell-pad flex min-h-0 flex-1 flex-col ${ngame ? "px-24" : "px-12"}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "frame-gold zone-new flex min-h-0 flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "flex items-start justify-between gap-3 border-b border-gold/30 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl tracking-widest text-gold",
								children: "PROMPT"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Lời Việt trong sáng · Suno không hát hướng dẫn"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-h-11 border border-gold/40 px-3 font-display text-xs tracking-widest text-gold uppercase",
								onClick: () => setShowSaves((value) => !value),
								children: "Đã lưu"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-4 gap-1 px-3 py-2",
							role: "tablist",
							children: [
								["signal", "Đo"],
								["style", "Style"],
								["prompt", "Suno"],
								["qc", "QC"]
							].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": tab === id,
								className: `min-h-11 font-display text-sm tracking-widest uppercase ${tab === id ? "bg-gold text-bg" : "border border-gold/30 text-gold"}`,
								onClick: () => setTab(id),
								children: label
							}, id))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-h-0 flex-1 overflow-y-auto px-3 pb-3",
							children: [
								showSaves ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveList, {
									saves,
									onOpen: (item) => {
										setFeatures(item.features);
										setDraft(item.draft);
										setStyleText(item.styleText);
										setLyrics(item.lyrics);
										setFileName(item.name);
										setShowSaves(false);
										setTab("prompt");
									}
								}) : null,
								tab === "signal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignalPane, {
									busy,
									status,
									error,
									fileName,
									features,
									peaks: features?.peaks ?? [],
									progress,
									playing: preview.playing,
									level: preview.level,
									time: preview.time,
									duration: preview.duration,
									loa: preview.loa,
									dsp: preview.dsp,
									onPick: () => fileRef.current?.click(),
									onDemo: () => void onDemo(),
									onToggle: () => void preview.toggle(),
									onScrub: preview.scrub,
									onLoa: preview.setLoa,
									onDsp: preview.setDsp,
									onDropFile: (file) => void onFile(file)
								}) : null,
								tab === "style" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StylePane, {
									draft,
									onChange: setDraft,
									onRebuild: rebuild,
									disabled: !features && !styleText
								}) : null,
								tab === "prompt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptPane, {
									styleText,
									lyrics,
									seconds: qc?.seconds ?? 0,
									note,
									audit: lyrics ? auditLyrics(lyrics, {
										language: draft.language,
										bpm: features?.bpm || 104,
										hook: buildLyrics(features, draft).hook
									}) : null,
									onStyle: setStyleText,
									onLyrics: setLyrics,
									onFit: () => {
										setStyleText(exact995(styleText));
										setNote("Đã siết style về 995 ký tự.");
									},
									onRewriteLyrics: () => {
										setLyrics(buildLyrics(features, draft).text);
										setNote("Đã viết lại lời theo luật âm học tiếng Việt.");
									},
									onCopy: async (text, label) => {
										await copyText(text);
										setNote(label);
									}
								}) : null,
								tab === "qc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QcPane, {
									qc,
									busy: grokBusy,
									note: grokNote,
									offer,
									onAsk: () => void askGrok(),
									onApply: () => {
										if (!offer) return;
										setStyleText(exact995(offer.style));
										setLyrics(sanitizeForSuno(offer.lyrics));
										setOffer(null);
										setGrokNote("Đã dùng bản Grok và siết style về 995 ký tự.");
										setTab("prompt");
									}
								}) : null
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "frame-gold zone-cu mt-2 flex min-h-0 flex-col",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CuDock, {
						sheet,
						setSheet: openSheet,
						onRadio: () => {
							preview.pause();
						}
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.webm",
				className: "hidden",
				onChange: (event) => {
					const file = event.target.files?.[0];
					if (file) onFile(file);
					event.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-label": "Mở PWAMC",
				className: "sticker absolute right-14 bottom-40 z-40 size-14 rounded-full border border-gold bg-gold text-bg",
				onClick: () => setPwamc((value) => !value),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-xs tracking-widest",
					children: "PWAMC"
				})
			}),
			pwamc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute right-3 bottom-52 z-40 w-64 border border-gold bg-surface p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display tracking-widest text-gold uppercase",
						children: "PWAMC"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Đọc style bằng giọng máy, hoặc xuất file ghép lời."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 bg-gold font-display tracking-widest text-bg uppercase",
							onClick: () => speakVietnamese(styleText || "Chưa có prompt."),
							children: "Đọc prompt"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 border border-gold font-display tracking-widest text-gold uppercase",
							onClick: () => {
								const blob = new Blob([`STYLE\n${styleText}\n\nLYRICS\n${sanitizeForSuno(lyrics)}\n`], { type: "text/plain" });
								const link = document.createElement("a");
								link.href = URL.createObjectURL(blob);
								link.download = "prompt-suno.txt";
								link.click();
							},
							children: "Xuất ghép lời"
						})]
					})
				]
			}) : null
		]
	});
}
function SignalPane(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-dashed border-gold/50 px-3 py-4",
				onDragOver: (event) => event.preventDefault(),
				onDrop: (event) => {
					event.preventDefault();
					const file = event.dataTransfer.files[0];
					if (file) props.onDropFile(file);
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display tracking-widest text-gold uppercase",
						children: "Tệp nhạc"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "MP3, WAV, FLAC, OGG, M4A. Giải mã một lần rồi xả bộ nhớ sóng."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
							onClick: props.onPick,
							disabled: props.busy,
							children: "Chọn tệp"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 border border-gold px-4 font-display tracking-widest text-gold uppercase",
							onClick: props.onDemo,
							disabled: props.busy,
							children: "Mẫu 120"
						})]
					}),
					props.fileName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 truncate text-sm text-fg",
						children: props.fileName
					}) : null,
					props.status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-gold",
						children: props.status
					}) : null,
					props.error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-fg",
						children: props.error
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "block w-full",
				onClick: (event) => {
					const rect = event.currentTarget.getBoundingClientRect();
					props.onScrub((event.clientX - rect.left) / rect.width);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waveform, {
					peaks: props.peaks,
					progress: props.progress
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
						onClick: props.onToggle,
						disabled: !props.fileName,
						children: props.playing ? "Dừng" : "Phát"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display tabular-nums text-sm text-muted",
						children: [
							formatClock(props.time),
							" / ",
							formatClock(props.duration)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm text-muted",
						children: ["mức ", Math.round(props.level * 100)]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1",
				children: [[
					"LOA3",
					"LOA1",
					"LOA2"
				].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: chip(props.loa === id),
					onClick: () => props.onLoa(id),
					children: id
				}, id)), [
					["music", "Nhạc"],
					["tvpt", "TVPT"],
					["tvqc", "TVQC"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: chip(props.dsp === id),
					onClick: () => props.onDsp(id),
					children: label
				}, id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "LOA3 cả hai kênh, bù sau nén. LOA1 lệch trái, LOA2 lệch phải. TVPT là phóng thanh, TVQC là giọng quảng cáo."
			}),
			props.features ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metrics, { features: props.features }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Chưa có số đo."
			})
		]
	});
}
function Metrics({ features }) {
	const cells = [
		[
			"BPM",
			features.bpm ? String(features.bpm) : "—",
			`${Math.round(features.bpmConfidence * 100)}%`
		],
		[
			"Tông",
			features.key,
			`${Math.round(features.keyConfidence * 100)}%`
		],
		[
			"LUFS",
			features.lufs.toFixed(1),
			"ước tính"
		],
		[
			"Đỉnh",
			`${features.crestDb.toFixed(1)} dB`,
			"crest"
		],
		[
			"Dài",
			formatClock(features.durationSec),
			`${features.sampleRate} Hz`
		],
		[
			"Sáng",
			`${Math.round(features.brightness)} Hz`,
			features.channels > 1 ? "stereo" : "mono"
		]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-1",
				children: cells.map(([label, value, sub]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-gold/30 bg-bg px-2 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-xs tracking-widest text-muted uppercase",
							children: label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-lg tabular-nums text-fg",
							children: value
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted",
							children: sub
						})
					]
				}, label))
			}),
			features.durationSec < 45 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Tệp ngắn hơn một bài. Prompt vẫn được viết cho bản từ 4 phút."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1 text-sm",
				children: features.sections.map((section, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-3 border-b border-gold/20 py-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: section.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "tabular-nums text-muted",
						children: [
							formatClock(section.start * features.durationSec),
							"–",
							formatClock(section.end * features.durationSec)
						]
					})]
				}, `${section.label}-${index}`))
			})
		]
	});
}
function StylePane({ draft, onChange, onRebuild, disabled }) {
	const set = (patch) => onChange({
		...draft,
		...patch
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-xs tracking-widest text-muted uppercase",
					children: "Thể loại"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: draft.genre,
					onChange: (event) => set({ genre: event.target.value }),
					className: "mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg",
					children: GENRES.map((genre) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: genre }, genre))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-xs tracking-widest text-muted uppercase",
					children: "Lời hát"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: draft.language,
					onChange: (event) => set({ language: event.target.value }),
					className: "mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "vi",
							children: "Hát tiếng Việt"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "en",
							children: "Hát tiếng Anh"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "instrumental",
							children: "Không lời"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Mood",
				value: draft.mood,
				onChange: (mood) => set({ mood })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Giọng",
				value: draft.vocals,
				onChange: (vocals) => set({ vocals })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Nhạc cụ",
				value: draft.instruments,
				onChange: (instruments) => set({ instruments })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Sản xuất",
				value: draft.production,
				onChange: (production) => set({ production })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
				label: "Ghi chú màu",
				value: draft.reference,
				onChange: (reference) => set({ reference })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
				onClick: onRebuild,
				disabled,
				children: "Viết lại prompt"
			})
		]
	});
}
function PromptPane(props) {
	const count = props.styleText.length;
	const ready = count >= 960 && count <= 995;
	const clean = sanitizeForSuno(props.lyrics);
	const leaked = Boolean(props.lyrics.trim()) && clean !== props.lyrics.trim();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display tracking-widest text-gold uppercase",
					children: "Style box"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: `font-display tabular-nums ${ready ? "text-gold" : "text-muted"}`,
					children: [
						count,
						"/995",
						count > 1e3 ? " vượt" : ""
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: props.styleText,
				onChange: (event) => props.onStyle(event.target.value),
				rows: 8,
				placeholder: "Chưa có prompt. Hãy đo một tệp hoặc mẫu 120.",
				className: "w-full border border-gold/40 bg-bg px-3 py-2 text-sm leading-relaxed text-fg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 bg-gold px-3 font-display text-sm tracking-widest text-bg uppercase",
					onClick: () => void props.onCopy(props.styleText, "Đã chép style prompt."),
					disabled: !props.styleText,
					children: "Chép style"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase",
					onClick: props.onFit,
					disabled: !props.styleText,
					children: "Siết 995"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display tracking-widest text-gold uppercase",
					children: "Lời hát"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-display tabular-nums text-sm text-muted",
					children: ["ước tính ", formatClock(props.seconds)]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: props.lyrics,
				onChange: (event) => props.onLyrics(event.target.value),
				rows: 12,
				spellCheck: false,
				className: "w-full border border-gold/40 bg-bg px-3 py-2 text-sm leading-relaxed text-fg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase",
						onClick: () => void props.onCopy(clean, leaked ? "Đã lọc hướng dẫn rồi chép lời." : "Đã chép lời."),
						disabled: !clean,
						children: "Chép lời"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase",
						onClick: props.onRewriteLyrics,
						children: "Viết lời theo luật"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase",
						onClick: () => props.onLyrics(clean),
						disabled: !props.lyrics || !leaked,
						children: "Lọc hướng dẫn"
					})
				]
			}),
			props.audit ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 border border-gold/40 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-widest text-gold uppercase",
						children: "Âm học lời Việt"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Trong sáng",
						value: props.audit.clarity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Giữ nốt",
						value: props.audit.sustain
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "An toàn Suno",
						value: props.audit.safe
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1 text-sm text-fg",
						children: props.audit.issues.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1 text-xs text-muted",
						children: LYRIC_SKILL.map((rule) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: rule }, rule))
					})
				]
			}) : null,
			props.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-gold",
				children: props.note
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "Dán style vào ô Style của Suno, lời vào ô Lyrics. Luật viết lời ở trên, không dán vào ô lời."
			})
		]
	});
}
function QcPane({ qc, busy, note, offer, onAsk, onApply }) {
	if (!qc) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Viết prompt trước khi chấm."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-gold/40 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xs tracking-widest text-muted uppercase",
						children: "Tổng"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl tabular-nums text-gold",
						children: qc.overall
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Bản máy, không phải số liệu hãng."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "Cuốn",
				value: qc.catchiness
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "Hướng 2026",
				value: qc.trending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "Độ dài",
				value: qc.length
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "Khớp số đo",
				value: qc.coherence
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "Trong sáng",
				value: qc.diction
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
				label: "An toàn Suno",
				value: qc.sunoSafe
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2 text-sm text-fg",
				children: qc.notes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-l border-gold pl-2",
					children: item
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase",
				onClick: onAsk,
				disabled: busy,
				children: busy ? "Đang hỏi Grok…" : "Nhờ Grok siết"
			}),
			note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg",
				children: note
			}) : null,
			offer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 border border-gold/40 p-3",
				children: [offer.notes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: item
				}, item)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 border border-gold px-3 font-display tracking-widest text-gold uppercase",
					onClick: onApply,
					children: "Dùng bản Grok"
				})]
			}) : null
		]
	});
}
function SaveList({ saves, onOpen }) {
	if (!saves.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-3 text-sm text-muted",
		children: "Chưa có bản lưu trên máy."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mb-3 space-y-1",
		children: saves.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "min-h-11 w-full border border-gold/30 px-2 text-left text-sm",
			onClick: () => onOpen(item),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-fg",
				children: item.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: item.features ? `${item.features.bpm} BPM · ${item.features.key}` : "không số đo"
			})]
		}) }, item.id))
	});
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xs tracking-widest text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value,
			onChange: (event) => onChange(event.target.value),
			className: "mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg"
		})]
	});
}
function Meter({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between font-display text-xs tracking-widest uppercase",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "tabular-nums text-fg",
			children: value
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 h-1.5 bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full bg-gold",
			style: { width: `${value}%` }
		})
	})] });
}
function Waveform({ peaks, progress }) {
	const data = peaks.length ? peaks.filter((_, index) => index % 4 === 0) : Array.from({ length: 48 }, () => .08);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-20 w-full items-center gap-px",
		"aria-hidden": "true",
		children: data.map((peak, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 flex-1 bg-gold",
			style: {
				height: `${Math.max(6, Math.round(peak * 100))}%`,
				opacity: index / data.length <= progress ? 1 : .38
			}
		}, `${index}-${peak.toFixed(3)}`))
	});
}
function chip(active) {
	return `min-h-11 px-3 font-display text-xs tracking-widest uppercase ${active ? "bg-gold text-bg" : "border border-gold/40 text-gold"}`;
}
function Ngame(props) {
	const drag = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		props.onScrub((event.clientX - rect.left) / rect.width);
		props.onGain(1 - (event.clientY - rect.top) / rect.height);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-2 left-0 w-px bg-gold/80" }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-2 right-0 w-px bg-gold/80" }),
		props.open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mica hemi-left absolute inset-y-2 left-1 z-40 flex w-24 flex-col p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 font-display text-xs tracking-widest text-gold uppercase",
					onClick: props.onToggle,
					children: "Đóng"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative mt-2 h-28 border border-gold/50",
					onPointerDown: (event) => {
						event.currentTarget.setPointerCapture(event.pointerId);
						drag(event);
					},
					onPointerMove: (event) => {
						if (event.currentTarget.hasPointerCapture(event.pointerId)) drag(event);
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute size-4 rounded-full bg-gold",
						style: {
							left: `calc(${props.progress * 100}% - 0.5rem)`,
							top: `calc(${(1 - props.gain) * 100}% - 0.5rem)`
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-center font-display text-xs tracking-widest text-muted uppercase",
					children: "Kéo"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mica hemi-right absolute inset-y-2 right-1 z-40 flex w-24 flex-col items-stretch justify-center gap-2 p-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arcade, {
					label: props.playing ? "Dừng" : "A",
					onClick: props.onPlay
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arcade, {
					label: "B",
					onClick: props.onCopy
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arcade, {
					label: "X",
					onClick: props.onRebuild
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arcade, {
					label: "Y",
					onClick: props.onQc
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 font-display text-xs tracking-widest text-gold uppercase",
					onClick: props.onToggle,
					children: "Đóng"
				})
			]
		})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Mở NGAME trái",
			className: "absolute top-24 left-1 z-40 size-11 rounded-arcade border border-gold bg-bg font-display text-xs text-gold",
			onClick: props.onToggle,
			children: "L"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Mở NGAME phải",
			className: "absolute top-24 right-1 z-40 size-11 rounded-arcade border border-gold bg-bg font-display text-xs text-gold",
			onClick: props.onToggle,
			children: "R"
		})] })
	] });
}
function Arcade({ label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: "min-h-11 rounded-arcade border border-gold bg-bg font-display tracking-widest text-gold uppercase",
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
