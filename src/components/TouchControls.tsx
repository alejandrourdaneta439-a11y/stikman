import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Crosshair, Shield } from 'lucide-react';
import { EMOTE_LIST } from '../game/characters';
import { TouchControlScale } from '../game/profileStore';
import { EmoteId, HudSnapshot } from '../game/types';

export type TouchActionKey = 'left' | 'right' | 'jump' | 'attack' | 'special';

interface TouchControlsProps {
  hud: HudSnapshot;
  docked: boolean;
  touchScale?: TouchControlScale;
  onTouchState: (playerId: 1 | 2, key: TouchActionKey, pressed: boolean) => void;
  onEmote: (playerId: 1 | 2, emoteId: EmoteId) => void;
}

export function TouchControls({
  hud,
  docked,
  touchScale = 'normal',
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

  const singleMode = hud.playerCount === 1 || hud.isOnline;
  const activeSingleId: 1 | 2 =
    hud.isOnline && hud.localPlayerId ? hud.localPlayerId : 1;

  const singleSize =
    touchScale === 'compact'
      ? 'w-12 h-12'
      : touchScale === 'large'
      ? 'w-16 h-16'
      : 'w-14 h-14';
  const dualSize =
    touchScale === 'compact'
      ? 'w-10 h-10 sm:w-12 sm:h-12'
      : touchScale === 'large'
      ? 'w-12 h-12 sm:w-15 sm:h-15'
      : 'w-11 h-11 sm:w-14 sm:h-14';

  // Organized 1-Player OR Online PvP Mobile Layout
  if (singleMode) {
    const pInfo = activeSingleId === 1 ? hud.p1 : hud.p2;
    const specialReady = pInfo.specialReadyRatio >= 1;
    const accentBorder =
      activeSingleId === 1 ? 'border-sky-400/45' : 'border-rose-400/45';

    return (
      <div
        className={
          docked
            ? 'w-full px-2.5 pt-1.5 pb-[max(4.5rem,10dvh)] bg-[#0e1113] border-t border-white/10 shrink-0'
            : 'pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 z-20 px-3 sm:px-5 flex flex-col gap-2'
        }
      >
        <div
          className={
            docked
              ? 'w-full bg-[#12161a] border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2'
              : 'w-full flex flex-col gap-2'
          }
        >
          {/* Cleanly centered signal bar for 1P / Online */}
          <div className="pointer-events-auto mx-auto flex items-center gap-1.5 bg-[#0e1113]/80 border border-white/10 rounded-lg px-2 py-1">
          <span
            className={`text-[10px] font-mono-num font-bold pr-1 ${
              activeSingleId === 1 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            J{activeSingleId}
          </span>
          {EMOTE_LIST.map((em) => (
            <button
              key={em.id}
              type="button"
              onClick={() => onEmote(activeSingleId, em.id)}
              title={em.label}
              className="touch-pad-btn min-w-[34px] min-h-[28px] px-2 rounded bg-[#1c2228] border border-white/10 text-[10px] font-mono-num font-bold hover:bg-[#262f37] active:scale-95 cursor-pointer"
              style={{ color: em.color }}
            >
              {em.symbol}
            </button>
          ))}
        </div>

        <div className="w-full flex items-end justify-between gap-3">
          {/* Left Thumb: Move */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0e1113]/80 border border-white/10 rounded-xl p-2">
            <button
              type="button"
              aria-label="Mover izquierda"
              className={`touch-pad-btn ${singleSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border ${accentBorder} text-slate-100 flex items-center justify-center`}
              {...bindTouch(activeSingleId, 'left')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              aria-label="Mover derecha"
              className={`touch-pad-btn ${singleSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border ${accentBorder} text-slate-100 flex items-center justify-center`}
              {...bindTouch(activeSingleId, 'right')}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Right Thumb: Jump / Attack / Special */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#0e1113]/80 border border-white/10 rounded-xl p-2">
            <button
              type="button"
              aria-label="Saltar"
              className={`touch-pad-btn ${singleSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border border-white/15 text-slate-100 flex flex-col items-center justify-center`}
              {...bindTouch(activeSingleId, 'jump')}
            >
              <ArrowUp className="w-5 h-5" />
              <span className="text-[9px] leading-none mt-0.5">SALTO</span>
            </button>
            <button
              type="button"
              aria-label="Atacar"
              className={`touch-pad-btn ${singleSize} rounded-xl bg-amber-500/95 active:bg-amber-400 text-slate-950 font-display font-bold flex flex-col items-center justify-center`}
              {...bindTouch(activeSingleId, 'attack')}
            >
              <Crosshair className="w-5 h-5" />
              <span className="text-[9px] leading-none mt-0.5">ATQ</span>
            </button>
            <button
              type="button"
              aria-label="Habilidad especial"
              className={`touch-pad-btn ${singleSize} rounded-xl border font-display font-bold flex flex-col items-center justify-center transition-colors ${
                specialReady
                  ? 'bg-emerald-500/95 active:bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-[#1b2128] text-slate-400 border-white/10'
              }`}
              {...bindTouch(activeSingleId, 'special')}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[9px] font-mono-num leading-none mt-0.5">
                {specialReady ? 'HAB' : `${pInfo.specialCooldownSec}s`}
              </span>
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Dual-Player Side-by-Side Mobile Controls (2P Local)
  const renderPlayerPad = (playerId: 1 | 2) => {
    const isP1 = playerId === 1;
    const pInfo = isP1 ? hud.p1 : hud.p2;
    const ringColor = isP1 ? 'border-sky-400/45' : 'border-rose-400/45';
    const specialReady = pInfo.specialReadyRatio >= 1;

    return (
      <div
        className={`pointer-events-auto flex flex-col gap-1.5 ${
          docked
            ? 'flex-1 min-w-0 bg-[#12161a] border border-white/10 rounded-xl p-1.5 sm:p-2.5'
            : 'bg-[#0e1113]/75 border border-white/10 rounded-xl p-2'
        }`}
      >
        {/* Row 1: Evenly spaced 5-column signals strip */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-mono-num font-bold shrink-0 ${
              isP1 ? 'text-sky-400' : 'text-rose-400'
            }`}
          >
            J{playerId}
          </span>
          <div className="grid grid-cols-5 gap-1 flex-1 min-w-0">
            {EMOTE_LIST.map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => onEmote(playerId, em.id)}
                title={em.label}
                className="touch-pad-btn min-h-[26px] px-1 rounded bg-[#1c2228] border border-white/10 text-[9px] sm:text-[10px] font-mono-num font-bold hover:bg-[#262f37] active:scale-95 cursor-pointer truncate"
                style={{ color: em.color }}
              >
                {em.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Movement Left + Action Cluster Right */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Jugador ${playerId} izquierda`}
              className={`touch-pad-btn ${dualSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border ${ringColor} text-slate-100 flex items-center justify-center`}
              {...bindTouch(playerId, 'left')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} derecha`}
              className={`touch-pad-btn ${dualSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border ${ringColor} text-slate-100 flex items-center justify-center`}
              {...bindTouch(playerId, 'right')}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={`Jugador ${playerId} saltar`}
              className={`touch-pad-btn ${dualSize} rounded-xl bg-[#1b2128] active:bg-slate-600 border border-white/15 text-slate-100 flex flex-col items-center justify-center`}
              {...bindTouch(playerId, 'jump')}
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-[8px] leading-none mt-0.5">SAL</span>
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} atacar`}
              className={`touch-pad-btn ${dualSize} rounded-xl bg-amber-500/95 active:bg-amber-400 text-slate-950 font-display font-bold flex flex-col items-center justify-center`}
              {...bindTouch(playerId, 'attack')}
            >
              <Crosshair className="w-4 h-4" />
              <span className="text-[8px] leading-none mt-0.5">ATQ</span>
            </button>
            <button
              type="button"
              aria-label={`Jugador ${playerId} habilidad especial`}
              className={`touch-pad-btn ${dualSize} rounded-xl border font-display font-bold flex flex-col items-center justify-center transition-colors ${
                specialReady
                  ? 'bg-emerald-500/95 active:bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-[#1b2128] text-slate-400 border-white/10'
              }`}
              {...bindTouch(playerId, 'special')}
            >
              <Shield className="w-4 h-4" />
              <span className="text-[8px] font-mono-num leading-none mt-0.5">
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
      <div className="w-full px-1.5 pt-1.5 pb-[max(4.5rem,10dvh)] grid grid-cols-2 gap-1.5 shrink-0 bg-[#0e1113] border-t border-white/10">
        {renderPlayerPad(1)}
        {renderPlayerPad(2)}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 sm:bottom-8 z-20 px-2 sm:px-4 flex items-end justify-between gap-3">
      {renderPlayerPad(1)}
      {renderPlayerPad(2)}
    </div>
  );
}
