export interface MusicTrack {
  id: string;
  name: string;
  url: string;
  typeLabel: string;
}

export interface MusicPlayerSnapshot {
  tracks: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  currentTime: number;
  duration: number;
}

class MobileMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private tracks: MusicTrack[] = [];
  private currentIndex = -1;
  private isPlaying = false;
  private volume = 0.65;
  private loop = true;
  private listeners = new Set<(snap: MusicPlayerSnapshot) => void>();

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.volume = this.volume;
      this.audio.addEventListener('ended', () => {
        if (this.loop && this.tracks.length === 1) {
          this.audio!.currentTime = 0;
          this.audio!.play().catch(() => {});
          return;
        }
        if (this.tracks.length > 0) {
          const nextIdx = (this.currentIndex + 1) % this.tracks.length;
          if (!this.loop && nextIdx === 0) {
            this.isPlaying = false;
            this.emit();
          } else {
            this.playIndex(nextIdx);
          }
        }
      });
      this.audio.addEventListener('timeupdate', () => {
        this.emit();
      });
      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.emit();
      });
      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.emit();
      });
    }
    return this.audio;
  }

  public getSnapshot(): MusicPlayerSnapshot {
    return {
      tracks: [...this.tracks],
      currentIndex: this.currentIndex,
      isPlaying: this.isPlaying,
      volume: this.volume,
      loop: this.loop,
      currentTime: this.audio?.currentTime ?? 0,
      duration:
        this.audio && Number.isFinite(this.audio.duration)
          ? this.audio.duration
          : 0,
    };
  }

  public subscribe(listener: (snap: MusicPlayerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snap = this.getSnapshot();
    for (const l of this.listeners) {
      l(snap);
    }
  }

  public addFiles(files: FileList | File[]): void {
    const list = Array.from(files);
    if (list.length === 0) return;

    const firstNewIdx = this.tracks.length;
    for (const file of list) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'Pista de audio';
      const ext = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';
      const url = URL.createObjectURL(file);
      this.tracks.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanName,
        url,
        typeLabel: ext,
      });
    }

    if (this.currentIndex === -1 || !this.isPlaying) {
      this.playIndex(firstNewIdx);
    } else {
      this.emit();
    }
  }

  public playIndex(index: number): void {
    if (index < 0 || index >= this.tracks.length) return;
    const audio = this.ensureAudio();
    if (!audio) return;
    this.currentIndex = index;
    audio.src = this.tracks[index].url;
    audio.volume = this.volume;
    audio.play().catch(() => {});
    this.emit();
  }

  public togglePlay(): void {
    const audio = this.ensureAudio();
    if (!audio || this.tracks.length === 0) return;
    if (this.currentIndex === -1) {
      this.playIndex(0);
      return;
    }
    if (this.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  public next(): void {
    if (this.tracks.length === 0) return;
    this.playIndex((this.currentIndex + 1) % this.tracks.length);
  }

  public prev(): void {
    if (this.tracks.length === 0) return;
    this.playIndex(
      (this.currentIndex - 1 + this.tracks.length) % this.tracks.length
    );
  }

  public removeTrack(index: number): void {
    if (index < 0 || index >= this.tracks.length) return;
    const removed = this.tracks[index];
    URL.revokeObjectURL(removed.url);
    this.tracks.splice(index, 1);

    if (this.tracks.length === 0) {
      this.audio?.pause();
      if (this.audio) this.audio.src = '';
      this.currentIndex = -1;
      this.isPlaying = false;
    } else if (index === this.currentIndex) {
      const nextIdx = index % this.tracks.length;
      this.playIndex(nextIdx);
      return;
    } else if (index < this.currentIndex) {
      this.currentIndex -= 1;
    }
    this.emit();
  }

  public setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.emit();
  }

  public setLoop(loop: boolean): void {
    this.loop = loop;
    this.emit();
  }
}

export const musicPlayer = new MobileMusicPlayer();
