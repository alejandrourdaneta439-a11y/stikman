import { useState } from 'react';
import { ArrowLeft, Check, Pencil, Save } from 'lucide-react';
import { CHARACTER_LIST } from '../game/characters';
import { CharacterClassId, GameMode, PlayerCount } from '../game/types';

interface CharacterSelectProps {
  mode: GameMode;
  playerCount: PlayerCount;
  p1Class: CharacterClassId;
  p2Class: CharacterClassId;
  p1Name: string;
  p2Name: string;
  onSelectPlayerCount: (count: PlayerCount) => void;
  onSelectP1: (id: CharacterClassId) => void;
  onSelectP2: (id: CharacterClassId) => void;
  onChangeP1Name: (name: string) => void;
  onChangeP2Name: (name: string) => void;
  onSaveProfile: () => void;
  onBack: () => void;
  onConfirm: () => void;
}

function AnimePortrait({
  classId,
  playerTagColor,
}: {
  classId: CharacterClassId;
  playerTagColor: string;
}) {
  return (
    <svg width="54" height="64" viewBox="0 0 54 64" fill="none" aria-hidden="true">
      {/* Head */}
      <circle cx="27" cy="18" r="8" fill="#f8fafc" />
      {/* Player tag band */}
      <rect x="18" y="6" width="18" height="2.4" rx="1" fill={playerTagColor} />

      {/* Anime Hair, Eyes & Class Gear */}
      {classId === 'medic' && (
        <>
          <path d="M18 17 A9 9 0 0 1 36 17 L34 12 L20 12 Z" fill="#10b981" />
          <path d="M18 16 L10 27 L16 29 L20 20 Z" fill="#059669" />
          <rect x="28" y="15.5" width="5.5" height="3.8" rx="0.8" fill="#0f172a" />
          <rect x="29.5" y="16.3" width="3" height="2.2" fill="#34d399" />
          <rect x="31" y="16.5" width="1.2" height="1.2" fill="#ffffff" />
          <path d="M24 28 L13 44 L23 42 Z" fill="#059669" />
        </>
      )}
      {classId === 'engineer' && (
        <>
          <path d="M18 15 A9.5 9.5 0 0 1 36 15 Z" fill="#f59e0b" />
          <rect x="16" y="14" width="22" height="3" rx="1" fill="#fbbf24" />
          <path d="M28 16 L36 19 L31 20 Z" fill="#b45309" />
          <rect x="28" y="17.5" width="5.5" height="3.2" fill="#0f172a" />
          <rect x="30" y="18.2" width="2.5" height="1.8" fill="#fbbf24" />
          <rect x="21" y="28" width="12" height="11" rx="2" fill="#d97706" />
        </>
      )}
      {classId === 'scout' && (
        <>
          <path
            d="M17 16 L12 8 L22 11 L27 5 L32 11 L39 11 L35 17 Z"
            fill="#9333ea"
          />
          <rect x="24" y="18" width="10" height="5.5" rx="1.5" fill="#1e293b" />
          <rect x="28.5" y="14.5" width="5.5" height="3" fill="#0f172a" />
          <rect x="30" y="15.1" width="2.8" height="1.8" fill="#d8b4fe" />
          <path d="M22 28 L10 34 L13 38 L23 31 Z" fill="#a855f7" />
        </>
      )}
      {classId === 'juggernaut' && (
        <>
          <rect x="18" y="10" width="18" height="10" rx="2" fill="#334155" />
          <path d="M31 10 L39 7 L35 15 Z" fill="#cbd5e1" />
          <rect x="27" y="15.5" width="7" height="3.5" fill="#0f172a" />
          <rect x="29" y="16.3" width="4" height="2" fill="#38bdf8" />
          <rect x="18" y="27" width="18" height="14" rx="2" fill="#475569" />
          <rect x="17" y="27" width="5" height="5" fill="#38bdf8" />
          <rect x="32" y="27" width="5" height="5" fill="#38bdf8" />
        </>
      )}

      {/* Body & Limbs */}
      <line
        x1="27"
        y1="26"
        x2="27"
        y2="44"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4.2 : 3.2}
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="44"
        x2="20"
        y2="58"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4.2 : 3.2}
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="44"
        x2="34"
        y2="58"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4.2 : 3.2}
        strokeLinecap="round"
      />
      <line
        x1="27"
        y1="30"
        x2="37"
        y2="34"
        stroke="#f8fafc"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {classId === 'juggernaut' ? (
        <>
          <line x1="35" y1="34" x2="43" y2="21" stroke="#94a3b8" strokeWidth="3.2" />
          <rect x="39" y="15" width="9" height="13" rx="1" fill="#e2e8f0" />
          <rect x="46" y="15" width="2.5" height="13" fill="#f59e0b" />
        </>
      ) : classId === 'scout' ? (
        <rect x="33" y="32" width="16" height="3.2" fill="#a855f7" />
      ) : classId === 'medic' ? (
        <rect x="34" y="32" width="11" height="4.2" fill="#10b981" />
      ) : (
        <rect x="33" y="32" width="13" height="4.8" fill="#f59e0b" />
      )}
    </svg>
  );
}

