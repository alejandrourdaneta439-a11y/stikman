import { useCallback, useEffect, useRef, useState } from 'react';
import { musicPlayer } from './audio/musicPlayer';
import { soundEngine } from './audio/soundEngine';
import { CharacterSelect } from './components/CharacterSelect';
import { CraftingPanel } from './components/CraftingPanel';
import { GameHud } from './components/GameHud';
import { GameOverModal, PauseModal } from './components/GameModals';
import { MusicPanel } from './components/MusicPanel';
import { OnlinePvpLobby } from './components/OnlinePvpLobby';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { TouchActionKey, TouchControls } from './components/TouchControls';
import { WeaponShopPanel } from './components/WeaponShopPanel';
import {
  ARENA_H,
  ARENA_W,
  SimulationWorld,
  buyOrEquipWeapon,
  craftItem,
  createWorld,
  getHudSnapshot,
  sendEmote,
  stepWorld,
} from './game/engine';
import {
  DEFAULT_PROFILE,
  TouchControlScale,
  loadSavedProfile,
  saveGameProfile,
} from './game/profileStore';
import { renderWorld } from './game/renderer';
import {
  CharacterClassId,
  ClientWsMessage,
  CraftItemId,
  EmoteId,
  GameMode,
  GameState,
  HudSnapshot,
  OnlineRoomPlayer,
  PlayerCount,
  PlayerInput,
  ServerWsMessage,
  WeaponId,
} from './game/types';

interface HeldFlags {
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  special: boolean;
}

function emptyFlags(): HeldFlags {
  return { left: false, right: false, jump: false, attack: false, special: false };
}

