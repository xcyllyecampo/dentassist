let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', rampTo = null) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (rampTo) osc.frequency.exponentialRampToValueAtTime(rampTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export function playClick() {
  playTone(800, 0.05, 'sine');
}

export function playSuccess() {
  playTone(523, 0.1, 'sine');
  setTimeout(() => playTone(659, 0.1, 'sine'), 80);
  setTimeout(() => playTone(784, 0.15, 'sine'), 160);
}

export function playError() {
  playTone(400, 0.15, 'square', 200);
}

export function playNotification() {
  playTone(659, 0.12, 'sine');
  setTimeout(() => playTone(880, 0.18, 'sine'), 120);
}

export function playWhoosh() {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.15);
    filter.Q.value = 1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch (e) {}
}

export function playHover() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

export function playCallPatient() {
  playTone(523, 0.12, 'sine');
  setTimeout(() => playTone(659, 0.12, 'sine'), 100);
  setTimeout(() => playTone(784, 0.12, 'sine'), 200);
  setTimeout(() => playTone(1047, 0.2, 'sine'), 300);
}
