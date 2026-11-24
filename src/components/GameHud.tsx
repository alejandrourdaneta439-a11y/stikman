import {
  CloudLightning,
  CloudRain,
  Hammer,
  Pause,
  Smartphone,
  Sun,
  Users,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import {
  HudSnapshot,
  PlayerCount,
  PlayerHudInfo,
  WeatherType,
} from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouch: boolean;
  craftOpen: boolean;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  onToggleCraft: () => void;
  onSwitchPlayerCount: (count: PlayerCount) => void;
  onPause: () => void;
}

const WEATHER_META: Record<
  WeatherType,
  { label: string; hint: string; colorClass: string }
> = {
  clear: {
    label: 'Despejado',
    hint: 'Clima estable',
    colorClass: 'text-sky-300',
  },
  radiation_storm: {
    label: 'Tormenta Radiactiva',
    hint: 'Drena salud sin refugio',
    colorClass: 'text-amber-400 font-bold',
  },
  acid_rain: {
    label: 'Lluvia Ácida',
    hint: 'Corroe estructuras expuestas',
    colorClass: 'text-lime-400 font-bold',
  },
  ash_blizzard: {
    label: 'Ventisca de Ceniza',
    hint: 'Viento fuerte en arena',
    colorClass: 'text-slate-200 font-semibold',
  },
};

function formatTimeMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function WeatherIcon({ type }: { type: WeatherType }) {
  if (type === 'radiation_storm') {
    return <CloudLightning className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (type === 'acid_rain') {
    return <CloudRain className="w-3.5 h-3.5 text-lime-400 shrink-0" />;
  }
  if (type === 'ash_blizzard') {
    return <Wind className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
  }
  return <Sun className="w-3.5 h-3.5 text-sky-300 shrink-0" />;
}

function PlayerCluster({
  player,
  align,
}: {
  player: PlayerHudInfo;
  align: 'left' | 'right';
}) {
  const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const radPct = Math.max(0, Math.min(100, player.rad));
  const tagColor = player.id === 1 ? '#38bdf8' : '#fb7185';
  const isRight = align === 'right';
  const labelPrefix = player.isBot ? 'BOT' : `J${player.id}`;

  return (
    <div
      className={`flex flex-col gap-1 min-w-[120px] sm:min-w-[175px] bg-[#111518]/85 border border-white/10 rounded-lg px-2.5 py-1.5 ${
        isRight ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      <div
        className={`w-full flex items-center justify-between gap-2 text-[11px] font-semibold ${
          isRight ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="truncate text-slate-100 flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-xs shrink-0"
            style={{ backgroundColor: tagColor }}
          />
          {labelPrefix} · {player.name.split(' ')[0]}
        </span>
        <span className="font-mono-num text-slate-300 shrink-0">
          {player.downed
            ? 'HERIDO'
            : player.dead
            ? 'CAÍDO'
            : `${player.hp}/${player.maxHp}`}
        </span>
      </div>

      <div className="w-full h-2 bg-slate-800 rounded-xs overflow-hidden">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${hpPct}%`,
            backgroundColor:
              hpPct > 50 ? '#10b981' : hpPct > 25 ? '#f59e0b' : '#f43f5e',
          }}
        />
      </div>

      <div
        className={`w-full flex items-center justify-between gap-2 text-[10px] font-mono-num ${
          isRight ? 'flex-row-reverse' : ''
        }`}
      >
        <span
          className={
            radPct >= 75
              ? 'text-lime-400 font-bold'
              : radPct >= 40
              ? 'text-amber-400'
              : 'text-slate-400'
          }
        >
          RAD {radPct}%
        </span>
        <span
          className={
            player.specialReadyRatio >= 1
              ? 'text-amber-400 font-bold'
              : 'text-slate-400'
          }
        >
          {player.specialReadyRatio >= 1
            ? 'HAB LISTA'
            : `HAB ${player.specialCooldownSec}s`}
        </span>
      </div>
    </div>
  );
}

export function GameHud({
  hud,
  muted,
  showTouch,
  craftOpen,
  onToggleMute,
  onToggleTouch,
  onToggleCraft,
  onSwitchPlayerCount,
  onPause,
}: GameHudProps) {
  const nextCount: PlayerCount = hud.playerCount === 1 ? 2 : 1;
  const wMeta = WEATHER_META[hud.weather];
  const nextMeta = WEATHER_META[hud.nextWeather];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2 sm:p-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <PlayerCluster player={hud.p1} align="left" />

        {/* Center Status + Resources + Controls */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-[#111518]/90 border border-white/10 rounded-lg px-2 py-1">
            <span className="font-display text-xs sm:text-sm font-bold tracking-wide text-amber-400 px-1 whitespace-nowrap">
              {hud.mode === 'COOP' ? `OLEADA ${hud.wave}` : 'DUELO'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono-num text-xs text-slate-200 px-1 whitespace-nowrap">
              {hud.teamScore} PTS
            </span>

            <button
              type="button"
              onClick={() => onSwitchPlayerCount(nextCount)}
              title={`Cambiar a ${nextCount} ${nextCount === 1 ? 'Jugador' : 'Jugadores'}`}
              aria-label={`Cambiar a ${nextCount} jugadores`}
              className="min-h-[32px] px-2 py-1 rounded bg-[#1e262d] text-sky-300 hover:bg-[#2a343d] text-xs font-mono-num font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{hud.playerCount}J</span>
            </button>

            <button
              type="button"
              onClick={onToggleCraft}
              aria-label="Abrir mesa de crafteo"
              className={`min-h-[32px] px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                craftOpen
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-[#1e262d] text-slate-200 hover:bg-[#2a343d]'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Crafteo</span>
            </button>

            <button
              type="button"
              onClick={onToggleTouch}
              aria-label="Mostrar u ocultar controles táctiles"
              className={`min-h-[32px] min-w-[32px] px-1.5 py-1 rounded inline-flex items-center justify-center transition-colors cursor-pointer ${
                showTouch
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                  : 'bg-[#1e262d] text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
              className="min-h-[32px] min-w-[32px] px-1.5 py-1 rounded bg-[#1e262d] text-slate-300 hover:text-white inline-flex items-center justify-center cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="Pausar juego"
              className="min-h-[32px] min-w-[32px] px-1.5 py-1 rounded bg-[#1e262d] text-slate-300 hover:text-white inline-flex items-center justify-center cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Resources + 2-Min Weather Status strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-num bg-[#111518]/85 border border-white/10 rounded-md px-2.5 py-0.5">
            <span className="text-amber-400" title="Madera">
              MAD {hud.resources.wood}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300" title="Metal">
              MET {hud.resources.metal}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-sky-400" title="Electrónica">
              CIR {hud.resources.electronics}
            </span>
            <span className="text-slate-600">|</span>
            <span className="inline-flex items-center gap-1">
              <WeatherIcon type={hud.weather} />
              <span className={wMeta.colorClass}>{wMeta.label}</span>
              <span className="text-slate-400">
                · {formatTimeMMSS(hud.weatherTimerSec)}
              </span>
            </span>
          </div>
        </div>

        {hud.p2.enabled ? (
          <PlayerCluster player={hud.p2} align="right" />
        ) : (
          <div className="min-w-[120px] sm:min-w-[175px]" aria-hidden="true" />
        )}
      </div>

      {/* Weather effect hint or imminent 12s change warning */}
      {hud.weatherWarning ? (
        <div className="mx-auto bg-amber-500/95 text-slate-950 font-display text-xs sm:text-sm font-bold tracking-wide px-3 py-1 rounded">
          CAMBIO DE CLIMA EN {hud.weatherTimerSec}s · PRÓXIMO: {nextMeta.label.toUpperCase()} ({nextMeta.hint.toUpperCase()})
        </div>
      ) : (
        hud.weather !== 'clear' && (
          <div className="mx-auto bg-[#111518]/85 border border-white/10 text-xs font-medium px-3 py-0.5 rounded flex items-center gap-1.5">
            <WeatherIcon type={hud.weather} />
            <span className={wMeta.colorClass}>{wMeta.label}:</span>
            <span className="text-slate-300">{wMeta.hint}</span>
          </div>
        )
      )}
    </div>
  );
}
