import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { analyzeChannelsAsync, type AudioFeatures } from "@/lib/audio/analyze";
import { makeDemo } from "@/lib/audio/demo";
import { encodeWav } from "@/lib/audio/wav";
import { refineWithGrok } from "@/lib/grok.functions";
import {
  GENRES,
  buildLyrics,
  buildStylePrompt,
  emptyDraft,
  exact995,
  formatClock,
  inferDraft,
  scoreWork,
  type SingLanguage,
  type StyleDraft,
} from "@/lib/prompt/build";
import { LYRIC_SKILL, auditLyrics, sanitizeForSuno, type LyricAudit } from "@/lib/prompt/viet-lyric";
import { CuDock, type SheetId } from "@/components/cu-dock";
import { usePreview, type DspId, type LoaId } from "@/components/use-preview";

type TabId = "signal" | "style" | "prompt" | "qc";

type Saved = {
  id: string;
  at: number;
  name: string;
  draft: StyleDraft;
  styleText: string;
  lyrics: string;
  features: AudioFeatures | null;
};

const SAVE_KEY = "prompt.saves.v1";

function readSaves(): Saved[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Saved[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

async function copyText(text: string) {
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

function speakVietnamese(text: string) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text.slice(0, 700));
  const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith("vi"));
  utter.lang = voice?.lang ?? "vi-VN";
  if (voice) utter.voice = voice;
  synth.speak(utter);
}

