import { useEffect, useRef, useState } from 'react';
import {
  Music,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { musicPlayer, MusicPlayerSnapshot } from '../audio/musicPlayer';

interface MusicPanelProps {
  onClose: () => void;
  onVolumeChange?: (volume: number) => void;
  onLoopChange?: (loop: boolean) => void;
}

function formatSec(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function MusicPanel({
  onClose,
  onVolumeChange,
  onLoopChange,
}: MusicPanelProps) {
  const [snap, setSnap] = useState<MusicPlayerSnapshot>(() =>
    musicPlayer.getSnapshot()
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return musicPlayer.subscribe(setSnap);
  }, []);

  const activeTrack =
    snap.currentIndex >= 0 ? snap.tracks[snap.currentIndex] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#14191d] border border-amber-500/40 rounded-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="font-display text-xl font-bold text-slate-100 tracking-wide">
              MÚSICA DEL CELULAR
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reproductor de música"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#1e262d] text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              musicPlayer.addFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-base font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Elegir Canciones del Celular / PC
        </button>

        {/* Active track & controls */}
        <div className="bg-[#0e1113] border border-white/10 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">
                {activeTrack
                  ? activeTrack.name
                  : 'Ninguna canción seleccionada'}
              </p>
              <p className="text-[11px] font-mono-num text-slate-400">
                {activeTrack
                  ? `${formatSec(snap.currentTime)} / ${formatSec(snap.duration)}`
                  : 'Selecciona archivos MP3, M4A, WAV u OGG'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextLoop = !snap.loop;
                musicPlayer.setLoop(nextLoop);
                onLoopChange?.(nextLoop);
              }}
              aria-label="Alternar repetición"
              className={`min-w-[36px] min-h-[36px] px-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                snap.loop
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#171c20] border-white/10 text-slate-400'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={snap.tracks.length === 0}
              onClick={() => musicPlayer.prev()}
              aria-label="Canción anterior"
              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#1c2329] text-slate-200 hover:bg-[#273038] disabled:opacity-40 flex items-center justify-center cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={snap.tracks.length === 0}
              onClick={() => musicPlayer.togglePlay()}
              aria-label={snap.isPlaying ? 'Pausar música' : 'Reproducir música'}
              className="min-w-[54px] min-h-[48px] rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 disabled:opacity-40 flex items-center justify-center cursor-pointer"
            >
              {snap.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              disabled={snap.tracks.length === 0}
              onClick={() => musicPlayer.next()}
              aria-label="Siguiente canción"
              className="min-w-[44px] min-h-[44px] rounded-lg bg-[#1c2329] text-slate-200 hover:bg-[#273038] disabled:opacity-40 flex items-center justify-center cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(snap.volume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                musicPlayer.setVolume(v);
                onVolumeChange?.(v);
              }}
              aria-label="Volumen de música"
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="text-xs font-mono-num text-slate-300 w-9 text-right">
              {Math.round(snap.volume * 100)}%
            </span>
          </div>
        </div>

        {/* Playlist */}
        {snap.tracks.length > 0 && (
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
            {snap.tracks.map((track, idx) => {
              const active = idx === snap.currentIndex;
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border ${
                    active
                      ? 'bg-[#1e262d] border-amber-400/60 text-slate-100'
                      : 'bg-[#101417] border-white/5 text-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => musicPlayer.playIndex(idx)}
                    className="flex-1 min-w-0 text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-white/5 text-amber-400 shrink-0">
                      {track.typeLabel}
                    </span>
                    <span className="text-xs font-medium truncate">
                      {track.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => musicPlayer.removeTrack(idx)}
                    aria-label={`Quitar ${track.name}`}
                    className="min-w-[30px] min-h-[30px] flex items-center justify-center rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
