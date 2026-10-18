/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Bongo Cat Audio Service
 * Low-latency audio player for all instruments from bongo.cat
 */

class BongoAudioService {
  private audioCache: Map<string, HTMLAudioElement[]> = new Map();
  private volume: number = 1.0; // 100% full volume by default
  private muted: boolean = false;
  private maxPoolSize: number = 5;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('hustflow_bongo_muted');
      if (savedMuted !== null) {
        this.muted = savedMuted === 'true';
      }
      const savedVolume = localStorage.getItem('hustflow_bongo_volume');
      if (savedVolume !== null) {
        const v = parseFloat(savedVolume);
        // If user was stuck with the old quiet 0.4 default, bump to 1.0
        this.volume = isNaN(v) || v < 0.8 ? 1.0 : Math.min(1.0, v);
      } else {
        this.volume = 1.0;
      }
      localStorage.setItem('hustflow_bongo_volume', this.volume.toString());
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hustflow_bongo_muted', muted ? 'true' : 'false');
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('hustflow_bongo_volume', this.volume.toString());
    }
    // Update existing audio instances
    this.audioCache.forEach(pool => {
      pool.forEach(audio => {
        audio.volume = this.volume;
      });
    });
  }

  public getVolume(): number {
    return this.volume;
  }

  private playSound(filename: string) {
    if (this.muted || typeof window === 'undefined') return;

    try {
      const path = `/bongo-cat/sounds/${filename}`;
      let pool = this.audioCache.get(path);

      if (!pool) {
        pool = [];
        this.audioCache.set(path, pool);
      }

      // Find an idle audio element or create a new one
      let audio = pool.find(a => a.paused || a.ended);
      if (!audio) {
        if (pool.length < this.maxPoolSize) {
          audio = new Audio(path);
          pool.push(audio);
        } else {
          audio = pool[0];
        }
      }

      audio.volume = this.volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // ignore browser autoplay restriction
      });
    } catch {
      // ignore
    }
  }

  public playBongo(note: 0 | 1) {
    this.playSound(`bongo${note}.mp3`);
  }

  public playKeyboard(note: number) {
    const safeNote = Math.max(0, Math.min(9, note % 10));
    this.playSound(`keyboard${safeNote}.mp3`);
  }

  public playMarimba(note: number) {
    const safeNote = Math.max(0, Math.min(9, note % 10));
    this.playSound(`marimba${safeNote}.mp3`);
  }

  public playCymbal() {
    this.playSound('cymbal.mp3');
  }

  public playCowbell() {
    this.playSound('cowbell.mp3');
  }

  public playTambourine() {
    this.playSound('tambourine.mp3');
  }

  public playBeat() {
    this.playBongo(0);
  }
}

export const bongoAudio = new BongoAudioService();
