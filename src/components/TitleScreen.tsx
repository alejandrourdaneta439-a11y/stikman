import { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { GameMode, PlayerCount } from '../game/types';

interface TitleScreenProps {
  mode: GameMode;
  playerCount: PlayerCount;
  onSelectMode: (mode: GameMode) => void;
  onSelectPlayerCount: (count: PlayerCount) => void;
  onStart: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function TitleScreen({
  mode,
  playerCount,
  onSelectMode,
  onSelectPlayerCount,
  onStart,
  muted,
  onToggleMute,
}: TitleScreenProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onStart]);

  return (
    <div className="relative w-full h-[100dvh] bg-[#0e1113] overflow-hidden flex flex-col justify-between">
      {/* Wasteland Key Art Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#171c20] via-[#1c1a16] to-[#0e1113]">
        <img
          src="/src/assets/images/nuclear_wasteland_title_1795478158655.jpg"
          alt="Paisaje nuclear post-apocalíptico con supervivientes stickman"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-right opacity-85"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, #0e1113 0%, rgba(14,17,19,0.95) 38%, rgba(14,17,19,0.55) 68%, rgba(14,17,19,0.25) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(14,17,19,0.5) 0%, transparent 25%, transparent 72%, rgba(14,17,19,0.92) 100%)',
          }}
        />
      </div>

      {/* Top minimal audio toggle */}
      <div className="relative z-10 flex items-center justify-end p-4 sm:p-6">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#171c20]/85 border border-white/10 text-slate-200 hover:bg-[#242b30] transition-colors cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Left-aligned Title Lockup */}
      <div className="relative z-10 flex-1 flex items-center px-6 sm:px-12 lg:px-16">
        <div className="max-w-xl w-full space-y-5">
          {/* Bespoke SVG Title Lockup */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
                <circle cx="22" cy="22" r="4" fill="#F59E0B" />
                <path
                  d="M22 15 L15 7.5 A14 14 0 0 1 29 7.5 Z"
                  fill="#F59E0B"
                />
                <path
                  d="M16 25.5 L7.5 29 A14 14 0 0 1 13.5 17 Z"
                  fill="#F59E0B"
                />
                <path
                  d="M28 25.5 L30.5 17 A14 14 0 0 1 36.5 29 Z"
                  fill="#F59E0B"
                />
              </svg>
              <span className="text-xs font-mono-num tracking-widest text-amber-400">
                SUPERVIVENCIA NUCLEAR · {playerCount === 1 ? '1 JUGADOR' : '2 JUGADORES'}
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-slate-100 leading-[0.95] text-balance">
              REFUGIO CERO
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
              Recolecta metal, madera y circuitos, construye refugios contra la
              lluvia radiactiva y resiste las oleadas mutantes en solitario o
              con un compañero en el mismo celular.
            </p>
          </div>

          {/* Player Count + Mode Selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex p-1 rounded-lg bg-[#171c20]/90 border border-white/10">
              <button
                type="button"
                onClick={() => onSelectPlayerCount(1)}
                className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  playerCount === 1
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1 Jugador
              </button>
              <button
                type="button"
                onClick={() => onSelectPlayerCount(2)}
                className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  playerCount === 2
                    ? 'bg-sky-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2 Jugadores
              </button>
            </div>

            <div className="inline-flex p-1 rounded-lg bg-[#171c20]/90 border border-white/10">
              <button
                type="button"
                onClick={() => onSelectMode('COOP')}
                className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'COOP'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {playerCount === 1 ? 'Supervivencia · Oleadas' : 'Cooperativo · Oleadas'}
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('PVP')}
                className={`min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'PVP'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {playerCount === 1 ? 'Duelo · vs Bot IA' : 'Duelo · PvP'}
              </button>
            </div>
          </div>

          {/* Primary Start CTA */}
          <div>
            <button
              type="button"
              onClick={onStart}
              className="min-h-[52px] px-8 py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-display text-xl font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap"
            >
              Elegir Personajes
            </button>
          </div>
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div className="relative z-10 px-6 sm:px-12 lg:px-16 pb-4 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono-num">
        <span>
          J1: A D Mover · W Saltar · F Atacar · G Habilidad
          {playerCount === 2 && (
            <>
              <span className="mx-2 text-slate-600">|</span>
              J2: ◀ ▶ Mover · ▲ Saltar · K Atacar · L Habilidad
            </>
          )}
        </span>
        <span className="text-amber-400/90">
          {playerCount === 1
            ? 'Controles táctiles ergonómicos para 1 jugador'
            : 'Controles táctiles duales integrados para celular'}
        </span>
      </div>
    </div>
  );
}
