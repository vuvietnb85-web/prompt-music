import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { a as sanitizeForSuno, t as GROK_LYRIC_RULES } from "./viet-lyric-l07g51rD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/grok.functions-l2mjgW30.js
function asText(content) {
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => {
		if (typeof part === "string") return part;
		if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
		return "";
	}).join("");
	return "";
}
var refineWithGrok_createServerFn_handler = createServerRpc({
	id: "21a666dbe39f7dd48bf3b070f2adf075839f80e110cc87bcf6739715ce9c19a3",
	name: "refineWithGrok",
	filename: "src/lib/grok.functions.ts"
}, (opts) => refineWithGrok.__executeServer(opts));
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
}).handler(refineWithGrok_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "Grok chưa sẵn trên môi trường này."
	};
	try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			signal: AbortSignal.timeout(28e3),
			body: JSON.stringify({
				model: "grok-4.5",
				temperature: .4,
				max_tokens: 1400,
				messages: [{
					role: "system",
					content: `You edit Suno prompts. Reply with JSON only, no markdown. Keys: style (English, one paragraph, 960-995 characters, no line breaks), lyrics (singable lines plus bare section tags only), notes (3 short Vietnamese sentences, no fake market statistics). Do not claim you heard the audio. ${GROK_LYRIC_RULES}`
				}, {
					role: "user",
					content: `Brief:\n${data.brief}\n\nCurrent style:\n${data.style}\n\nCurrent lyrics:\n${data.lyrics}`
				}]
			})
		});
		if (!res.ok) return {
			ok: false,
			error: `Grok trả lỗi ${res.status}. Thử lại một lần.`
		};
		const text = asText((await res.json()).choices?.[0]?.message?.content);
		const start = text.indexOf("{");
		const end = text.lastIndexOf("}");
		if (start < 0 || end <= start) return {
			ok: false,
			error: "Grok không trả JSON dùng được."
		};
		const parsed = JSON.parse(text.slice(start, end + 1));
		const style = String(parsed.style ?? "").replace(/\s+/g, " ").trim();
		const lyrics = sanitizeForSuno(String(parsed.lyrics ?? ""));
		const notes = Array.isArray(parsed.notes) ? parsed.notes.map((n) => String(n)).slice(0, 4) : [];
		if (style.length < 40 || lyrics.length < 20) return {
			ok: false,
			error: "Bản Grok quá ngắn, giữ bản máy."
		};
		return {
			ok: true,
			style,
			lyrics,
			notes
		};
	} catch {
		return {
			ok: false,
			error: "Không gọi được Grok. Giữ bản máy và thử lại."
		};
	}
});
//#endregion
export { refineWithGrok_createServerFn_handler };
