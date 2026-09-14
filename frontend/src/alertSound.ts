// Plays a short two-note chime using the Web Audio API — no audio file needed.
// Browsers block audio until the page has seen a user gesture, so this is a
// best-effort: callers should also show a visible alert regardless.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

export function playReadyChime() {
  const audioCtx = getContext();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  const notes = [880, 1174.66, 880]; // A5, D6, A5 — a bright, attention-grabbing ding
  let t = audioCtx.currentTime;
  for (const freq of notes) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
    t += 0.22;
  }
}

// Call once from a real click/tap to unlock audio playback for the rest of the session.
export function unlockAudio() {
  const audioCtx = getContext();
  if (audioCtx?.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}