function StatDots({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="w-3 h-1.5 rounded-xs"
          style={{
            backgroundColor: n <= value ? color : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

export function CharacterSelect({
  mode,
  playerCount,
  p1Class,
  p2Class,
  p1Name,
  p2Name,
  onSelectPlayerCount,
  onSelectP1,
  onSelectP2,
  onChangeP1Name,
  onChangeP2Name,
  onSaveProfile,
  onBack,
  onConfirm,
}: CharacterSelectProps) {
  const [savedFeedback, setSavedFeedback] = useState(false);
  const showSecondColumn = playerCount === 2 || mode === 'PVP';

  const handleSave = () => {
    onSaveProfile();
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 2000);
  };

  const renderPickerColumn = (
    playerId: 1 | 2,
    selected: CharacterClassId,
    onSelect: (id: CharacterClassId) => void,
    customName: string,
    onChangeName: (val: string) => void,
    isBotColumn = false
  ) => {
    const isP1 = playerId === 1;
    const accent = isP1 ? '#38bdf8' : '#fb7185';
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#14191d] border border-white/10 rounded-xl p-3 sm:p-4 max-w-3xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: accent }}
            />
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-wide text-slate-100">
              {isBotColumn ? 'RIVAL BOT IA' : `JUGADOR ${playerId}`}
            </h2>
          </div>

          {!isBotColumn ? (
            <label className="flex items-center gap-1.5 bg-[#0b0e11] border border-white/15 focus-within:border-amber-400 rounded-lg px-2.5 py-1 flex-1 max-w-[220px]">
              <Pencil className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                maxLength={18}
                value={customName}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder={`Nombre J${playerId}`}
                aria-label={`Nombre del personaje Jugador ${playerId}`}
                className="w-full bg-transparent outline-none text-xs font-semibold text-slate-100 placeholder:text-slate-500"
              />
            </label>
          ) : (
            <span className="text-xs text-slate-400 font-mono-num">
              Controlado por IA
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 overflow-y-auto pr-0.5">
          {CHARACTER_LIST.map((char) => {
            const active = selected === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelect(char.id)}
                className={`text-left p-2.5 sm:p-3 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  active
                    ? 'bg-[#1e262d] border-amber-400'
                    : 'bg-[#101417] border-white/10 hover:border-white/25'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 bg-[#0b0e11] rounded-md p-1 border border-white/5">
                    <AnimePortrait
                      classId={char.id}
                      playerTagColor={accent}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-slate-100 truncate">
                        {char.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {char.role}
                    </p>
                    <p
                      className="text-[11px] font-medium mt-1"
                      style={{ color: char.accentColor }}
                    >
                      Pasiva: {char.passiveTitle}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                      {char.passiveDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Especial: <span className="text-slate-200">{char.specialName}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-0.5">
                    <div>
                      <span>VEL</span>
                      <StatDots value={char.statSpeed} color={char.accentColor} />
                    </div>
                    <div>
                      <span>ATQ</span>
                      <StatDots value={char.statPower} color={char.accentColor} />
                    </div>
                    <div>
                      <span>DEF</span>
                      <StatDots value={char.statDefense} color={char.accentColor} />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0e1113] flex flex-col p-3 sm:p-5 gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#171c20] border border-white/10 text-slate-200 hover:bg-[#242b30] text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-2 min-w-0 flex-wrap justify-center">
          <div className="inline-flex p-0.5 rounded-lg bg-[#171c20] border border-white/10">
            <button
              type="button"
              onClick={() => onSelectPlayerCount(1)}
              className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
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
              className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap ${
                playerCount === 2
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2 Jugadores
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] border border-emerald-400/45 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {savedFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                ¡Cambios Guardados!
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onSaveProfile();
            onConfirm();
          }}
          className="min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-base sm:text-lg font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Comenzar
        </button>
      </div>

      {/* Picker Grid */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-y-auto md:overflow-hidden">
        {renderPickerColumn(1, p1Class, onSelectP1, p1Name, onChangeP1Name, false)}
        {showSecondColumn &&
          renderPickerColumn(
            2,
            p2Class,
            onSelectP2,
            p2Name,
            onChangeP2Name,
            playerCount === 1 && mode === 'PVP'
          )}
      </div>
    </div>
  );
}
