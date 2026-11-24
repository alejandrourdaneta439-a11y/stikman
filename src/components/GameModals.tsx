import { HudSnapshot, PlayerCount } from '../game/types';

interface PauseModalProps {
  playerCount: PlayerCount;
  onSwitchPlayerCount: (count: PlayerCount) => void;
  onResume: () => void;
  onRestart: () => void;
  onChangeChars: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  playerCount,
  onSwitchPlayerCount,
  onResume,
  onRestart,
  onChangeChars,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#14191d] border border-white/15 rounded-xl p-6 space-y-4 text-center">
        <h2 className="font-display text-3xl font-bold text-slate-100 tracking-wide">
          PAUSA
        </h2>
        <p className="text-xs text-slate-400">
          {playerCount === 1
            ? 'J1 (A D W · F G) · Crafteo (C)'
            : 'J1 (A D W · F G) · J2 (◀ ▶ ▲ · K L) · Crafteo (C)'}
        </p>

        {/* Switch 1P <-> 2P */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0b0e11] border border-white/10">
          <button
            type="button"
            onClick={() => onSwitchPlayerCount(1)}
            className={`min-h-[38px] rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              playerCount === 1
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            1 Jugador
          </button>
          <button
            type="button"
            onClick={() => onSwitchPlayerCount(2)}
            className={`min-h-[38px] rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              playerCount === 2
                ? 'bg-sky-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            2 Jugadores
          </button>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onResume}
            className="min-h-[46px] w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-lg font-bold tracking-wide cursor-pointer"
          >
            Reanudar
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[44px] w-full rounded-lg bg-[#1e262d] hover:bg-[#2a343d] text-slate-100 text-sm font-semibold cursor-pointer"
          >
            Reiniciar Partida
          </button>
          <button
            type="button"
            onClick={onChangeChars}
            className="min-h-[44px] w-full rounded-lg bg-[#1e262d] hover:bg-[#2a343d] text-slate-100 text-sm font-semibold cursor-pointer"
          >
            Cambiar Personajes
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="min-h-[44px] w-full rounded-lg bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 text-sm font-medium cursor-pointer"
          >
            Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  hud: HudSnapshot;
  onPlayAgain: () => void;
  onSwitchPlayerCount: (count: PlayerCount) => void;
  onChangeChars: () => void;
  onMainMenu: () => void;
}

export function GameOverModal({
  hud,
  onPlayAgain,
  onSwitchPlayerCount,
  onChangeChars,
  onMainMenu,
}: GameOverModalProps) {
  const title =
    hud.mode === 'COOP'
      ? 'FIN DE LA SUPERVIVENCIA'
      : hud.winnerId === 'draw'
      ? 'EMPATE NUCLEAR'
      : hud.winnerId === 2 && hud.p2.isBot
      ? '¡VICTORIA DEL BOT IA!'
      : `¡VICTORIA DEL JUGADOR ${hud.winnerId}!`;

  const shownPlayers = hud.p2.enabled ? [hud.p1, hud.p2] : [hud.p1];

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#14191d] border border-amber-500/35 rounded-xl p-6 space-y-5">
        <div className="text-center space-y-1">
          <p className="text-xs font-mono-num text-amber-400">
            {hud.mode === 'COOP'
              ? `OLEADA ALCANZADA ${hud.wave} · ${hud.teamScore} PTS`
              : 'DUELO FINALIZADO'}
          </p>
          <h2 className="font-display text-3xl font-bold text-slate-100 tracking-wide">
            {title}
          </h2>
        </div>

        {/* Player Breakdown */}
        <div
          className={`grid gap-3 ${
            shownPlayers.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {shownPlayers.map((p) => (
            <div
              key={p.id}
              className="bg-[#0e1113] border border-white/10 rounded-lg p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className={p.id === 1 ? 'text-sky-400' : 'text-rose-400'}>
                  {p.isBot ? 'BOT IA' : `JUGADOR ${p.id}`}
                </span>
                <span className="font-mono-num text-slate-200">{p.score}</span>
              </div>
              <p className="text-xs text-slate-300 truncate">{p.name}</p>
              <div className="text-[11px] font-mono-num text-slate-400 space-y-0.5 pt-1 border-t border-white/5">
                <div>Bajas: {p.kills}</div>
                <div>Revividos: {p.revives}</div>
                <div>Crafteos: {p.craftedCount}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            style={{ borderColor: '#0e32dc' }}
            className="min-h-[48px] w-full rounded-lg border-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display text-lg font-bold tracking-wide cursor-pointer"
          >
            Jugar de Nuevo
          </button>

          {/* Switch 1P <-> 2P directly from Game Over */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#0b0e11] border border-white/10">
            <button
              type="button"
              onClick={() => onSwitchPlayerCount(1)}
              className={`min-h-[38px] rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                hud.playerCount === 1
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              1 Jugador
            </button>
            <button
              type="button"
              onClick={() => onSwitchPlayerCount(2)}
              className={`min-h-[38px] rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                hud.playerCount === 2
                  ? 'bg-sky-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              2 Jugadores
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onChangeChars}
              className="min-h-[44px] rounded-lg bg-[#1e262d] hover:bg-[#2a343d] text-slate-100 text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Cambiar Clases
            </button>
            <button
              type="button"
              onClick={onMainMenu}
              className="min-h-[44px] rounded-lg bg-transparent border border-white/10 hover:bg-white/5 text-slate-300 text-xs sm:text-sm font-medium cursor-pointer"
            >
              Menú Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