export function Studio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const pushed = useRef(false);
  const preview = usePreview(audioRef);
  const [tab, setTab] = useState<TabId>("signal");
  const [fileName, setFileName] = useState<string | null>(null);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [draft, setDraft] = useState<StyleDraft>(emptyDraft);
  const [styleText, setStyleText] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [ngame, setNgame] = useState(false);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [pwamc, setPwamc] = useState(false);
  const [saves, setSaves] = useState<Saved[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  const [grokNote, setGrokNote] = useState("");
  const [grokBusy, setGrokBusy] = useState(false);
  const [offer, setOffer] = useState<{ style: string; lyrics: string; notes: string[] } | null>(null);

  useEffect(() => {
    setSaves(readSaves());
    const onPop = () => {
      pushed.current = false;
      setSheet(null);
      setPwamc(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const qc = useMemo(
    () => (styleText ? scoreWork(features, draft, styleText, lyrics) : null),
    [features, draft, styleText, lyrics],
  );

  const openSheet = (next: SheetId) => {
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

  const remember = (entry: Saved) => {
    const next = [entry, ...readSaves().filter((item) => item.id !== entry.id)].slice(0, 8);
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    setSaves(next);
  };

  const publish = (nextFeatures: AudioFeatures, name: string) => {
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
      features: nextFeatures,
    });
    setTab("signal");
  };

  const replaceUrl = (url: string) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    preview.load(url);
  };

  const onFile = async (file: File) => {
    setBusy(true);
    setError("");
    setNote("");
    setStatus(file.size > 48 * 1024 * 1024 ? "Tệp lớn. Đang giải mã, máy có thể chậm…" : "Đang giải mã…");
    replaceUrl(URL.createObjectURL(file));
    setFileName(file.name);
    try {
      const ctx = new AudioContext();
      const raw = await file.arrayBuffer();
      const audio = await ctx.decodeAudioData(raw);
      const channels: Float32Array[] = [];
      for (let i = 0; i < audio.numberOfChannels; i++) channels.push(audio.getChannelData(i));
      setStatus("Đang đo BPM, tông và độ lớn…");
      const measured = await analyzeChannelsAsync({ sampleRate: audio.sampleRate, channels });
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
      const blob = encodeWav(pcm.channels[0] ?? new Float32Array(), pcm.sampleRate);
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
    const brief = features
      ? `BPM ${Math.round(features.bpm)}, key ${features.key}, ${features.durationSec.toFixed(0)}s, brightness ${Math.round(features.brightness)} Hz, crest ${features.crestDb.toFixed(1)} dB, genre ${draft.genre}, language ${draft.language}.`
      : `No measurement. Genre ${draft.genre}, language ${draft.language}.`;
    const result = await refineWithGrok({ data: { style: styleText, lyrics, brief } });
    setGrokBusy(false);
    if (!result.ok) {
      setGrokNote(result.error);
      return;
    }
    setOffer(result);
    setGrokNote("Grok đã trả một bản. Đối chiếu rồi mới thay.");
  };

  const progress = preview.duration > 0 ? preview.time / preview.duration : 0;

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-3xl flex-col bg-bg text-fg">
      <audio ref={audioRef} preload="auto" className="hidden" />
      <Ngame
        open={ngame}
        onToggle={() => setNgame((value) => !value)}
        onPlay={() => void preview.toggle()}
        onCopy={() => void copyText(styleText).then(() => setNote("Đã chép style prompt."))}
        onRebuild={rebuild}
        onQc={() => setTab("qc")}
        onScrub={preview.scrub}
        onGain={preview.setGain}
        gain={preview.gain}
        progress={progress}
        playing={preview.playing}
      />
      <div className={`shell-pad flex min-h-0 flex-1 flex-col ${ngame ? "px-24" : "px-12"}`}>
        <section className="frame-gold zone-new flex min-h-0 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-gold/30 px-3 py-2">
            <div>
              <p className="font-display text-2xl tracking-widest text-gold">PROMPT</p>
              <p className="text-sm text-muted">Lời Việt trong sáng · Suno không hát hướng dẫn</p>
            </div>
            <button
              type="button"
              className="min-h-11 border border-gold/40 px-3 font-display text-xs tracking-widest text-gold uppercase"
              onClick={() => setShowSaves((value) => !value)}
            >
              Đã lưu
            </button>
          </header>
          <div className="grid grid-cols-4 gap-1 px-3 py-2" role="tablist">
            {(
              [
                ["signal", "Đo"],
                ["style", "Style"],
                ["prompt", "Suno"],
                ["qc", "QC"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`min-h-11 font-display text-sm tracking-widest uppercase ${
                  tab === id ? "bg-gold text-bg" : "border border-gold/30 text-gold"
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {showSaves ? (
              <SaveList
                saves={saves}
                onOpen={(item) => {
                  setFeatures(item.features);
                  setDraft(item.draft);
                  setStyleText(item.styleText);
                  setLyrics(item.lyrics);
                  setFileName(item.name);
                  setShowSaves(false);
                  setTab("prompt");
                }}
              />
            ) : null}
            {tab === "signal" ? (
              <SignalPane
                busy={busy}
                status={status}
                error={error}
                fileName={fileName}
                features={features}
                peaks={features?.peaks ?? []}
                progress={progress}
                playing={preview.playing}
                level={preview.level}
                time={preview.time}
                duration={preview.duration}
                loa={preview.loa}
                dsp={preview.dsp}
                onPick={() => fileRef.current?.click()}
                onDemo={() => void onDemo()}
                onToggle={() => void preview.toggle()}
                onScrub={preview.scrub}
                onLoa={preview.setLoa}
                onDsp={preview.setDsp}
                onDropFile={(file) => void onFile(file)}
              />
            ) : null}
            {tab === "style" ? (
              <StylePane draft={draft} onChange={setDraft} onRebuild={rebuild} disabled={!features && !styleText} />
            ) : null}
            {tab === "prompt" ? (
              <PromptPane
                styleText={styleText}
                lyrics={lyrics}
                seconds={qc?.seconds ?? 0}
                note={note}
                audit={
                  lyrics
                    ? auditLyrics(lyrics, {
                        language: draft.language,
                        bpm: features?.bpm || 104,
                        hook: buildLyrics(features, draft).hook,
                      })
                    : null
                }
                onStyle={setStyleText}
                onLyrics={setLyrics}
                onFit={() => {
                  setStyleText(exact995(styleText));
                  setNote("Đã siết style về 995 ký tự.");
                }}
                onRewriteLyrics={() => {
                  setLyrics(buildLyrics(features, draft).text);
                  setNote("Đã viết lại lời theo luật âm học tiếng Việt.");
                }}
                onCopy={async (text, label) => {
                  await copyText(text);
                  setNote(label);
                }}
              />
            ) : null}
            {tab === "qc" ? (
              <QcPane
                qc={qc}
                busy={grokBusy}
                note={grokNote}
                offer={offer}
                onAsk={() => void askGrok()}
                onApply={() => {
                  if (!offer) return;
                  setStyleText(exact995(offer.style));
                  setLyrics(sanitizeForSuno(offer.lyrics));
                  setOffer(null);
                  setGrokNote("Đã dùng bản Grok và siết style về 995 ký tự.");
                  setTab("prompt");
                }}
              />
            ) : null}
          </div>
        </section>
        <section className="frame-gold zone-cu mt-2 flex min-h-0 flex-col">
          <CuDock
            sheet={sheet}
            setSheet={openSheet}
            onRadio={() => {
              preview.pause();
            }}
          />
        </section>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.webm"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        aria-label="Mở PWAMC"
        className="sticker absolute right-14 bottom-40 z-40 size-14 rounded-full border border-gold bg-gold text-bg"
        onClick={() => setPwamc((value) => !value)}
      >
        <span className="font-display text-xs tracking-widest">PWAMC</span>
      </button>
      {pwamc ? (
        <div className="absolute right-3 bottom-52 z-40 w-64 border border-gold bg-surface p-3">
          <p className="font-display tracking-widest text-gold uppercase">PWAMC</p>
          <p className="mt-1 text-sm text-muted">Đọc style bằng giọng máy, hoặc xuất file ghép lời.</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              className="min-h-11 bg-gold font-display tracking-widest text-bg uppercase"
              onClick={() => speakVietnamese(styleText || "Chưa có prompt.")}
            >
              Đọc prompt
            </button>
            <button
              type="button"
              className="min-h-11 border border-gold font-display tracking-widest text-gold uppercase"
              onClick={() => {
                const blob = new Blob([`STYLE\n${styleText}\n\nLYRICS\n${sanitizeForSuno(lyrics)}\n`], { type: "text/plain" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "prompt-suno.txt";
                link.click();
              }}
            >
              Xuất ghép lời
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SignalPane(props: {
  busy: boolean;
  status: string;
  error: string;
  fileName: string | null;
  features: AudioFeatures | null;
  peaks: number[];
  progress: number;
  playing: boolean;
  level: number;
  time: number;
  duration: number;
  loa: LoaId;
  dsp: DspId;
  onPick: () => void;
  onDemo: () => void;
  onToggle: () => void;
  onScrub: (ratio: number) => void;
  onLoa: (loa: LoaId) => void;
  onDsp: (dsp: DspId) => void;
  onDropFile: (file: File) => void;
}) {
  return (
    <div className="space-y-3">
      <div
        className="border border-dashed border-gold/50 px-3 py-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) props.onDropFile(file);
        }}
      >
        <p className="font-display tracking-widest text-gold uppercase">Tệp nhạc</p>
        <p className="mt-1 text-sm text-muted">MP3, WAV, FLAC, OGG, M4A. Giải mã một lần rồi xả bộ nhớ sóng.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase" onClick={props.onPick} disabled={props.busy}>
            Chọn tệp
          </button>
          <button type="button" className="min-h-11 border border-gold px-4 font-display tracking-widest text-gold uppercase" onClick={props.onDemo} disabled={props.busy}>
            Mẫu 120
          </button>
        </div>
        {props.fileName ? <p className="mt-2 truncate text-sm text-fg">{props.fileName}</p> : null}
        {props.status ? <p className="mt-1 text-sm text-gold">{props.status}</p> : null}
        {props.error ? <p className="mt-1 text-sm text-fg">{props.error}</p> : null}
      </div>
      <button
        type="button"
        className="block w-full"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          props.onScrub((event.clientX - rect.left) / rect.width);
        }}
      >
        <Waveform peaks={props.peaks} progress={props.progress} />
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase" onClick={props.onToggle} disabled={!props.fileName}>
          {props.playing ? "Dừng" : "Phát"}
        </button>
        <span className="font-display tabular-nums text-sm text-muted">
          {formatClock(props.time)} / {formatClock(props.duration)}
        </span>
        <span className="text-sm text-muted">mức {Math.round(props.level * 100)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {(["LOA3", "LOA1", "LOA2"] as const).map((id) => (
          <button key={id} type="button" className={chip(props.loa === id)} onClick={() => props.onLoa(id)}>
            {id}
          </button>
        ))}
        {(
          [
            ["music", "Nhạc"],
            ["tvpt", "TVPT"],
            ["tvqc", "TVQC"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={chip(props.dsp === id)} onClick={() => props.onDsp(id)}>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">
        LOA3 cả hai kênh, bù sau nén. LOA1 lệch trái, LOA2 lệch phải. TVPT là phóng thanh, TVQC là giọng quảng cáo.
      </p>
      {props.features ? <Metrics features={props.features} /> : <p className="text-sm text-muted">Chưa có số đo.</p>}
    </div>
  );
}

function Metrics({ features }: { features: AudioFeatures }) {
  const cells = [
    ["BPM", features.bpm ? String(features.bpm) : "—", `${Math.round(features.bpmConfidence * 100)}%`],
    ["Tông", features.key, `${Math.round(features.keyConfidence * 100)}%`],
    ["LUFS", features.lufs.toFixed(1), "ước tính"],
    ["Đỉnh", `${features.crestDb.toFixed(1)} dB`, "crest"],
    ["Dài", formatClock(features.durationSec), `${features.sampleRate} Hz`],
    ["Sáng", `${Math.round(features.brightness)} Hz`, features.channels > 1 ? "stereo" : "mono"],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1">
        {cells.map(([label, value, sub]) => (
          <div key={label} className="border border-gold/30 bg-bg px-2 py-2">
            <div className="font-display text-xs tracking-widest text-muted uppercase">{label}</div>
            <div className="font-display text-lg tabular-nums text-fg">{value}</div>
            <div className="text-xs text-muted">{sub}</div>
          </div>
        ))}
      </div>
      {features.durationSec < 45 ? (
        <p className="text-sm text-muted">Tệp ngắn hơn một bài. Prompt vẫn được viết cho bản từ 4 phút.</p>
      ) : null}
      <ul className="space-y-1 text-sm">
        {features.sections.map((section, index) => (
          <li key={`${section.label}-${index}`} className="flex justify-between gap-3 border-b border-gold/20 py-1">
            <span>{section.label}</span>
            <span className="tabular-nums text-muted">
              {formatClock(section.start * features.durationSec)}–{formatClock(section.end * features.durationSec)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StylePane({
  draft,
  onChange,
  onRebuild,
  disabled,
}: {
  draft: StyleDraft;
  onChange: (draft: StyleDraft) => void;
  onRebuild: () => void;
  disabled: boolean;
}) {
  const set = (patch: Partial<StyleDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="font-display text-xs tracking-widest text-muted uppercase">Thể loại</span>
        <select
          value={draft.genre}
          onChange={(event) => set({ genre: event.target.value })}
          className="mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg"
        >
          {GENRES.map((genre) => (
            <option key={genre}>{genre}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-display text-xs tracking-widest text-muted uppercase">Lời hát</span>
        <select
          value={draft.language}
          onChange={(event) => set({ language: event.target.value as SingLanguage })}
          className="mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg"
        >
          <option value="vi">Hát tiếng Việt</option>
          <option value="en">Hát tiếng Anh</option>
          <option value="instrumental">Không lời</option>
        </select>
      </label>
      <Field label="Mood" value={draft.mood} onChange={(mood) => set({ mood })} />
      <Field label="Giọng" value={draft.vocals} onChange={(vocals) => set({ vocals })} />
      <Field label="Nhạc cụ" value={draft.instruments} onChange={(instruments) => set({ instruments })} />
      <Field label="Sản xuất" value={draft.production} onChange={(production) => set({ production })} />
      <Field label="Ghi chú màu" value={draft.reference} onChange={(reference) => set({ reference })} />
      <button type="button" className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase" onClick={onRebuild} disabled={disabled}>
        Viết lại prompt
      </button>
    </div>
  );
}

function PromptPane(props: {
  styleText: string;
  lyrics: string;
  seconds: number;
  note: string;
  audit: LyricAudit | null;
  onStyle: (value: string) => void;
  onLyrics: (value: string) => void;
  onFit: () => void;
  onRewriteLyrics: () => void;
  onCopy: (text: string, label: string) => Promise<void>;
}) {
  const count = props.styleText.length;
  const ready = count >= 960 && count <= 995;
  const clean = sanitizeForSuno(props.lyrics);
  const leaked = Boolean(props.lyrics.trim()) && clean !== props.lyrics.trim();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-display tracking-widest text-gold uppercase">Style box</p>
        <p className={`font-display tabular-nums ${ready ? "text-gold" : "text-muted"}`}>
          {count}/995{count > 1000 ? " vượt" : ""}
        </p>
      </div>
      <textarea
        value={props.styleText}
        onChange={(event) => props.onStyle(event.target.value)}
        rows={8}
        placeholder="Chưa có prompt. Hãy đo một tệp hoặc mẫu 120."
        className="w-full border border-gold/40 bg-bg px-3 py-2 text-sm leading-relaxed text-fg"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 bg-gold px-3 font-display text-sm tracking-widest text-bg uppercase" onClick={() => void props.onCopy(props.styleText, "Đã chép style prompt.")} disabled={!props.styleText}>
          Chép style
        </button>
        <button type="button" className="min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase" onClick={props.onFit} disabled={!props.styleText}>
          Siết 995
        </button>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-display tracking-widest text-gold uppercase">Lời hát</p>
        <p className="font-display tabular-nums text-sm text-muted">ước tính {formatClock(props.seconds)}</p>
      </div>
      <textarea
        value={props.lyrics}
        onChange={(event) => props.onLyrics(event.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full border border-gold/40 bg-bg px-3 py-2 text-sm leading-relaxed text-fg"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase"
          onClick={() => void props.onCopy(clean, leaked ? "Đã lọc hướng dẫn rồi chép lời." : "Đã chép lời.")}
          disabled={!clean}
        >
          Chép lời
        </button>
        <button type="button" className="min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase" onClick={props.onRewriteLyrics}>
          Viết lời theo luật
        </button>
        <button
          type="button"
          className="min-h-11 border border-gold px-3 font-display text-sm tracking-widest text-gold uppercase"
          onClick={() => props.onLyrics(clean)}
          disabled={!props.lyrics || !leaked}
        >
          Lọc hướng dẫn
        </button>
      </div>
      {props.audit ? (
        <div className="space-y-2 border border-gold/40 p-3">
          <p className="font-display text-xs tracking-widest text-gold uppercase">Âm học lời Việt</p>
          <Meter label="Trong sáng" value={props.audit.clarity} />
          <Meter label="Giữ nốt" value={props.audit.sustain} />
          <Meter label="An toàn Suno" value={props.audit.safe} />
          <ul className="space-y-1 text-sm text-fg">
            {props.audit.issues.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ul className="space-y-1 text-xs text-muted">
            {LYRIC_SKILL.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {props.note ? <p className="text-sm text-gold">{props.note}</p> : null}
      <p className="text-xs text-muted">Dán style vào ô Style của Suno, lời vào ô Lyrics. Luật viết lời ở trên, không dán vào ô lời.</p>
    </div>
  );
}

function QcPane({
  qc,
  busy,
  note,
  offer,
  onAsk,
  onApply,
}: {
  qc: ReturnType<typeof scoreWork> | null;
  busy: boolean;
  note: string;
  offer: { style: string; lyrics: string; notes: string[] } | null;
  onAsk: () => void;
  onApply: () => void;
}) {
  if (!qc) return <p className="text-sm text-muted">Viết prompt trước khi chấm.</p>;
  return (
    <div className="space-y-3">
      <div className="border border-gold/40 px-3 py-3">
        <p className="font-display text-xs tracking-widest text-muted uppercase">Tổng</p>
        <p className="font-display text-4xl tabular-nums text-gold">{qc.overall}</p>
        <p className="text-sm text-muted">Bản máy, không phải số liệu hãng.</p>
      </div>
      <Meter label="Cuốn" value={qc.catchiness} />
      <Meter label="Hướng 2026" value={qc.trending} />
      <Meter label="Độ dài" value={qc.length} />
      <Meter label="Khớp số đo" value={qc.coherence} />
      <Meter label="Trong sáng" value={qc.diction} />
      <Meter label="An toàn Suno" value={qc.sunoSafe} />
      <ul className="space-y-2 text-sm text-fg">
        {qc.notes.map((item) => (
          <li key={item} className="border-l border-gold pl-2">
            {item}
          </li>
        ))}
      </ul>
      <button type="button" className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase" onClick={onAsk} disabled={busy}>
        {busy ? "Đang hỏi Grok…" : "Nhờ Grok siết"}
      </button>
      {note ? <p className="text-sm text-fg">{note}</p> : null}
      {offer ? (
        <div className="space-y-2 border border-gold/40 p-3">
          {offer.notes.map((item) => (
            <p key={item} className="text-sm text-muted">
              {item}
            </p>
          ))}
          <button type="button" className="min-h-11 border border-gold px-3 font-display tracking-widest text-gold uppercase" onClick={onApply}>
            Dùng bản Grok
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SaveList({ saves, onOpen }: { saves: Saved[]; onOpen: (item: Saved) => void }) {
  if (!saves.length) return <p className="mb-3 text-sm text-muted">Chưa có bản lưu trên máy.</p>;
  return (
    <ul className="mb-3 space-y-1">
      {saves.map((item) => (
        <li key={item.id}>
          <button type="button" className="min-h-11 w-full border border-gold/30 px-2 text-left text-sm" onClick={() => onOpen(item)}>
            <span className="block truncate text-fg">{item.name}</span>
            <span className="text-muted">{item.features ? `${item.features.bpm} BPM · ${item.features.key}` : "không số đo"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="font-display text-xs tracking-widest text-muted uppercase">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-11 w-full border border-gold/40 bg-bg px-2 text-fg" />
    </label>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between font-display text-xs tracking-widest uppercase">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-fg">{value}</span>
      </div>
      <div className="mt-1 h-1.5 bg-bg">
        <div className="h-full bg-gold" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Waveform({ peaks, progress }: { peaks: number[]; progress: number }) {
  const data = peaks.length ? peaks.filter((_, index) => index % 4 === 0) : Array.from({ length: 48 }, () => 0.08);
  return (
    <div className="flex h-20 w-full items-center gap-px" aria-hidden="true">
      {data.map((peak, index) => (
        <span
          key={`${index}-${peak.toFixed(3)}`}
          className="min-w-0 flex-1 bg-gold"
          style={{
            height: `${Math.max(6, Math.round(peak * 100))}%`,
            opacity: index / data.length <= progress ? 1 : 0.38,
          }}
        />
      ))}
    </div>
  );
}

function chip(active: boolean) {
  return `min-h-11 px-3 font-display text-xs tracking-widest uppercase ${active ? "bg-gold text-bg" : "border border-gold/40 text-gold"}`;
}

function Ngame(props: {
  open: boolean;
  onToggle: () => void;
  onPlay: () => void;
  onCopy: () => void;
  onRebuild: () => void;
  onQc: () => void;
  onScrub: (ratio: number) => void;
  onGain: (value: number) => void;
  gain: number;
  progress: number;
  playing: boolean;
}) {
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    props.onScrub((event.clientX - rect.left) / rect.width);
    props.onGain(1 - (event.clientY - rect.top) / rect.height);
  };
  return (
    <>
      <div className="pointer-events-none absolute inset-y-2 left-0 w-px bg-gold/80" />
      <div className="pointer-events-none absolute inset-y-2 right-0 w-px bg-gold/80" />
      {props.open ? (
        <>
          <div className="mica hemi-left absolute inset-y-2 left-1 z-40 flex w-24 flex-col p-2">
            <button type="button" className="min-h-11 font-display text-xs tracking-widest text-gold uppercase" onClick={props.onToggle}>
              Đóng
            </button>
            <div
              className="relative mt-2 h-28 border border-gold/50"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                drag(event);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) drag(event);
              }}
            >
              <span
                className="absolute size-4 rounded-full bg-gold"
                style={{
                  left: `calc(${props.progress * 100}% - 0.5rem)`,
                  top: `calc(${(1 - props.gain) * 100}% - 0.5rem)`,
                }}
              />
            </div>
            <p className="mt-2 text-center font-display text-xs tracking-widest text-muted uppercase">Kéo</p>
          </div>
          <div className="mica hemi-right absolute inset-y-2 right-1 z-40 flex w-24 flex-col items-stretch justify-center gap-2 p-2">
            <Arcade label={props.playing ? "Dừng" : "A"} onClick={props.onPlay} />
            <Arcade label="B" onClick={props.onCopy} />
            <Arcade label="X" onClick={props.onRebuild} />
            <Arcade label="Y" onClick={props.onQc} />
            <button type="button" className="min-h-11 font-display text-xs tracking-widest text-gold uppercase" onClick={props.onToggle}>
              Đóng
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" aria-label="Mở NGAME trái" className="absolute top-24 left-1 z-40 size-11 rounded-arcade border border-gold bg-bg font-display text-xs text-gold" onClick={props.onToggle}>
            L
          </button>
          <button type="button" aria-label="Mở NGAME phải" className="absolute top-24 right-1 z-40 size-11 rounded-arcade border border-gold bg-bg font-display text-xs text-gold" onClick={props.onToggle}>
            R
          </button>
        </>
      )}
    </>
  );
}

function Arcade({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="min-h-11 rounded-arcade border border-gold bg-bg font-display tracking-widest text-gold uppercase">
      {label}
    </button>
  );
}
