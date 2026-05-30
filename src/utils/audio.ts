/**
 * Web Audio API Sound Synthesizer for Trading Ride Game
 * Highly polished zero-dependency browser-native synthesized SFX.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Standard AudioContext initialization with browser compatibility
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  
  // Resume context if suspended (common in browsers that block autoplay)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(console.warn);
  }
  
  return audioCtx;
}

// Global mute state helper matching local storage or store
export function isSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem('trading_game_sound_enabled');
    return stored !== 'false'; // default to true
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem('trading_game_sound_enabled', String(enabled));
  } catch (err) {
    console.error(err);
  }
}

/**
 * Play a double-chirp Retro Coin Sound
 */
export function playCoinSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(587.33, now); // D5
  osc1.frequency.setValueAtTime(880, now + 0.08); // A5 jump
  
  gain1.gain.setValueAtTime(0.08, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  
  osc1.start(now);
  osc1.stop(now + 0.18);
}

/**
 * Play a futuristic rising liquid / balloon bubble for Fuel Collection
 */
export function playFuelSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.3;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  // Sweep frequency from 180Hz up to 720Hz
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(720, now + duration);
  
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Play a low and crunchy explosion / crash sound
 */
export function playCrashSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.45;

  // 1. Noise Generator for crunchy debris effect
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Populate random values for white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Lowpass filter to make the noise rumble/crunchy instead of high hiss
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.exponentialRampToValueAtTime(20, now + duration);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.25, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // 2. Heavy Sub Bass pitch sweep for physical thud impact
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sawtooth';
  subOsc.frequency.setValueAtTime(110, now);
  subOsc.frequency.exponentialRampToValueAtTime(10, now + duration);

  subGain.gain.setValueAtTime(0.2, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration - 0.05);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + duration);
  
  subOsc.start(now);
  subOsc.stop(now + duration);
}

/**
 * Play an upward springy spring / jump sound
 */
export function playJumpSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.22;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(680, now + duration);
  
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Play a rich triumphant multi-step arpeggio / success fanfare on checkpoint passed
 */
export function playCheckpointSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Note intervals (arpeggio sequence: C5 -> E5 -> G5 -> C6)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  const itemDelay = 0.07; // duration between note hits

  notes.forEach((freq, idx) => {
    const scoreOsc = ctx.createOscillator();
    const scoreGain = ctx.createGain();
    
    scoreOsc.type = idx === notes.length - 1 ? 'sine' : 'triangle';
    scoreOsc.frequency.setValueAtTime(freq, now + idx * itemDelay);
    
    scoreGain.gain.setValueAtTime(0, now);
    scoreGain.gain.setValueAtTime(0.1, now + idx * itemDelay);
    scoreGain.gain.exponentialRampToValueAtTime(0.001, now + idx * itemDelay + 0.3);
    
    scoreOsc.connect(scoreGain);
    scoreGain.connect(ctx.destination);
    
    scoreOsc.start(now + idx * itemDelay);
    scoreOsc.stop(now + idx * itemDelay + 0.35);
  });
}

/**
 * Play a start motor / engine vroom sound when the game resets or starts
 */
export function playVroomSFX() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(30, now);
  osc.frequency.linearRampToValueAtTime(140, now + 0.2);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.55);
  
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.55);
}
