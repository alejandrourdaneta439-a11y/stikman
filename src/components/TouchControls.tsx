import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Crosshair, Shield } from 'lucide-react';
import { EMOTE_LIST } from '../game/characters';
import { EmoteId, HudSnapshot } from '../game/types';

export type TouchActionKey = 'left' | 'right' | 'jump' | 'attack' | 'special';

interface TouchControlsProps {
  hud: HudSnapshot;
  docked: boolean;
  onTouchState: (playerId: 1 | 2, key: TouchActionKey, pressed: boolean) => void;
  onEmote: (playerId: 1 | 2, emoteId: EmoteId) => void;
}

export function TouchControls({
  hud,
  docked,
  onTouchState,
  onEmote,
}: TouchControlsProps) {
  const activePointersRef = useRef<
    Map<number, { playerId: 1 | 2; key: TouchActionKey }>
  >(new Map());

  const bindTouch = (playerId: 1 | 2, key: TouchActionKey) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointersRef.current.set(e.pointerId, { playerId, key });
      onTouchState(playerId, key, true);
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const entry = activePointersRef.current.get(e.pointerId);
      if (entry) {
        activePointersRef.current.delete(e.pointerId);
        onTouchState(entry.playerId, entry.key, false);
      }
    },
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => {
      const entry = activePointersRef.current.get(e.pointerId);
      if (entry) {
        activePointersRef.current.delete(e.pointerId);
        onTouchState(entry.playerId, entry.key, false);
      }
    },
  });

  // Ergonomic Single-Player Mobile Controls (Left thumb: Move + Emotes, Right thumb: Jump + Attack + Special)
  if (hud.playerCount === 1) {
    const p1 = hud.p1;
    const specialReady = p1.specialReadyRatio >= 1;

    return (
      <div
        className={
          docked
            ? 'w-full px-3 pb-3 pt-2 bg-[#12161a] border-t border-white/10 shrink-0 flex flex-col gap-2'
            : 'pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 flex items-end justify-between gap-4'
        }
      >
        {docked && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono-num font-bold text-sky-400">
              J1 SEÑALES
            </span>
            <div className="flex items-center gap-1.5">
              {EMOTE_LIST.map((em) => (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => onEmote(1, em.id)}
                  title={em.label}
                  className="touch-pad-btn min-w-[36px] min-h-[30px] px-2 rounded bg-[#1c2228] border border-white/10 text-[10px] font-mono-num font-bold hover:bg-[#262f37] active:scale-95 cursor-pointer"
                  style={{ color: em.color }}
                >
                  {em.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full flex items-end justify-between gap-3">
          {/* Left Thumb: Move */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0e1113]/75 border border-white/10 rounded-xl p-2">
            <button
              type="button"
              aria-label="Mover izquierda"
              className="touch-pad-btn w-14 h-14 rounded-xl bg-[#1b2128] active:bg-slate-600 border border-sky-400/40 text-slate-100 flex items-center justify-center"
              {...bindTouch(1, 'left')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Mover derecha"
              className="touch-pad-btn w-14 h-14 rounded-xl bg-[#1b2128] active:bg-slate-600 border border-sky-400/40 text-slate-100 flex items-center justify-center"
              {...bindTouch(1, 'right')}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Right Thumb: Jump / Attack / Special */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0e1113]/75 border border-white/10 rounded-xl p-2">
            <button
              type="button"
              aria-label="Saltar"
              className="touch-pad-btn w-14 h-14 rounded-xl bg-[#1b2128] active:bg-slate-600 border border-white/15 text-slate-100 flex flex-col items-center justify-center"
              {...bindTouch(1, 'jump')}
            >
              <ArrowUp className="w-5 h-5" />
              <span className="text-[9px] leading-none mt-0.5">SALTO</span>
            </button>
            <button
              type="button"
              aria-label="Atacar"
              className="touch-pad-btn w-14 h-14 rounded-xl bg-amber-500/90 active:bg-amber-400 text-slate-950 font-display font-bold flex flex-col items-center justify-center"
              {...bindTouch(1, 'attack')}
            >
              <Crosshair className="w-5 h-5" />
              <span className="text-[9px] leading-none mt-0.5">ATQ</span>
            </button>
            <button
              type="button"
              aria-label="Habilidad especial"
              className={`touch-pad-btn w-14 h-14 rounded-xl border font-display font-bold flex flex-col items-center justify-center transition-colors ${
                specialReady
                  ? 'bg-emerald-500/90 active:bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-[#1b2128] text-slate-400 border-white/10'
              }`}
              {...bindTouch(1, 'special')}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-mono-num leading-none mt-0.5">
                {specialReady ? 'HAB' : `${p1.specialCooldownSec}s`}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dual-Player Mobile Controls (2P)
  const renderPlayerPad = (playerId: 1 | 2) => {
    const isP1 = playerId === 1;
    const pInfo = isP1 ? hud.p1 : hud.p2;
    const ringColor = isP1 ? 'border-sky-400/40' : 'border-rose-400/40';
    const specialReady = pInfo.specialReadyRatio >= 1;

    return (
      <div
        className={`pointer-events-auto flex flex-col gap-2 ${
          docked
            ? 'flex-1 bg-[#12161a] border border-white/10 rounded-xl p-2 sm:p-3'
            : 'bg-[#0e1113]/65 border border-white/10 rounded-xl p-2'
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-[10px] font-mono-num font-bold ${
              isP1 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            J{playerId} SEÑALES
          </span>
          <div className="flex items-center gap-1">
            {EMOTE_LIST.map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => onEmote(playerId, em.id)}
                title={em.label}
                className="touch-pad-btn min-w-[30px] min-h-[28px] px-1.5 rounded bg-[#1c2228] border border-white/10 text-[10px] font-mono-num font-bold hover:bg-[#262f37] active:scale-95 cursor-pointer"
                style={{ color: em.color }}
              >
                {em.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Jugador ${playerId} izquierda`}
              className={`touch-pad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1b2128] active:bg-slate-600 border ${ringColor} text-slate-100 flex items-center justify-center`}
              {...bindTouch(playerId, 'left')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} derecha`}
              className={`touch-pad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#1b2128] active:bg-slate-600 border ${ringColor} text-slate-100 flex items-center justify-center`}
              {...bindTouch(playerId, 'right')}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={`Jugador ${playerId} saltar`}
              className="touch-pad-btn w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-[#1b2128] active:bg-slate-600 border border-white/15 text-slate-100 flex flex-col items-center justify-center"
              {...bindTouch(playerId, 'jump')}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} atacar`}
              className="touch-pad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-500/90 active:bg-amber-400 text-slate-950 font-display font-bold flex flex-col items-center justify-center"
              {...bindTouch(playerId, 'attack')}
            >
              <Crosshair className="w-5 h-5" />
              <span className="text-[9px] leading-none mt-0.5">ATQ</span>
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} habilidad especial`}
              className={`touch-pad-btn w-12 h-12 sm:w-14 sm:h-14 rounded-xl border font-display font-bold flex flex-col items-center justify-center transition-colors ${
                specialReady
                  ? 'bg-emerald-500/90 active:bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-[#1b2128] text-slate-400 border-white/10'
              }`}
              {...bindTouch(playerId, 'special')}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-mono-num leading-none mt-0.5">
                {specialReady ? 'HAB' : `${pInfo.specialCooldownSec}s`}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (docked) {
    return (
      <div className="w-full px-2 pb-2 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0 bg-[#0e1113]">
        {renderPlayerPad(1)}
        {renderPlayerPad(2)}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2 sm:p-3 flex items-end justify-between gap-3">
      {renderPlayerPad(1)}
      {renderPlayerPad(2)}
    </div>
  );
}
