export function makeDemo(): { sampleRate: number; channels: Float32Array[] } {
  const sampleRate = 22050;
  const seconds = 24;
  const bpm = 120;
  const beat = 60 / bpm;
  const n = sampleRate * seconds;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const p = t / seconds;
    let amp = 0.5;
    if (p < 0.12) amp = 0.28;
    else if (p < 0.36) amp = 0.62;
    else if (p < 0.58) amp = 1;
    else if (p < 0.74) amp = 0.4;
    else if (p < 0.9) amp = 1;
    else amp = 0.26;
    const into = t % beat;
    const beatIndex = Math.floor(t / beat);
    const kick = Math.exp(-into * 26) * Math.sin(2 * Math.PI * (70 + 80 * Math.exp(-into * 10)) * into);
    const snareGate = beatIndex % 2 === 1 && into < 0.045 ? 1 - into / 0.045 : 0;
    const snare = snareGate * (((i * 37) % 97) / 97 - 0.5);
    const roots = [220, 220, 174.61, 196];
    const root = roots[beatIndex % 4] ?? 220;
    const bass = Math.sin(2 * Math.PI * root * t) * (0.35 + 0.65 * Math.exp(-into * 2.4));
    const mel = [440, 523.25, 659.25, 587.33];
    const f = mel[beatIndex % 4] ?? 440;
    const gate = into < beat * 0.82 ? Math.exp(-into * 1.5) : 0;
    const voice =
      gate *
      (Math.sin(2 * Math.PI * f * t) +
        0.22 * Math.sin(2 * Math.PI * f * 2 * t) +
        0.12 * Math.sin(2 * Math.PI * (f * 1.5) * t));
    const hat = into > beat * 0.48 && into < beat * 0.53 ? (((i * 13) % 50) / 50 - 0.5) * 0.35 : 0;
    x[i] = (kick * 0.85 + snare * 0.28 + bass * 0.42 + voice * 0.2 + hat) * amp;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(x[i] ?? 0));
  if (peak > 0) {
    for (let i = 0; i < n; i++) x[i] = ((x[i] ?? 0) / peak) * 0.9;
  }
  return { sampleRate, channels: [x] };
}