export default function App() {
  const initialProfileRef = useRef(loadSavedProfile());

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>(initialProfileRef.current.mode);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(
    initialProfileRef.current.playerCount
  );
  const [p1Class, setP1Class] = useState<CharacterClassId>(
    initialProfileRef.current.p1Class
  );
  const [p2Class, setP2Class] = useState<CharacterClassId>(
    initialProfileRef.current.p2Class
  );
  const [p1Name, setP1Name] = useState<string>(initialProfileRef.current.p1Name);
  const [p2Name, setP2Name] = useState<string>(initialProfileRef.current.p2Name);
  const [muted, setMuted] = useState<boolean>(initialProfileRef.current.muted);
  const [musicVolume, setMusicVolume] = useState<number>(
    initialProfileRef.current.musicVolume
  );
  const [musicLoop, setMusicLoop] = useState<boolean>(
    initialProfileRef.current.musicLoop
  );
  const [touchScale, setTouchScale] = useState<TouchControlScale>(
    initialProfileRef.current.touchScale
  );
  const [screenShake, setScreenShake] = useState<boolean>(
    initialProfileRef.current.screenShake
  );

  const [craftOpen, setCraftOpen] = useState(false);
  const [weaponShopOpen, setWeaponShopOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );
  const [showTouch, setShowTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 900
    );
  });

  const [hud, setHud] = useState<HudSnapshot | null>(null);

  // Online PvP state
  const [isOnline, setIsOnline] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlineSlot, setOnlineSlot] = useState<1 | 2 | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlineRoomPlayer[]>([]);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<SimulationWorld | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const onlineSlotRef = useRef<1 | 2 | null>(onlineSlot);
  onlineSlotRef.current = onlineSlot;
  const screenShakeRef = useRef(screenShake);
  screenShakeRef.current = screenShake;

  const heldKeysRef = useRef<Set<string>>(new Set());
  const touchHeldRef = useRef<[HeldFlags, HeldFlags]>([
    emptyFlags(),
    emptyFlags(),
  ]);
  const justPressedRef = useRef<[HeldFlags, HeldFlags]>([
    emptyFlags(),
    emptyFlags(),
  ]);
  const lastSentInputJsonRef = useRef<string>('');

  // Sync audio/music initial preferences
  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    musicPlayer.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    musicPlayer.setLoop(musicLoop);
  }, [musicLoop]);

  useEffect(() => {
    const onResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persistProfile = useCallback(
    (overrides?: Partial<ReturnType<typeof loadSavedProfile>>) => {
      const saved = saveGameProfile({
        p1Name,
        p2Name,
        classCustomNames: {},
        p1Class,
        p2Class,
        mode,
        playerCount,
        muted,
        musicVolume,
        musicLoop,
        touchScale,
        screenShake,
        updatedAt: Date.now(),
        ...overrides,
      });
      setP1Name(saved.p1Name);
      setP2Name(saved.p2Name);
    },
    [
      p1Name,
      p2Name,
      p1Class,
      p2Class,
      mode,
      playerCount,
      muted,
      musicVolume,
      musicLoop,
      touchScale,
      screenShake,
    ]
  );

  const handleResetDefaults = useCallback(() => {
    setP1Name(DEFAULT_PROFILE.p1Name);
    setP2Name(DEFAULT_PROFILE.p2Name);
    setP1Class(DEFAULT_PROFILE.p1Class);
    setP2Class(DEFAULT_PROFILE.p2Class);
    setMode(DEFAULT_PROFILE.mode);
    setPlayerCount(DEFAULT_PROFILE.playerCount);
    setMuted(DEFAULT_PROFILE.muted);
    setMusicVolume(DEFAULT_PROFILE.musicVolume);
    setMusicLoop(DEFAULT_PROFILE.musicLoop);
    setTouchScale(DEFAULT_PROFILE.touchScale);
    setScreenShake(DEFAULT_PROFILE.screenShake);
    saveGameProfile({ ...DEFAULT_PROFILE, updatedAt: Date.now() });
  }, []);

  const sendWs = useCallback((msg: ClientWsMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  // Manage WebSocket when in Online Lobby or Online Match
  useEffect(() => {
    const needsSocket = gameState === 'ONLINE_LOBBY' || isOnline;
    if (!needsSocket) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsConnected(false);
      return;
    }

    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setOnlineError(null);
    };

    ws.onmessage = (event) => {
      let msg: ServerWsMessage;
      try {
        msg = JSON.parse(event.data as string) as ServerWsMessage;
      } catch {
        return;
      }

      if (msg.type === 'room_joined') {
        setOnlineRoomCode(msg.code);
        setOnlineSlot(msg.slot);
        setOnlinePlayers(msg.players);
        setOnlineError(null);
      } else if (msg.type === 'room_updated') {
        setOnlinePlayers(msg.players);
      } else if (msg.type === 'match_started') {
        const w = msg.world as SimulationWorld;
        worldRef.current = w;
        setIsOnline(true);
        heldKeysRef.current.clear();
        touchHeldRef.current = [emptyFlags(), emptyFlags()];
        justPressedRef.current = [emptyFlags(), emptyFlags()];
        setCraftOpen(false);
        setWeaponShopOpen(false);
        setHud(
          getHudSnapshot(w, {
            isOnline: true,
            localPlayerId: onlineSlotRef.current ?? 1,
          })
        );
        setGameState('PLAYING');
      } else if (msg.type === 'state') {
        const w = msg.world as SimulationWorld;
        worldRef.current = w;
        setHud(
          getHudSnapshot(w, {
            isOnline: true,
            localPlayerId: onlineSlotRef.current ?? 1,
          })
        );
        if (w.gameOver && gameStateRef.current === 'PLAYING') {
          setGameState('GAME_OVER');
        }
      } else if (msg.type === 'opponent_left') {
        setOnlineError(msg.message);
        setIsOnline(false);
        if (
          gameStateRef.current === 'PLAYING' ||
          gameStateRef.current === 'PAUSED' ||
          gameStateRef.current === 'GAME_OVER'
        ) {
          setGameState('ONLINE_LOBBY');
        }
      } else if (msg.type === 'error') {
        setOnlineError(msg.message);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = () => {
      setWsConnected(false);
      setOnlineError('No se pudo conectar con el servidor PvP Online.');
    };
  }, [gameState, isOnline]);

  // Keep online lobby profile synced if user changes name/class while in room
  useEffect(() => {
    if (gameState === 'ONLINE_LOBBY' && onlineRoomCode && wsConnected) {
      sendWs({ type: 'update_profile', name: p1Name, classId: p1Class });
    }
  }, [gameState, onlineRoomCode, wsConnected, p1Name, p1Class, sendWs]);

  const startNewGame = useCallback(
    (
      selectedMode: GameMode,
      c1: CharacterClassId,
      c2: CharacterClassId,
      count: PlayerCount,
      name1 = p1Name,
      name2 = p2Name
    ) => {
      soundEngine.unlock();
      setIsOnline(false);
      setOnlineRoomCode(null);
      setOnlineSlot(null);
      const world = createWorld(selectedMode, c1, c2, count, name1, name2);
      worldRef.current = world;
      heldKeysRef.current.clear();
      touchHeldRef.current = [emptyFlags(), emptyFlags()];
      justPressedRef.current = [emptyFlags(), emptyFlags()];
      setCraftOpen(false);
      setWeaponShopOpen(false);
      setHud(getHudSnapshot(world));
      setGameState('PLAYING');
    },
    [p1Name, p2Name]
  );

  const handleSwitchPlayerCountInGame = useCallback(
    (nextCount: PlayerCount) => {
      setPlayerCount(nextCount);
      startNewGame(mode, p1Class, p2Class, nextCount);
    },
    [mode, p1Class, p2Class, startNewGame]
  );

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleTouchState = useCallback(
    (playerId: 1 | 2, key: TouchActionKey, pressed: boolean) => {
      soundEngine.unlock();
      const idx = playerId - 1;
      const wasPressed = touchHeldRef.current[idx][key];
      touchHeldRef.current[idx][key] = pressed;
      if (pressed && !wasPressed) {
        justPressedRef.current[idx][key] = true;
      }
    },
    []
  );

  const handleCraft = useCallback(
    (playerId: 1 | 2, itemId: CraftItemId) => {
      soundEngine.unlock();
      if (isOnlineRef.current) {
        sendWs({ type: 'craft', itemId });
        return;
      }
      const world = worldRef.current;
      if (!world) return;
      if (craftItem(world, playerId, itemId)) {
        setHud(getHudSnapshot(world));
      }
    },
    [sendWs]
  );

  const handleBuyOrEquipWeapon = useCallback(
    (playerId: 1 | 2, weaponId: WeaponId) => {
      soundEngine.unlock();
      if (isOnlineRef.current) {
        sendWs({ type: 'buy_weapon', weaponId });
        return;
      }
      const world = worldRef.current;
      if (!world) return;
      if (buyOrEquipWeapon(world, playerId, weaponId)) {
        setHud(getHudSnapshot(world));
      }
    },
    [sendWs]
  );

  const handleEmote = useCallback(
    (playerId: 1 | 2, emoteId: EmoteId) => {
      soundEngine.unlock();
      if (isOnlineRef.current) {
        sendWs({ type: 'emote', emoteId });
        return;
      }
      const world = worldRef.current;
      if (!world) return;
      sendEmote(world, playerId, emoteId);
    },
    [sendWs]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const code = e.code;

      if (code === 'Escape' || code === 'KeyP') {
        if (gameStateRef.current === 'PLAYING') {
          setGameState('PAUSED');
          return;
        }
        if (gameStateRef.current === 'PAUSED') {
          setGameState('PLAYING');
          return;
        }
      }

      if (code === 'KeyC' && gameStateRef.current === 'PLAYING') {
        setWeaponShopOpen(false);
        setCraftOpen((prev) => !prev);
        return;
      }

      if (code === 'KeyB' && gameStateRef.current === 'PLAYING') {
        setCraftOpen(false);
        setWeaponShopOpen((prev) => !prev);
        return;
      }

      if (gameStateRef.current !== 'PLAYING') return;

      if (code.startsWith('Arrow') || code === 'Space') {
        e.preventDefault();
      }

      const alreadyHeld = heldKeysRef.current.has(code);
      heldKeysRef.current.add(code);

      if (!alreadyHeld) {
        if (isOnlineRef.current) {
          const slotIdx = (onlineSlotRef.current ?? 1) - 1;
          if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
            justPressedRef.current[slotIdx].jump = true;
          }
          if (code === 'KeyF' || code === 'KeyK') {
            justPressedRef.current[slotIdx].attack = true;
          }
          if (code === 'KeyG' || code === 'KeyL') {
            justPressedRef.current[slotIdx].special = true;
          }
        } else {
          if (code === 'KeyW') justPressedRef.current[0].jump = true;
          if (code === 'KeyF') justPressedRef.current[0].attack = true;
          if (code === 'KeyG') justPressedRef.current[0].special = true;

          if (code === 'ArrowUp') justPressedRef.current[1].jump = true;
          if (code === 'KeyK') justPressedRef.current[1].attack = true;
          if (code === 'KeyL') justPressedRef.current[1].special = true;

          const world = worldRef.current;
          if (world) {
            if (code === 'Digit1') sendEmote(world, 1, 'help');
            if (code === 'Digit2') sendEmote(world, 1, 'gather');
            if (code === 'Digit3') sendEmote(world, 1, 'danger');
            if (code === 'Digit8') sendEmote(world, 2, 'help');
            if (code === 'Digit9') sendEmote(world, 2, 'gather');
            if (code === 'Digit0') sendEmote(world, 2, 'danger');
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.code);
    };

    const onBlur = () => {
      heldKeysRef.current.clear();
      touchHeldRef.current = [emptyFlags(), emptyFlags()];
      justPressedRef.current = [emptyFlags(), emptyFlags()];
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;

    let rafId = 0;
    let lastTime = performance.now();
    let hudTimer = 0;

    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const world = worldRef.current;
      const canvas = canvasRef.current;
      if (!world || !canvas) return;

      if (gameStateRef.current === 'PLAYING' && !world.gameOver) {
        const held = heldKeysRef.current;
        const t1 = touchHeldRef.current[0];
        const t2 = touchHeldRef.current[1];
        const jp1 = justPressedRef.current[0];
        const jp2 = justPressedRef.current[1];

        if (isOnlineRef.current) {
          const slot = onlineSlotRef.current ?? 1;
          const idx = slot - 1;
          const tLocal = touchHeldRef.current[idx];
          const jpLocal = justPressedRef.current[idx];

          const localInput: PlayerInput = {
            left: held.has('KeyA') || held.has('ArrowLeft') || tLocal.left,
            right: held.has('KeyD') || held.has('ArrowRight') || tLocal.right,
            jumpHeld:
              held.has('KeyW') ||
              held.has('ArrowUp') ||
              held.has('Space') ||
              tLocal.jump,
            jumpJustPressed: jpLocal.jump,
            attackJustPressed: jpLocal.attack,
            attackHeld: held.has('KeyF') || held.has('KeyK') || tLocal.attack,
            specialJustPressed: jpLocal.special,
          };

          jpLocal.jump = false;
          jpLocal.attack = false;
          jpLocal.special = false;

          const inputStr = JSON.stringify(localInput);
          if (
            inputStr !== lastSentInputJsonRef.current ||
            localInput.jumpJustPressed ||
            localInput.attackJustPressed ||
            localInput.specialJustPressed
          ) {
            lastSentInputJsonRef.current = inputStr;
            sendWs({ type: 'input', input: localInput });
          }
        } else {
          const p1Input: PlayerInput = {
            left: held.has('KeyA') || t1.left,
            right: held.has('KeyD') || t1.right,
            jumpHeld: held.has('KeyW') || t1.jump,
            jumpJustPressed: jp1.jump,
            attackJustPressed: jp1.attack,
            attackHeld: held.has('KeyF') || t1.attack,
            specialJustPressed: jp1.special,
          };

          const p2Input: PlayerInput = {
            left: held.has('ArrowLeft') || t2.left,
            right: held.has('ArrowRight') || t2.right,
            jumpHeld: held.has('ArrowUp') || t2.jump,
            jumpJustPressed: jp2.jump,
            attackJustPressed: jp2.attack,
            attackHeld: held.has('KeyK') || t2.attack,
            specialJustPressed: jp2.special,
          };

          jp1.jump = false;
          jp1.attack = false;
          jp1.special = false;
          jp2.jump = false;
          jp2.attack = false;
          jp2.special = false;

          stepWorld(world, rawDt, [p1Input, p2Input]);

          if (world.gameOver) {
            setHud(getHudSnapshot(world));
            setGameState('GAME_OVER');
          } else {
            hudTimer += rawDt;
            if (hudTimer >= 0.09) {
              hudTimer = 0;
              setHud(getHudSnapshot(world));
            }
          }
        }
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.floor(rect.width * dpr));
      const targetH = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.clearRect(0, 0, targetW, targetH);
        const scale = Math.min(targetW / ARENA_W, targetH / ARENA_H);
        const offsetX = (targetW - ARENA_W * scale) * 0.5;
        const offsetY = (targetH - ARENA_H * scale) * 0.5;
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        renderWorld(ctx, world, now / 1000, screenShakeRef.current);
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [gameState, sendWs]);

  const leaveOnlineMatchToMenu = useCallback(() => {
    sendWs({ type: 'leave_room' });
    setIsOnline(false);
    setOnlineRoomCode(null);
    setOnlineSlot(null);
    setOnlinePlayers([]);
    setGameState('TITLE_MENU');
  }, [sendWs]);

  const dockedControls = isPortrait && showTouch;

  return (
    <>
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          mode={mode}
          playerCount={playerCount}
          onSelectMode={setMode}
          onSelectPlayerCount={setPlayerCount}
          onStart={() => {
            soundEngine.unlock();
            setGameState('CHARACTER_SELECT');
          }}
          onStartOnlinePvp={() => {
            soundEngine.unlock();
            setOnlineError(null);
            setGameState('ONLINE_LOBBY');
          }}
          onOpenMusic={() => setMusicOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'CHARACTER_SELECT' && (
        <CharacterSelect
          mode={mode}
          playerCount={playerCount}
          p1Class={p1Class}
          p2Class={p2Class}
          p1Name={p1Name}
          p2Name={p2Name}
          onSelectPlayerCount={setPlayerCount}
          onSelectP1={setP1Class}
          onSelectP2={setP2Class}
          onChangeP1Name={setP1Name}
          onChangeP2Name={setP2Name}
          onSaveProfile={() => persistProfile()}
          onBack={() => setGameState('TITLE_MENU')}
          onConfirm={() => startNewGame(mode, p1Class, p2Class, playerCount)}
        />
      )}

      {gameState === 'ONLINE_LOBBY' && (
        <OnlinePvpLobby
          connected={wsConnected}
          roomCode={onlineRoomCode}
          slot={onlineSlot}
          players={onlinePlayers}
          errorMsg={onlineError}
          playerName={p1Name}
          selectedClass={p1Class}
          onChangeName={setP1Name}
          onChangeClass={setP1Class}
          onSaveProfile={() => persistProfile()}
          onQuickMatch={() =>
            sendWs({ type: 'quick_match', name: p1Name, classId: p1Class })
          }
          onCreateRoom={() =>
            sendWs({ type: 'create_room', name: p1Name, classId: p1Class })
          }
          onJoinRoom={(code) =>
            sendWs({ type: 'join_room', code, name: p1Name, classId: p1Class })
          }
          onStartMatch={() => sendWs({ type: 'start_match' })}
          onLeaveRoom={() => {
            sendWs({ type: 'leave_room' });
            setOnlineRoomCode(null);
            setOnlineSlot(null);
            setOnlinePlayers([]);
          }}
          onBack={() => setGameState('TITLE_MENU')}
        />
      )}

      {(gameState === 'PLAYING' ||
        gameState === 'PAUSED' ||
        gameState === 'GAME_OVER') && (
        <div className="relative w-full h-[100dvh] bg-[#0e1113] flex flex-col overflow-hidden">
          {/* Arena Viewport */}
          <div className="relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className={
                dockedControls
                  ? 'w-full h-full max-w-full max-h-full block'
                  : 'w-full h-full block'
              }
            />

            {hud && (
              <GameHud
                hud={hud}
                muted={muted}
                showTouch={showTouch}
                craftOpen={craftOpen}
                weaponShopOpen={weaponShopOpen}
                onToggleMute={handleToggleMute}
                onToggleTouch={() => setShowTouch((v) => !v)}
                onToggleCraft={() => {
                  setWeaponShopOpen(false);
                  setCraftOpen((v) => !v);
                }}
                onToggleWeaponShop={() => {
                  setCraftOpen(false);
                  setWeaponShopOpen((v) => !v);
                }}
                onOpenMusic={() => setMusicOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onSwitchPlayerCount={handleSwitchPlayerCountInGame}
                onPause={() =>
                  setGameState((s) => (s === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
                }
              />
            )}

            {hud && craftOpen && (
              <CraftingPanel
                hud={hud}
                onCraft={handleCraft}
                onClose={() => setCraftOpen(false)}
              />
            )}

            {hud && weaponShopOpen && (
              <WeaponShopPanel
                hud={hud}
                onBuyOrEquip={handleBuyOrEquipWeapon}
                onClose={() => setWeaponShopOpen(false)}
              />
            )}

            {hud && showTouch && !dockedControls && (
              <TouchControls
                hud={hud}
                docked={false}
                touchScale={touchScale}
                onTouchState={handleTouchState}
                onEmote={handleEmote}
              />
            )}
          </div>

          {/* Portrait Mobile Docked Controls */}
          {hud && dockedControls && (
            <TouchControls
              hud={hud}
              docked={true}
              touchScale={touchScale}
              onTouchState={handleTouchState}
              onEmote={handleEmote}
            />
          )}

          {/* Pause Modal */}
          {gameState === 'PAUSED' && (
            <PauseModal
              playerCount={playerCount}
              isOnline={isOnline}
              onSwitchPlayerCount={handleSwitchPlayerCountInGame}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenMusic={() => setMusicOpen(true)}
              onResume={() => setGameState('PLAYING')}
              onRestart={() => startNewGame(mode, p1Class, p2Class, playerCount)}
              onChangeChars={() => setGameState('CHARACTER_SELECT')}
              onMainMenu={() => {
                if (isOnline) leaveOnlineMatchToMenu();
                else setGameState('TITLE_MENU');
              }}
            />
          )}

          {/* Game Over Modal */}
          {gameState === 'GAME_OVER' && hud && (
            <GameOverModal
              hud={hud}
              onPlayAgain={() => {
                if (isOnline) {
                  sendWs({ type: 'rematch' });
                } else {
                  startNewGame(mode, p1Class, p2Class, playerCount);
                }
              }}
              onSwitchPlayerCount={handleSwitchPlayerCountInGame}
              onChangeChars={() => setGameState('CHARACTER_SELECT')}
              onMainMenu={() => {
                if (isOnline) leaveOnlineMatchToMenu();
                else setGameState('TITLE_MENU');
              }}
            />
          )}
        </div>
      )}

      {/* Global Music Player Modal */}
      {musicOpen && (
        <MusicPanel
          onClose={() => setMusicOpen(false)}
          onVolumeChange={(v) => {
            setMusicVolume(v);
            persistProfile({ musicVolume: v });
          }}
          onLoopChange={(loop) => {
            setMusicLoop(loop);
            persistProfile({ musicLoop: loop });
          }}
        />
      )}

      {/* Global Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          p1Name={p1Name}
          p2Name={p2Name}
          muted={muted}
          showTouch={showTouch}
          touchScale={touchScale}
          screenShake={screenShake}
          musicVolume={musicVolume}
          onChangeP1Name={setP1Name}
          onChangeP2Name={setP2Name}
          onToggleMute={handleToggleMute}
          onToggleTouch={() => setShowTouch((v) => !v)}
          onChangeTouchScale={setTouchScale}
          onToggleScreenShake={() => setScreenShake((v) => !v)}
          onChangeMusicVolume={(v) => {
            setMusicVolume(v);
            musicPlayer.setVolume(v);
          }}
          onOpenMusic={() => {
            setSettingsOpen(false);
            setMusicOpen(true);
          }}
          onSaveChanges={() => {
            persistProfile();
            if (worldRef.current && !isOnlineRef.current) {
              worldRef.current.players[0].customName = p1Name.trim();
              if (!worldRef.current.players[1].isBot) {
                worldRef.current.players[1].customName = p2Name.trim();
              }
              setHud(getHudSnapshot(worldRef.current));
            }
          }}
          onResetDefaults={handleResetDefaults}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
