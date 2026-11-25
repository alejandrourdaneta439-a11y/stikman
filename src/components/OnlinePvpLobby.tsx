import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  Play,
  Plus,
  Swords,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CHARACTER_CLASSES, CHARACTER_LIST } from '../game/characters';
import { CharacterClassId, OnlineRoomPlayer } from '../game/types';

interface OnlinePvpLobbyProps {
  connected: boolean;
  roomCode: string | null;
  slot: 1 | 2 | null;
  players: OnlineRoomPlayer[];
  errorMsg: string | null;
  playerName: string;
  selectedClass: CharacterClassId;
  onChangeName: (name: string) => void;
  onChangeClass: (classId: CharacterClassId) => void;
  onSaveProfile: () => void;
  onQuickMatch: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  onBack: () => void;
}

export function OnlinePvpLobby({
  connected,
  roomCode,
  slot,
  players,
  errorMsg,
  playerName,
  selectedClass,
  onChangeName,
  onChangeClass,
  onSaveProfile,
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
  onStartMatch,
  onLeaveRoom,
  onBack,
}: OnlinePvpLobbyProps) {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const p1 = players.find((p) => p.slot === 1);
  const p2 = players.find((p) => p.slot === 2);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleSave = () => {
    onSaveProfile();
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0e1113] flex flex-col p-3 sm:p-5 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 shrink-0 max-w-4xl w-full mx-auto">
        <button
          type="button"
          onClick={() => {
            if (roomCode) onLeaveRoom();
            onBack();
          }}
          className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#171c20] border border-white/10 text-slate-200 hover:bg-[#242b30] text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-sky-400 shrink-0" />
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-100 tracking-wide">
            PVP ONLINE
          </h1>
        </div>

        <div
          className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-mono-num font-semibold inline-flex items-center gap-1.5 ${
            connected
              ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
          }`}
        >
          {connected ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {connected ? 'En línea' : 'Conectando...'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-4xl w-full mx-auto bg-rose-500/15 border border-rose-400/50 text-rose-200 text-xs sm:text-sm rounded-lg px-3.5 py-2">
          {errorMsg}
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left: Your Survivor Name & Class */}
        <div className="bg-[#14191d] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <h2 className="font-display text-lg font-bold text-slate-100 tracking-wide">
              TU SUPERVIVIENTE
            </h2>
            <button
              type="button"
              onClick={handleSave}
              className="min-h-[34px] px-3 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] border border-emerald-400/40 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Guardado
                </>
              ) : (
                'Guardar Nombre'
              )}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-xs text-slate-400">Nombre visible online</span>
            <input
              type="text"
              maxLength={18}
              value={playerName}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Superviviente"
              className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-[#0e1113] border border-white/15 focus:border-sky-400 outline-none text-sm text-slate-100"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">Elige tu clase Anime</span>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_LIST.map((char) => {
                const active = selectedClass === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onChangeClass(char.id)}
                    className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1e262d] border-amber-400'
                        : 'bg-[#0e1113] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100 truncate">
                      {char.name}
                    </div>
                    <div
                      className="text-[10px] font-medium truncate mt-0.5"
                      style={{ color: char.accentColor }}
                    >
                      {char.weaponName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Matchmaking / Room */}
        <div className="bg-[#14191d] border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-4">
          {!roomCode ? (
            <>
              <div className="space-y-3">
                <h2 className="font-display text-lg font-bold text-slate-100 tracking-wide pb-2 border-b border-white/10">
                  BUSCAR DUELO ONLINE
                </h2>

                <button
                  type="button"
                  disabled={!connected}
                  onClick={onQuickMatch}
                  className="w-full min-h-[52px] px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-slate-950 font-display text-lg font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  Partida Rápida (1 vs 1)
                </button>

                <button
                  type="button"
                  disabled={!connected}
                  onClick={onCreateRoom}
                  className="w-full min-h-[48px] px-4 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-45 text-slate-950 font-display text-base font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Crear Sala Privada
                </button>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/10">
                <span className="text-xs text-slate-400">
                  ¿Tienes un código de sala de un amigo?
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    className="flex-1 min-h-[44px] px-3 rounded-lg bg-[#0e1113] border border-white/15 focus:border-sky-400 outline-none font-mono-num text-base tracking-widest uppercase text-slate-100 text-center"
                  />
                  <button
                    type="button"
                    disabled={!connected || joinCode.trim().length < 4}
                    onClick={() => onJoinRoom(joinCode.trim())}
                    className="min-h-[44px] px-5 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] border border-white/15 disabled:opacity-45 text-slate-100 text-sm font-semibold cursor-pointer"
                  >
                    Unirse
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
                  <div>
                    <p className="text-[11px] text-slate-400">CÓDIGO DE SALA</p>
                    <p className="font-mono-num text-2xl font-bold tracking-widest text-amber-400">
                      {roomCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="min-h-[38px] px-3 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] border border-white/10 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Jugadores en sala ({players.length}/2)</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e1113] border border-sky-400/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-sky-400">
                        JUGADOR 1 {slot === 1 ? '(TÚ)' : ''}
                      </div>
                      <div className="text-sm font-semibold text-slate-100">
                        {p1 ? p1.name : 'Esperando...'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-300">
                      {p1 ? CHARACTER_CLASSES[p1.classId].name : '—'}
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg bg-[#0e1113] border flex items-center justify-between ${
                      p2 ? 'border-rose-400/40' : 'border-white/10 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-rose-400">
                        JUGADOR 2 {slot === 2 ? '(TÚ)' : ''}
                      </div>
                      <div className="text-sm font-semibold text-slate-100">
                        {p2 ? p2.name : 'Esperando rival...'}
                      </div>
                    </div>
                    <div className="text-xs text-slate-300">
                      {p2 ? CHARACTER_CLASSES[p2.classId].name : 'Comparte el código'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="min-h-[46px] px-4 rounded-lg bg-[#1e262d] hover:bg-[#2a343d] text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Salir
                </button>
                <button
                  type="button"
                  disabled={!p1 || !p2}
                  onClick={onStartMatch}
                  className="flex-1 min-h-[46px] px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-45 text-slate-950 font-display text-lg font-bold tracking-wide inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  {p1 && p2 ? 'Iniciar Duelo Online' : 'Esperando Rival...'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
