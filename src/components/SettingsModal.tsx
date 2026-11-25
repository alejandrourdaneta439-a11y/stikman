import { useState } from 'react';
import {
  Check,
  Music,
  RotateCcw,
  Save,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { TouchControlScale } from '../game/profileStore';

interface SettingsModalProps {
  p1Name: string;
  p2Name: string;
  muted: boolean;
  showTouch: boolean;
  touchScale: TouchControlScale;
  screenShake: boolean;
  musicVolume: number;
  onChangeP1Name: (name: string) => void;
  onChangeP2Name: (name: string) => void;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  onChangeTouchScale: (scale: TouchControlScale) => void;
  onToggleScreenShake: () => void;
  onChangeMusicVolume: (v: number) => void;
  onOpenMusic: () => void;
  onSaveChanges: () => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

export function SettingsModal({
  p1Name,
  p2Name,
  muted,
  showTouch,
  touchScale,
  screenShake,
  musicVolume,
  onChangeP1Name,
  onChangeP2Name,
  onToggleMute,
  onToggleTouch,
  onChangeTouchScale,
  onToggleScreenShake,
  onChangeMusicVolume,
  onOpenMusic,
  onSaveChanges,
  onResetDefaults,
  onClose,
}: SettingsModalProps) {
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = () => {
    onSaveChanges();
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-[#14191d] border border-white/15 rounded-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="font-display text-xl font-bold text-slate-100 tracking-wide">
              CONFIGURACIONES
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuraciones"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#1e262d] text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nombres de Personajes */}
        <div className="space-y-2">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            Nombres de Personajes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-sky-400">
                Nombre Jugador 1
              </span>
              <input
                type="text"
                maxLength={18}
                value={p1Name}
                onChange={(e) => onChangeP1Name(e.target.value)}
                placeholder="Superviviente 1"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0e1113] border border-white/15 focus:border-sky-400 outline-none text-sm text-slate-100"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-rose-400">
                Nombre Jugador 2
              </span>
              <input
                type="text"
                maxLength={18}
                value={p2Name}
                onChange={(e) => onChangeP2Name(e.target.value)}
                placeholder="Superviviente 2"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg bg-[#0e1113] border border-white/15 focus:border-rose-400 outline-none text-sm text-slate-100"
              />
            </label>
          </div>
        </div>

        {/* Audio & Música */}
        <div className="space-y-2.5 pt-1 border-t border-white/10">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            Audio y Música del Celular
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[42px] px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                !muted
                  ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                  : 'bg-[#0e1113] border-white/10 text-slate-400'
              }`}
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {muted ? 'Efectos: Silencio' : 'Efectos: Activos'}
            </button>

            <button
              type="button"
              onClick={onOpenMusic}
              className="min-h-[42px] px-3 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Music className="w-4 h-4" />
              Elegir Música
            </button>
          </div>

          <div className="flex items-center gap-2.5 bg-[#0e1113] border border-white/10 rounded-lg px-3 py-2">
            <span className="text-xs text-slate-300 whitespace-nowrap">
              Volumen Música
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={(e) => onChangeMusicVolume(Number(e.target.value) / 100)}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
            <span className="text-xs font-mono-num text-slate-300 w-9 text-right">
              {Math.round(musicVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Controles y Pantalla */}
        <div className="space-y-2.5 pt-1 border-t border-white/10">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-amber-400">
            Controles y Pantalla
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleTouch}
              className={`min-h-[42px] px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                showTouch
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#0e1113] border-white/10 text-slate-400'
              }`}
            >
              Táctil: {showTouch ? 'Visible' : 'Oculto'}
            </button>

            <button
              type="button"
              onClick={onToggleScreenShake}
              className={`min-h-[42px] px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                screenShake
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-[#0e1113] border-white/10 text-slate-400'
              }`}
            >
              Sacudida: {screenShake ? 'Sí' : 'No'}
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-slate-400">
              Tamaño de botones táctiles
            </span>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#0b0e11] border border-white/10">
              {(
                [
                  { id: 'compact', label: 'Compacto' },
                  { id: 'normal', label: 'Estándar' },
                  { id: 'large', label: 'Grande' },
                ] as { id: TouchControlScale; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeTouchScale(opt.id)}
                  className={`min-h-[36px] rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    touchScale === opt.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onResetDefaults}
            className="min-h-[44px] px-3.5 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[44px] px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display text-base font-bold tracking-wide inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {savedFeedback ? (
              <>
                <Check className="w-4 h-4" />
                ¡Cambios Guardados!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
