//#region node_modules/.nitro/vite/services/ssr/assets/viet-lyric-l07g51rD.js
var LYRIC_SKILL = [
	"Suno hát mọi chữ không phải thẻ đoạn đứng một mình.",
	"Chỉ dùng [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro].",
	"Cấm ngoặc, cấm “lặp lại”, cấm đếm nhịp. Muốn lặp thì viết lại nguyên câu.",
	"Cuối câu tiếng Việt để nguyên âm mở hoặc vần m, n, ng, nh, thanh ngang hoặc huyền.",
	"Ý nằm ở phụ âm và hình ảnh. Thanh hỏi, ngã dễ bị giai điệu làm phẳng."
];
var GROK_LYRIC_RULES = [
	"Suno sings every word that is not a bare section tag on its own line.",
	"Allowed tags only: [Intro] [Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Bridge] [Outro] [Instrumental] [Break].",
	"Intro and Outro are the tag alone. Never write counts, seconds, or the words instrumental, bars, repeat, ad-lib under them.",
	"Never use parentheses, asterisks, braces, x2, or stage directions in any language.",
	"To repeat a hook, write the same line again.",
	"Vietnamese lines: 6 syllables if BPM is 122 or faster, 8 if BPM is under 96, otherwise 7.",
	"The last syllable of each Vietnamese line is an open vowel or a nasal coda m/n/ng/nh, with tone ngang or huyền, so the note can sustain.",
	"Do not end a line on p/t/c/ch or on hỏi, ngã, sắc, nặng.",
	"Meaning must survive if the melody flattens lexical tone. Use concrete images. No production talk inside the lyric."
].join(" ");
var CANON = {
	intro: "Intro",
	verse: "Verse",
	"verse 1": "Verse 1",
	"verse 2": "Verse 2",
	"verse 3": "Verse 3",
	"pre-chorus": "Pre-Chorus",
	"pre chorus": "Pre-Chorus",
	prechorus: "Pre-Chorus",
	chorus: "Chorus",
	"final chorus": "Chorus",
	refrain: "Chorus",
	"post-chorus": "Post-Chorus",
	bridge: "Bridge",
	outro: "Outro",
	instrumental: "Instrumental",
	break: "Break",
	hook: "Hook",
	interlude: "Interlude",
	end: "End",
	"fade out": "Fade Out"
};
var ONSET = /^(ngh|ng|nh|gh|kh|ph|th|tr|ch|qu|gi|[bcdđghklmnpqrstvx])/i;
var NIGHT = {
	hook: "Đèn vàng còn đây",
	verse: {
		6: [
			"Đêm trôi phố vẫn còn đây",
			"Gió qua tay áo câu này",
			"Lòng im không gọi đêm êm",
			"Một mình hát khẽ cùng đêm"
		],
		7: [
			"Đêm trôi trên phố đèn còn đây",
			"Gió qua tay áo giữ câu này",
			"Lòng không gọi nữa đêm vẫn êm",
			"Một mình vẫn khẽ hát cùng đêm"
		],
		8: [
			"Đêm chậm trôi trên phố đèn còn đây",
			"Gió khẽ qua tay áo giữ câu này",
			"Lòng im không gọi nữa đêm vẫn êm",
			"Một mình ta vẫn khẽ hát cùng đêm"
		]
	},
	pre: {
		6: ["Nếu mai xa vẫn nhớ về", "Giai điệu còn ở lại đêm"],
		7: ["Nếu mai có xa vẫn nhớ về", "Giai điệu này còn ở lại đêm"],
		8: ["Nếu ngày mai xa anh vẫn nhớ về", "Giai điệu này vẫn còn ở lại đêm"]
	},
	tail: {
		6: "Một câu đủ sáng để về",
		7: "Một câu đủ sáng để trở về",
		8: "Chỉ một câu đủ sáng để trở về"
	},
	bridge: {
		6: ["Đèn đổi góc phố vẫn nguyên", "Lòng lên một bậc rồi về"],
		7: ["Đèn đổi một góc phố vẫn nguyên", "Lòng lên một bậc rồi trở về"],
		8: ["Đèn đổi sang một góc phố vẫn nguyên", "Lòng lên thêm một bậc rồi trở về"]
	}
};
var DRIVE = {
	hook: "Đêm lái xe về",
	verse: {
		6: [
			"Đèn phố trôi dọc đường về",
			"Đài khẽ ngân lên câu này",
			"Cao tốc vắng người đêm êm",
			"Tay vẫn giữ nhịp cùng đêm"
		],
		7: [
			"Đèn phố chạy dài trên đường về",
			"Đài khẽ ngân lên đúng câu này",
			"Cao tốc vắng người mà đêm êm",
			"Tay trên vô lăng giữ cùng đêm"
		],
		8: [
			"Đèn phố chạy thật dài trên đường về",
			"Đài khẽ ngân đúng câu của đêm này",
			"Cao tốc vắng người và đêm vẫn êm",
			"Hai tay trên vô lăng giữ nhịp đêm"
		]
	},
	pre: {
		6: ["Nếu trời sáng vẫn muốn về", "Giai điệu đêm không chịu chìm"],
		7: ["Nếu trời có sáng vẫn muốn về", "Giai điệu đêm này không chịu chìm"],
		8: ["Nếu bên ngoài trời sáng anh vẫn về", "Giai điệu của đêm nay không chịu chìm"]
	},
	tail: {
		6: "Một câu đủ sáng lối về",
		7: "Một câu đủ sáng cho lối về",
		8: "Chỉ một câu đủ sáng cho lối về"
	},
	bridge: {
		6: ["Đổi làn đường ấy vẫn về", "Lòng lên một nhịp rồi về"],
		7: ["Đổi sang làn đường ấy vẫn về", "Lòng lên thêm một nhịp rồi về"],
		8: ["Đèn đổi sang làn đường ấy vẫn về", "Lòng lên thêm một nhịp là trở về"]
	}
};
var DARK = {
	hook: "Giữ nhịp đêm nay",
	verse: {
		6: [
			"Phố hẹp đèn đỏ còn đây",
			"Bước đều không gọi tên này",
			"Gió lạnh qua mái đêm êm",
			"Tim giữ một nhịp cùng đêm"
		],
		7: [
			"Phố hẹp đèn đỏ vẫn còn đây",
			"Bước đều không gọi lại tên này",
			"Gió lạnh qua mái mà đêm êm",
			"Tim giữ đúng một nhịp cùng đêm"
		],
		8: [
			"Phố hẹp dưới đèn đỏ vẫn còn đây",
			"Bước chân đều không gọi lại tên này",
			"Gió lạnh qua mái và đêm vẫn êm",
			"Tim vẫn giữ đúng một nhịp cùng đêm"
		]
	},
	pre: {
		6: ["Nếu mai xa vẫn bước về", "Nhịp này không rời khỏi đêm"],
		7: ["Nếu ngày mai xa vẫn bước về", "Nhịp này vẫn không rời khỏi đêm"],
		8: ["Nếu ngày mai có xa vẫn bước về", "Nhịp chân này vẫn không rời khỏi đêm"]
	},
	tail: {
		6: "Một câu đủ vững để về",
		7: "Một câu đủ vững để trở về",
		8: "Chỉ một câu đủ vững để trở về"
	},
	bridge: {
		6: ["Đèn đổi hẻm cũ vẫn nguyên", "Lòng lên một bậc rồi về"],
		7: ["Đèn đổi sang hẻm cũ vẫn nguyên", "Lòng lên một bậc là trở về"],
		8: ["Đèn đổi sang phía hẻm cũ vẫn nguyên", "Lòng lên thêm một bậc rồi trở về"]
	}
};
var SUN = {
	hook: "Nắng còn ở đây",
	verse: {
		6: [
			"Sân rộng gió mát còn đây",
			"Áo mỏng bay theo câu này",
			"Trưa vàng yên ả trời êm",
			"Cùng nhau giữ nhịp trời êm"
		],
		7: [
			"Sân rộng gió mát vẫn còn đây",
			"Áo mỏng bay theo đúng câu này",
			"Trưa vàng yên ả và trời êm",
			"Cùng nhau giữ một nhịp trời êm"
		],
		8: [
			"Ngoài sân rộng gió mát vẫn còn đây",
			"Áo mỏng bay theo đúng một câu này",
			"Trưa vàng yên và bầu trời vẫn êm",
			"Cùng nhau ta giữ một nhịp trời êm"
		]
	},
	pre: {
		6: ["Nếu hoàng hôn vẫn muốn về", "Giai điệu này ở lại đây"],
		7: ["Nếu hoàng hôn xuống vẫn muốn về", "Giai điệu nắng vẫn còn ở đây"],
		8: ["Nếu hoàng hôn có xuống vẫn muốn về", "Giai điệu của nắng vẫn còn ở đây"]
	},
	tail: {
		6: "Một câu đủ ấm để về",
		7: "Một câu đủ ấm để trở về",
		8: "Chỉ một câu đủ ấm để trở về"
	},
	bridge: {
		6: ["Đổi góc sân ấy vẫn đây", "Lòng lên một bậc rồi về"],
		7: ["Đổi sang góc sân ấy vẫn đây", "Lòng lên một bậc rồi trở về"],
		8: ["Nắng đổi sang một góc sân vẫn đây", "Lòng lên thêm một bậc rồi trở về"]
	}
};
var ENGLISH = {
	hook: "Hold the yellow light",
	verse: [
		"The street keeps a yellow light",
		"Wind in the sleeve keeps this line",
		"I never call the old name",
		"The night stays calm beside me"
	],
	pre: ["If morning comes I still turn home", "The melody refuses to leave"],
	tail: "One line is bright enough to return",
	bridge: ["The corner changes the night stays", "The heart lifts once then comes home"]
};
function clamp(n) {
	return Math.max(0, Math.min(100, Math.round(n)));
}
function lineDensity(bpm) {
	if (bpm >= 122) return 6;
	if (bpm >= 96) return 7;
	return 8;
}
function stripTone(input) {
	return input.normalize("NFD").replace(/[\u0300\u0301\u0303\u0309\u0323]/g, "").normalize("NFC");
}
function syllablesOf(line) {
	return line.trim().replace(/[“”"'`.…,!?;:()[\]{}*]/g, "").split(/\s+/).filter(Boolean);
}
function toneOf(token) {
	const s = token.normalize("NFC");
	if (/[ạặậẹệịọộợụựỵ]/i.test(s)) return "nang";
	if (/[ảẳẩẻểỉỏổởủửỷ]/i.test(s)) return "hoi";
	if (/[ãẵẫẽễĩõỗỡũữỹ]/i.test(s)) return "nga";
	if (/[áắấéếíóốớúứý]/i.test(s)) return "sac";
	if (/[àằầèềìòồờùừỳ]/i.test(s)) return "huyen";
	return "ngang";
}
function inspectSyllable(raw) {
	const token = raw.normalize("NFC").replace(/[^A-Za-zĂÂÊÔƠƯăâêôơưĐđÀ-ỹ]/g, "");
	const bare = stripTone(token).toLowerCase();
	let body = bare.replace(ONSET, "");
	if (!body && /^gi/i.test(bare)) body = "i";
	let coda = "open";
	let nucleus = body;
	if (body.endsWith("ch")) {
		coda = "stop";
		nucleus = body.slice(0, -2);
	} else if (body.endsWith("nh")) {
		coda = "nasal";
		nucleus = body.slice(0, -2);
	} else if (body.endsWith("ng")) {
		coda = "nasal";
		nucleus = body.slice(0, -2);
	} else if (/[ctp]$/.test(body)) {
		coda = "stop";
		nucleus = body.slice(0, -1);
	} else if (/[mn]$/.test(body)) {
		coda = "nasal";
		nucleus = body.slice(0, -1);
	}
	return {
		tone: toneOf(token),
		coda,
		nucleus,
		clear: /[aăâeêi]/i.test(nucleus)
	};
}
function canonTag(label) {
	return CANON[label.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;
}
function isInstructionLine(line) {
	if (/\b(bars?|bpm|lufs|dbtp)\b/i.test(line)) return true;
	if (/\b(instrumental|ad-?lib|adlib|whisper|softly|falsetto)\b/i.test(line)) return true;
	if (/\b(no\s+voice|no\s+vocals?|motif\s+only|vocal\s+run)\b/i.test(line)) return true;
	if (/\b(repeat\s+(chorus|this|the hook|x?\d+)|x\s?\d+)\b/i.test(line)) return true;
	if (/(không hát|đừng hát|hát nhẹ ở|không lời|lặp lại|đừng viết thêm|chỉ nâng quãng|hướng dẫn)/i.test(line)) return true;
	if (/\babout\s+\d+\b/i.test(line)) return true;
	if (/\b\d+\s*(giây|nhịp|bars?|seconds?|secs?)\b/i.test(line)) return true;
	return false;
}
function findLeaks(text) {
	const issues = [];
	if (/\([^)]*\)/.test(text)) issues.push("Có ngoặc tròn. Suno thường hát luôn chữ trong ngoặc.");
	if (/\*|\{[^}]+\}/.test(text)) issues.push("Có dấu sao hoặc ngoặc nhọn. Đó là hướng dẫn, không phải lời hát.");
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		const tag = line.match(/^\[([^\]]+)\]\s*(.*)$/);
		if (tag) {
			if (!canonTag(tag[1] ?? "")) issues.push(`Thẻ [${tag[1]}] không phải thẻ đoạn. Suno có thể hát chữ này.`);
			if ((tag[2] ?? "").trim()) issues.push("Thẻ đoạn đang dính chữ phía sau. Suno sẽ hát phần chữ đó.");
			continue;
		}
		if (/\[[^\]]+\]/.test(line)) issues.push("Có thẻ nằm giữa câu. Suno dễ hát nhầm thành lời.");
		if (isInstructionLine(line)) issues.push("Có câu hướng dẫn trong ô lời. Suno sẽ hát câu đó.");
	}
	return [...new Set(issues)];
}
function sanitizeForSuno(input) {
	const out = [];
	for (const raw of input.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) {
			out.push("");
			continue;
		}
		const tagged = line.match(/^\[([^\]]+)\]\s*(.*)$/);
		if (tagged) {
			const canon = canonTag(tagged[1] ?? "");
			if (canon) out.push(`[${canon}]`);
			continue;
		}
		const lyric = line.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ").replace(/\{[^}]*\}/g, " ").replace(/\*[^*]*\*/g, " ").replace(/\s+/g, " ").trim();
		if (!lyric || isInstructionLine(lyric)) continue;
		out.push(lyric);
	}
	return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function kitFor(draft) {
	if (/city/i.test(draft.genre)) return DRIVE;
	if (/phonk|trap/i.test(draft.genre)) return DARK;
	if (/house|disco|afro/i.test(draft.genre)) return SUN;
	if (/open, forward, bright/i.test(draft.mood)) return SUN;
	return NIGHT;
}
function block(tag, lines) {
	if (!lines.length) return `[${tag}]`;
	return `[${tag}]\n${lines.join("\n")}`;
}
function rotated(lines) {
	return [
		lines[2],
		lines[3],
		lines[0],
		lines[1]
	];
}
function hookFor(language, draft) {
	if (language === "en") return ENGLISH.hook;
	if (language === "instrumental") return "";
	return kitFor(draft ?? {
		genre: "V-Pop",
		mood: "",
		language: "vi"
	}).hook;
}
function singableLyrics(draft, bpm) {
	if (draft.language === "instrumental") return [
		"[Intro]",
		"",
		"[Instrumental]",
		"",
		"[Break]",
		"",
		"[Instrumental]",
		"",
		"[Outro]"
	].join("\n");
	if (draft.language === "en") {
		const verse2 = [
			ENGLISH.verse[2],
			ENGLISH.verse[3],
			ENGLISH.verse[0],
			ENGLISH.verse[1]
		];
		return [
			block("Intro", []),
			block("Verse 1", ENGLISH.verse),
			block("Pre-Chorus", ENGLISH.pre),
			block("Chorus", [
				ENGLISH.hook,
				ENGLISH.hook,
				ENGLISH.tail
			]),
			block("Verse 2", verse2),
			block("Pre-Chorus", ENGLISH.pre),
			block("Chorus", [
				ENGLISH.hook,
				ENGLISH.hook,
				ENGLISH.tail
			]),
			block("Bridge", ENGLISH.bridge),
			block("Chorus", [
				ENGLISH.hook,
				ENGLISH.hook,
				ENGLISH.tail
			]),
			block("Outro", [])
		].join("\n\n");
	}
	const kit = kitFor(draft);
	const n = lineDensity(bpm);
	return [
		block("Intro", []),
		block("Verse 1", kit.verse[n]),
		block("Pre-Chorus", kit.pre[n]),
		block("Chorus", [
			kit.hook,
			kit.hook,
			kit.tail[n]
		]),
		block("Verse 2", rotated(kit.verse[n])),
		block("Pre-Chorus", kit.pre[n]),
		block("Chorus", [
			kit.hook,
			kit.hook,
			kit.tail[n]
		]),
		block("Bridge", kit.bridge[n]),
		block("Chorus", [
			kit.hook,
			kit.hook,
			kit.tail[n]
		]),
		block("Outro", [])
	].join("\n\n");
}
function contentLines(text) {
	return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !/^\[[^\]]+\]$/.test(line));
}
function auditLyrics(text, options) {
	const density = lineDensity(options.bpm || 104);
	const leaks = findLeaks(text);
	const safe = leaks.length ? Math.min(42, 100 - leaks.length * 24) : 100;
	const lines = contentLines(text);
	const issues = [...leaks];
	if (options.language === "instrumental") {
		const diction = lines.length ? 40 : 92;
		if (lines.length) issues.push("Bản không lời mà ô lời vẫn còn câu hát.");
		return {
			clarity: diction,
			sustain: diction,
			meaning: lines.length ? 30 : 90,
			diction,
			safe,
			density,
			issues: issues.slice(0, 4)
		};
	}
	if (!lines.length) return {
		clarity: 20,
		sustain: 20,
		meaning: 15,
		diction: 18,
		safe,
		density,
		issues: [...issues, "Ô lời chưa có câu hát."].slice(0, 4)
	};
	if (options.language === "en") {
		const hookHits = options.hook ? text.split(options.hook).length - 1 : 0;
		const meaning = clamp(60 + (hookHits >= 2 ? 20 : 0) + Math.min(20, lines.length * 2) - leaks.length * 15);
		const sustain = clamp(60 + lines.filter((line) => /[aeiouy]$/i.test(line.replace(/[^A-Za-z]+$/g, ""))).length / lines.length * 35);
		const clarity = clamp(78 - leaks.length * 10);
		if (hookHits < 2) issues.push("Hook chưa lặp nguyên văn.");
		return {
			clarity,
			sustain,
			meaning,
			diction: clamp(clarity * .45 + sustain * .25 + meaning * .3),
			safe,
			density,
			issues: issues.slice(0, 4)
		};
	}
	let sustainSum = 0;
	let clearSum = 0;
	let offGrid = 0;
	let badEnd = 0;
	for (const line of lines) {
		const parts = syllablesOf(line);
		if (!(Boolean(options.hook) && line === options.hook) && Math.abs(parts.length - density) >= 2) offGrid += 1;
		const last = parts[parts.length - 1] ?? "";
		const info = last ? inspectSyllable(last) : {
			tone: "ngang",
			coda: "open",
			nucleus: "",
			clear: false
		};
		const bang = info.tone === "ngang" || info.tone === "huyen";
		if (info.coda === "stop") sustainSum += 18;
		else if (!bang && (info.tone === "hoi" || info.tone === "nga")) sustainSum += 46;
		else if (!bang) sustainSum += 62;
		else sustainSum += info.coda === "open" ? 100 : 94;
		const clearCount = parts.filter((part) => inspectSyllable(part).clear).length;
		clearSum += parts.length ? clearCount / parts.length : 0;
		if (info.coda === "stop" || !bang) badEnd += 1;
	}
	const sustain = clamp(sustainSum / lines.length);
	const clarity = clamp(48 + clearSum / lines.length * 52);
	const hookHits = options.hook ? text.split(options.hook).length - 1 : 0;
	let meaning = 68 + Math.min(16, lines.length) + (hookHits >= 2 ? 12 : 0) - leaks.length * 18;
	if (lines.length < 4) meaning -= 20;
	meaning = clamp(meaning);
	if (badEnd > 0) issues.push("Có câu kết bằng âm tắc hoặc thanh trắc. Nốt khó ngân, nghĩa dễ lệch.");
	if (offGrid > 0) issues.push(`Có câu lệch số tiếng so với nhịp ${density}. Lời sẽ vấp.`);
	if (hookHits < 2 && options.hook) issues.push("Câu hook chưa lặp nguyên văn.");
	if (!issues.length) issues.push("Lời trong, ngân được, và không lẫn hướng dẫn.");
	return {
		clarity,
		sustain,
		meaning,
		diction: clamp(clarity * .48 + sustain * .52),
		safe,
		density,
		issues: issues.slice(0, 4)
	};
}
//#endregion
export { sanitizeForSuno as a, hookFor as i, LYRIC_SKILL as n, singableLyrics as o, auditLyrics as r, GROK_LYRIC_RULES as t };
