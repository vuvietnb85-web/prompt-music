import { useEffect, useRef, useState, type RefObject } from "react";

export type LoaId = "LOA1" | "LOA2" | "LOA3";
export type DspId = "music" | "tvpt" | "tvqc";

type Graph = {
  ctx: AudioContext;
  hp: BiquadFilterNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  presence: BiquadFilterNode;
  deess: BiquadFilterNode;
  air: BiquadFilterNode;
  comp: DynamicsCompressorNode;
  gain: GainNode;
  pan: StereoPannerNode;
  analyser: AnalyserNode;
};

function shape(g: Graph, loa: LoaId, dsp: DspId, userGain: number) {
  const base = loa === "LOA3" ? 1.25 : 1.15;
  g.gain.gain.value = base * userGain;
  g.pan.pan.value = loa === "LOA1" ? -0.55 : loa === "LOA2" ? 0.55 : 0;
  if (dsp === "tvpt") {
    g.hp.frequency.value = 180;
    g.low.frequency.value = 140;
    g.low.gain.value = -2;
    g.mid.frequency.value = 450;
    g.mid.gain.value = -2;
    g.mid.Q.value = 0.8;
    g.presence.frequency.value = 2800;
    g.presence.gain.value = 6;
    g.presence.Q.value = 0.9;
    g.deess.frequency.value = 7200;
    g.deess.gain.value = -1;
    g.deess.Q.value = 0.7;
    g.air.frequency.value = 10000;
    g.air.gain.value = 1;
    g.comp.threshold.value = -24;
    g.comp.ratio.value = 6;
    g.comp.attack.value = 0.004;
    g.comp.release.value = 0.12;
    return;
  }
  if (dsp === "tvqc") {
    g.hp.frequency.value = 80;
    g.low.frequency.value = 120;
    g.low.gain.value = 1;
    g.mid.frequency.value = 350;
    g.mid.gain.value = -2;
    g.presence.frequency.value = 3000;
    g.presence.gain.value = 2.2;
    g.presence.Q.value = 0.8;
    g.deess.frequency.value = 7000;
    g.deess.gain.value = -3.5;
    g.deess.Q.value = 1.1;
    g.air.frequency.value = 11000;
    g.air.gain.value = 0.4;
    g.comp.threshold.value = -18;
    g.comp.ratio.value = 2;
    g.comp.attack.value = 0.012;
    g.comp.release.value = 0.22;
    return;
  }
  g.hp.frequency.value = loa === "LOA1" ? 75 : 32;
  g.low.frequency.value = 95;
  g.low.gain.value = loa === "LOA2" ? -1.5 : 2.8;
  g.mid.frequency.value = 340;
  g.mid.gain.value = -1.4;
  g.mid.Q.value = 0.8;
  g.presence.frequency.value = loa === "LOA1" ? 2500 : 3200;
  g.presence.gain.value = loa === "LOA1" ? 4 : loa === "LOA2" ? 1.4 : 2.2;
  g.presence.Q.value = 0.85;
  g.deess.frequency.value = 6800;
  g.deess.gain.value = -1.2;
  g.deess.Q.value = 0.8;
  g.air.frequency.value = 10500;
  g.air.gain.value = loa === "LOA2" ? 2.8 : 1.4;
  g.comp.threshold.value = -18;
  g.comp.ratio.value = 2.8;
  g.comp.attack.value = 0.01;
  g.comp.release.value = 0.24;
}

export function usePreview(audioRef: RefObject<HTMLAudioElement | null>) {
  const graph = useRef<Graph | null>(null);
  const loaRef = useRef<LoaId>("LOA3");
  const dspRef = useRef<DspId>("music");
  const gainRef = useRef(0.86);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [level, setLevel] = useState(0);
  const [loa, setLoaState] = useState<LoaId>("LOA3");
  const [dsp, setDspState] = useState<DspId>("music");
  const [gain, setGainState] = useState(0.86);

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
      lim.attack.value = 0.003;
      lim.release.value = 0.08;
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
        analyser,
      };
    }
    shape(graph.current, loaRef.current, dspRef.current, gainRef.current);
    if (graph.current.ctx.state !== "running") await graph.current.ctx.resume();
    return graph.current;
  };

  useEffect(() => {
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

  const load = (url: string) => {
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

  const scrub = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(0.999, ratio)) * audio.duration;
    setTime(audio.currentTime);
  };

  const setLoa = (next: LoaId) => {
    loaRef.current = next;
    setLoaState(next);
    if (graph.current) shape(graph.current, next, dspRef.current, gainRef.current);
  };

  const setDsp = (next: DspId) => {
    dspRef.current = next;
    setDspState(next);
    if (graph.current) shape(graph.current, loaRef.current, next, gainRef.current);
  };

  const setGain = (next: number) => {
    const value = Math.max(0, Math.min(1, next));
    gainRef.current = value;
    setGainState(value);
    if (graph.current) shape(graph.current, loaRef.current, dspRef.current, value);
  };

  return { playing, time, duration, level, loa, dsp, gain, load, toggle, pause, scrub, setLoa, setDsp, setGain, ensure };
}
