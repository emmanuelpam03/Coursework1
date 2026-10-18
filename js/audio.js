// Creates simple sound effects with the browser Web Audio API.
export class AudioManager {
  // Load saved audio settings.
  constructor(settings = {}) {
    this.context = null;
    this.muted = settings.muted || false;
    this.masterVolume = settings.masterVolume || 0.08;
    this.effectsVolume = settings.effectsVolume || 0.08;
    this.musicVolume = settings.musicVolume || 0.05;
  }

  // Ask the browser to allow audio after user interaction.
  unlock() {
    if (!this.context) {
      const AudioContextClass =
        window.AudioContext || window.AudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
    }
    if (this.context.state === "suspended") this.context.resume();
  }

  // Turn all sounds on or off.
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Play one short tone.
  playTone(frequency, duration, type = "sine", volume = 1) {
    if (this.muted || !this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(
      this.masterVolume * this.effectsVolume * volume,
      now,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Update volume settings.
  setVolumes(settings = {}) {
    const { masterVolume, effectsVolume, musicVolume } = settings;
    if (masterVolume !== undefined) this.masterVolume = Number(masterVolume);
    if (effectsVolume !== undefined) this.effectsVolume = Number(effectsVolume);
    if (musicVolume !== undefined) this.musicVolume = Number(musicVolume);
  }

  // Sound used when firing.
  fire() {
    this.playTone(420, 0.07, "square", 0.5);
  }

  // Sound used when an enemy is hit.
  hit() {
    this.playTone(110, 0.12, "sawtooth", 0.8);
  }

  // Sound used when the player takes damage.
  damage() {
    this.playTone(75, 0.22, "sawtooth", 1);
  }

  // Short sound used between waves.
  waveComplete() {
    this.playTone(520, 0.12, "triangle", 0.8);
    window.setTimeout(() => this.playTone(780, 0.16, "triangle", 0.7), 100);
  }

  // Longer sound used after the final wave.
  gameComplete() {
    this.playTone(520, 0.14, "triangle", 0.8);
    window.setTimeout(() => this.playTone(660, 0.14, "triangle", 0.8), 120);
    window.setTimeout(() => this.playTone(880, 0.24, "triangle", 0.8), 240);
  }
}
