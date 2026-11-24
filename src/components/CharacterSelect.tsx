import { ArrowLeft } from 'lucide-react';
import { CHARACTER_LIST } from '../game/characters';
import { CharacterClassId, GameMode, PlayerCount } from '../game/types';

interface CharacterSelectProps {
  mode: GameMode;
  playerCount: PlayerCount;
  p1Class: CharacterClassId;
  p2Class: CharacterClassId;
  onSelectPlayerCount: (count: PlayerCount) => void;
  onSelectP1: (id: CharacterClassId) => void;
  onSelectP2: (id: CharacterClassId) => void;
  onBack: () => void;
  onConfirm: () => void;
}

function StickmanPreview({
  classId,
  playerTagColor,
}: {
  classId: CharacterClassId;
  playerTagColor: string;
}) {
  return (
    <svg width="48" height="58" viewBox="0 0 48 58" fill="none" aria-hidden="true">
      <circle cx="24" cy="14" r="6.5" fill="#f8fafc" />
      <rect x="17" y="6" width="14" height="2.2" rx="1" fill={playerTagColor} />

      {classId === 'medic' && (
        <>
          <rect x="17.5" y="11" width="13" height="3" fill="#10b981" />
          <rect x="25" y="13" width="5" height="3" fill="#34d399" />
        </>
      )}
      {classId === 'engineer' && (
        <>
          <path d="M16.5 13 A7.5 7.5 0 0 1 31.5 13 Z" fill="#f59e0b" />
          <rect x="15" y="12" width="18" height="2.5" fill="#fbbf24" />
        </>
      )}
      {classId === 'scout' && (
        <>
          <path d="M20 22 L9 27 L12 31 L20 25 Z" fill="#a855f7" />
          <rect x="24" y="11" width="7" height="4" fill="#1e293b" />
          <rect x="26" y="12" width="3.5" height="2" fill="#d8b4fe" />
        </>
      )}
      {classId === 'juggernaut' && (
        <>
          <rect x="17" y="8" width="14" height="10" rx="2" fill="#334155" />
          <rect x="24" y="12" width="6" height="2.5" fill="#38bdf8" />
        </>
      )}

      <line
        x1="24"
        y1="21"
        x2="24"
        y2="38"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4 : 3}
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="38"
        x2="17"
        y2="52"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4 : 3}
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="38"
        x2="31"
        y2="52"
        stroke="#f8fafc"
        strokeWidth={classId === 'juggernaut' ? 4 : 3}
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="25"
        x2="34"
        y2="29"
        stroke="#f8fafc"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {classId === 'juggernaut' ? (
        <>
          <line x1="32" y1="29" x2="40" y2="18" stroke="#94a3b8" strokeWidth="3" />
          <rect x="36" y="12" width="8" height="12" rx="1" fill="#e2e8f0" />
        </>
      ) : classId === 'scout' ? (
        <rect x="30" y="27" width="15" height="3" fill="#a855f7" />
      ) : classId === 'medic' ? (
        <rect x="31" y="27" width="10" height="4" fill="#10b981" />
      ) : (
        <rect x="30" y="27" width="12" height="4.5" fill="#f59e0b" />
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
  onSelectPlayerCount,
  onSelectP1,
  onSelectP2,
  onBack,
  onConfirm,
}: CharacterSelectProps) {
  const showSecondColumn = playerCount === 2 || mode === 'PVP';

  const renderPickerColumn = (
    playerId: 1 | 2,
    selected: CharacterClassId,
    onSelect: (id: CharacterClassId) => void,
    isBotColumn = false
  ) => {
    const isP1 = playerId === 1;
    const accent = isP1 ? '#38bdf8' : '#fb7185';
    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#14191d] border border-white/10 rounded-xl p-3 sm:p-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: accent }}
            />
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-wide text-slate-100">
              {isBotColumn ? 'RIVAL BOT IA' : `JUGADOR ${playerId}`}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono-num truncate">
            {isBotColumn
              ? 'Controlado por IA'
              : isP1
              ? 'A D W · F G'
              : '◀ ▶ ▲ · K L'}
          </span>
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
                    <StickmanPreview
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

        <div className="flex items-center gap-3 min-w-0">
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

          <h1 className="hidden lg:block font-display text-xl font-bold text-slate-100 tracking-wide truncate">
            ESCUADRÓN DE SUPERVIVENCIA
          </h1>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="min-h-[44px] px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-base sm:text-lg font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Comenzar
        </button>
      </div>

      {/* Picker Grid */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-y-auto md:overflow-hidden">
        {renderPickerColumn(1, p1Class, onSelectP1, false)}
        {showSecondColumn &&
          renderPickerColumn(2, p2Class, onSelectP2, playerCount === 1 && mode === 'PVP')}
      </div>
    </div>
  );
}
