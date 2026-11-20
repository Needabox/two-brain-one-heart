let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  delaySec: number = 0,
  type: OscillatorType = 'sine',
  gainPeak: number = 0.08,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.02);
}

export type SoundCue = 'tap' | 'success' | 'error' | 'win' | 'hint';

export function playCozySound(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return;
  try {
    switch (cue) {
      case 'tap':
        playTone(587.33, 0.09, 0, 'triangle', 0.05);
        break;
      case 'success':
        playTone(523.25, 0.14, 0, 'sine', 0.07);
        playTone(659.25, 0.18, 0.08, 'sine', 0.07);
        break;
      case 'error':
        playTone(311.13, 0.16, 0, 'triangle', 0.06);
        playTone(261.63, 0.2, 0.1, 'triangle', 0.06);
        break;
      case 'hint':
        playTone(698.46, 0.14, 0, 'sine', 0.06);
        playTone(880, 0.18, 0.09, 'sine', 0.06);
        break;
      case 'win':
        playTone(523.25, 0.16, 0, 'sine', 0.08);
        playTone(659.25, 0.16, 0.09, 'sine', 0.08);
        playTone(783.99, 0.18, 0.18, 'sine', 0.08);
        playTone(1046.5, 0.34, 0.28, 'sine', 0.08);
        break;
    }
  } catch {
    // Never fail gameplay on audio error
  }
}
