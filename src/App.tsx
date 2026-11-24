import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CharacterSelect } from './components/CharacterSelect';
import { CraftingPanel } from './components/CraftingPanel';
import { GameHud } from './components/GameHud';
import { GameOverModal, PauseModal } from './components/GameModals';
import { TitleScreen } from './components/TitleScreen';
import { TouchActionKey, TouchControls } from './components/TouchControls';
import {
  ARENA_H,
  ARENA_W,
  SimulationWorld,
  craftItem,
  createWorld,
  getHudSnapshot,
  sendEmote,
  stepWorld,
} from './game/engine';
import { renderWorld } from './game/renderer';
import {
  CharacterClassId,
  CraftItemId,
  EmoteId,
  GameMode,
  GameState,
  HudSnapshot,
  PlayerCount,
  PlayerInput,
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
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('COOP');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [p1Class, setP1Class] = useState<CharacterClassId>('medic');
  const [p2Class, setP2Class] = useState<CharacterClassId>('engineer');
  const [muted, setMuted] = useState(false);
  const [craftOpen, setCraftOpen] = useState(false);
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const worldRef = useRef<SimulationWorld | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const heldKeysRef = useRef<Set<string>>(new Set());
  const touchHeldRef = useRef<[HeldFlags, HeldFlags]>([
    emptyFlags(),
    emptyFlags(),
  ]);
  const justPressedRef = useRef<[HeldFlags, HeldFlags]>([
    emptyFlags(),
    emptyFlags(),
  ]);

  useEffect(() => {
    const onResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startNewGame = useCallback(
    (
      selectedMode: GameMode,
      c1: CharacterClassId,
      c2: CharacterClassId,
      count: PlayerCount
    ) => {
      soundEngine.unlock();
      const world = createWorld(selectedMode, c1, c2, count);
      worldRef.current = world;
      heldKeysRef.current.clear();
      touchHeldRef.current = [emptyFlags(), emptyFlags()];
      justPressedRef.current = [emptyFlags(), emptyFlags()];
      setCraftOpen(false);
      setHud(getHudSnapshot(world));
      setGameState('PLAYING');
    },
    []
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

  const handleCraft = useCallback((playerId: 1 | 2, itemId: CraftItemId) => {
    const world = worldRef.current;
    if (!world) return;
    soundEngine.unlock();
    if (craftItem(world, playerId, itemId)) {
      setHud(getHudSnapshot(world));
    }
  }, []);

  const handleEmote = useCallback((playerId: 1 | 2, emoteId: EmoteId) => {
    const world = worldRef.current;
    if (!world) return;
    soundEngine.unlock();
    sendEmote(world, playerId, emoteId);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
        setCraftOpen((prev) => !prev);
        return;
      }

      if (gameStateRef.current !== 'PLAYING') return;

      if (code.startsWith('Arrow') || code === 'Space') {
        e.preventDefault();
      }

      const alreadyHeld = heldKeysRef.current.has(code);
      heldKeysRef.current.add(code);

      if (!alreadyHeld) {
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

        renderWorld(ctx, world, now / 1000);
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [gameState]);

  if (gameState === 'TITLE_MENU') {
    return (
      <TitleScreen
        mode={mode}
        playerCount={playerCount}
        onSelectMode={setMode}
        onSelectPlayerCount={setPlayerCount}
        onStart={() => {
          soundEngine.unlock();
          setGameState('CHARACTER_SELECT');
        }}
        muted={muted}
        onToggleMute={handleToggleMute}
      />
    );
  }

  if (gameState === 'CHARACTER_SELECT') {
    return (
      <CharacterSelect
        mode={mode}
        playerCount={playerCount}
        p1Class={p1Class}
        p2Class={p2Class}
        onSelectPlayerCount={setPlayerCount}
        onSelectP1={setP1Class}
        onSelectP2={setP2Class}
        onBack={() => setGameState('TITLE_MENU')}
        onConfirm={() => startNewGame(mode, p1Class, p2Class, playerCount)}
      />
    );
  }

  const dockedControls = isPortrait && showTouch;

  return (
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
            onToggleMute={handleToggleMute}
            onToggleTouch={() => setShowTouch((v) => !v)}
            onToggleCraft={() => setCraftOpen((v) => !v)}
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

        {hud && showTouch && !dockedControls && (
          <TouchControls
            hud={hud}
            docked={false}
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
          onTouchState={handleTouchState}
          onEmote={handleEmote}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          playerCount={playerCount}
          onSwitchPlayerCount={handleSwitchPlayerCountInGame}
          onResume={() => setGameState('PLAYING')}
          onRestart={() => startNewGame(mode, p1Class, p2Class, playerCount)}
          onChangeChars={() => setGameState('CHARACTER_SELECT')}
          onMainMenu={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && hud && (
        <GameOverModal
          hud={hud}
          onPlayAgain={() => startNewGame(mode, p1Class, p2Class, playerCount)}
          onSwitchPlayerCount={handleSwitchPlayerCountInGame}
          onChangeChars={() => setGameState('CHARACTER_SELECT')}
          onMainMenu={() => setGameState('TITLE_MENU')}
        />
      )}
    </div>
  );
}
