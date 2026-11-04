import { useEffect, useRef, useState } from "react";
import { upcomingEvents } from "@/lib/lunar";
import { getUsdVnd } from "@/lib/rates.functions";

export type SheetId = "radio" | "rec" | "morse" | "paypal" | null;

type Station = { name: string; url: string };

const WEATHER: Record<number, string> = {
  0: "quang",
  1: "ít mây",
  2: "mây",
  3: "kín mây",
  45: "sương",
  61: "mưa",
  63: "mưa vừa",
  65: "mưa to",
  80: "mưa rào",
  95: "dông",
};

const MORSE: Record<string, string> = {
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
  "9": "----.",
};

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (opts: { hostedButtonId: string }) => { render: (selector: string) => Promise<void> };
    };
  }
}

async function playMorse(text: string) {
  const ctx = new AudioContext();
  const gain = ctx.createGain();
  gain.gain.value = 0.07;
  gain.connect(ctx.destination);
  const dit = 0.08;
  let t = ctx.currentTime + 0.04;
  const cleaned = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
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
  window.setTimeout(() => void ctx.close(), Math.max(300, (t - ctx.currentTime) * 1000 + 200));
}

export function CuDock({
  sheet,
  setSheet,
  onRadio,
}: {
  sheet: SheetId;
  setSheet: (sheet: SheetId) => void;
  onRadio: () => void;
}) {
  const [clock, setClock] = useState<ReturnType<typeof upcomingEvents> | null>(null);
  const [temp, setTemp] = useState<string>("Nam Định …");
  const [fx, setFx] = useState<string>("USD …");
  const [coords, setCoords] = useState({ lat: 20.42, lon: 106.17, label: "Nam Định" });
  const [placeNote, setPlaceNote] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [radioError, setRadioError] = useState("");
  const [radioOn, setRadioOn] = useState(false);
  const radioRef = useRef<HTMLAudioElement>(null);
  const [takes, setTakes] = useState<{ url: string; label: string }[]>([]);
  const [recOn, setRecOn] = useState(false);
  const [recNote, setRecNote] = useState("Bấm Thu sẽ xin quyền micro. File ở lại trên máy.");
  const recRef = useRef<MediaRecorder | null>(null);
  const [morse, setMorse] = useState("PROMPT");
  const [payError, setPayError] = useState(false);

  useEffect(() => {
    setClock(upcomingEvents(new Date()));
    const id = window.setInterval(() => setClock(upcomingEvents(new Date())), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&timezone=Asia%2FBangkok`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("weather");
        const body = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
        if (cancel) return;
        const c = body.current;
        const word = WEATHER[c?.weather_code ?? -1] ?? "thời tiết";
        setTemp(`${coords.label} ${Math.round(c?.temperature_2m ?? 0)}° ${word}`);
      } catch {
        if (!cancel) setTemp(`${coords.label} — không lấy được thời tiết`);
      }
    };
    void run();
    return () => {
      cancel = true;
    };
  }, [coords]);

  useEffect(() => {
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
    void run();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (sheet !== "paypal") return;
    const render = () => {
      const target = document.getElementById("paypal-container-T7AZ748Y27248");
      if (!target || !window.paypal) return;
      target.replaceChildren();
      void window.paypal
        .HostedButtons({ hostedButtonId: "T7AZ748Y27248" })
        .render("#paypal-container-T7AZ748Y27248")
        .catch(() => setPayError(true));
    };
    if (window.paypal) {
      render();
      return;
    }
    let script = document.getElementById("paypal-sdk") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "paypal-sdk";
      script.async = true;
      script.src =
        "https://www.paypal.com/sdk/js?client-id=BAAIfuQli_a3Qud-8CIRqCRCeohqtiW29_i2Txx2rQM35pqMc-pbCIZX6L8tx1zbyOj_vp8AUE_dpSqOhc&components=hosted-buttons&disable-funding=venmo&currency=USD";
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

  const ticker = clock
    ? `${clock.solarLabel}  ·  ${clock.lunarLabel}  ·  ${clock.yearName}  ·  ${temp}  ·  ${fx}  ·  ${clock.next.name} còn ${clock.next.days} ngày  ·  PROMPT phân tích nhạc và viết prompt Suno`
    : "Đang đọc lịch, thời tiết và tỉ giá";

  const openRadio = async () => {
    setSheet("radio");
    if (stations.length) return;
    setRadioError("");
    try {
      const res = await fetch(
        "https://de1.api.radio-browser.info/json/stations/search?countrycode=VN&hidebroken=true&limit=25&order=votes&reverse=true",
      );
      if (!res.ok) throw new Error("radio");
      const body = (await res.json()) as { name?: string; url_resolved?: string }[];
      const list = body
        .map((s) => ({ name: s.name?.trim() || "Đài", url: s.url_resolved || "" }))
        .filter((s) => s.url.startsWith("http"));
      if (!list.length) throw new Error("empty");
      setStations(list);
    } catch {
      setRadioError("Không tải được danh sách đài Việt Nam. Thử lại khi có mạng.");
    }
  };

  const playStation = async (station: Station) => {
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
      const chunks: Blob[] = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const stamp = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        setTakes((prev) => [{ url: URL.createObjectURL(blob), label: `Thu ${stamp}` }, ...prev].slice(0, 6));
        setRecOn(false);
        setRecNote("Đã cắt đoạn. Nghe lại bên dưới. File không rời máy.");
      };
      rec.start(1000);
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: "Tại chỗ",
        });
        setPlaceNote("");
      },
      () => setPlaceNote("Không lấy được vị trí. Giữ mốc Nam Định."),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8000 },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <audio ref={radioRef} preload="none" className="hidden" onPause={() => setRadioOn(false)} />
      <div className="overflow-hidden border-b border-gold/40">
        <div className="ticker-track py-1 font-display text-xs tracking-widest text-gold uppercase">{ticker}</div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-1 px-2 py-1.5 text-xs">
        <div className="truncate font-display tracking-wide text-fg uppercase">{clock?.lunarLabel ?? "Âm lịch"}</div>
        <div className="truncate text-right text-muted">{fx}</div>
        <div className="col-span-2 truncate text-muted">{temp}</div>
      </div>
      <div className="grid grid-cols-4 gap-1 px-2 pb-2">
        <DockButton active={radioOn} onClick={() => void openRadio()}>
          Đài
        </DockButton>
        <DockButton onClick={() => setSheet("rec")}>Thu</DockButton>
        <DockButton onClick={() => setSheet("morse")}>Morse</DockButton>
        <DockButton onClick={() => setSheet("paypal")}>Ủng hộ</DockButton>
      </div>
      {sheet ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-bg/95 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg tracking-widest text-gold uppercase">
              {sheet === "radio" ? "Đài Việt Nam" : sheet === "rec" ? "Thu âm" : sheet === "morse" ? "Morse" : "Ủng hộ"}
            </h2>
            <button
              type="button"
              className="min-h-11 border border-gold/50 px-3 font-display text-sm tracking-widest text-gold uppercase"
              onClick={() => setSheet(null)}
            >
              Đóng
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sheet === "radio" ? (
              <div className="space-y-2">
                <p className="text-sm text-muted">Phát qua loa máy, không qua chuỗi nhạc đang phân tích.</p>
                {radioError ? <p className="text-sm text-fg">{radioError}</p> : null}
                {radioOn ? (
                  <button
                    type="button"
                    className="min-h-11 border border-gold px-3 font-display tracking-widest text-gold uppercase"
                    onClick={() => radioRef.current?.pause()}
                  >
                    Dừng đài
                  </button>
                ) : null}
                <ul className="space-y-1">
                  {stations.map((station) => (
                    <li key={station.url}>
                      <button
                        type="button"
                        className="min-h-11 w-full border border-gold/30 px-3 text-left text-sm text-fg"
                        onClick={() => void playStation(station)}
                      >
                        {station.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sheet === "rec" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">{recNote}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase"
                    onClick={() => void startRec()}
                    disabled={recOn}
                  >
                    Thu
                  </button>
                  <button
                    type="button"
                    className="min-h-11 border border-gold px-4 font-display tracking-widest text-gold uppercase"
                    onClick={stopRec}
                    disabled={!recOn}
                  >
                    Dừng
                  </button>
                </div>
                <ul className="space-y-2">
                  {takes.map((take) => (
                    <li key={take.url} className="border border-gold/30 p-2">
                      <div className="mb-1 text-sm text-fg">{take.label}</div>
                      <audio controls src={take.url} className="w-full" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sheet === "morse" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Âm 680 Hz, tốc độ khoảng 15 từ/phút. Dấu tiếng Việt được bỏ.</p>
                <textarea
                  value={morse}
                  onChange={(event) => setMorse(event.target.value)}
                  rows={4}
                  className="w-full border border-gold/40 bg-surface px-3 py-2 text-fg"
                />
                <button
                  type="button"
                  className="min-h-11 bg-gold px-4 font-display tracking-widest text-bg uppercase"
                  onClick={() => void playMorse(morse)}
                >
                  Phát Morse
                </button>
              </div>
            ) : null}
            {sheet === "paypal" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Nút PayPal mở trang thanh toán. Không chạy nếu mạng chặn script.</p>
                <div id="paypal-container-T7AZ748Y27248" />
                {payError ? <p className="text-sm text-fg">Nút PayPal chưa tải. Kiểm tra mạng rồi mở lại mục này.</p> : null}
              </div>
            ) : null}
            <button type="button" className="mt-4 text-sm text-gold underline" onClick={askPlace}>
              Lấy thời tiết tại chỗ
            </button>
            {placeNote ? <p className="mt-1 text-sm text-muted">{placeNote}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DockButton({
  children,
  onClick,
  active,
}: {
  children: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 border font-display text-xs tracking-widest uppercase ${
        active ? "border-gold bg-gold text-bg" : "border-gold/40 text-gold"
      }`}
    >
      {children}
    </button>
  );
}
