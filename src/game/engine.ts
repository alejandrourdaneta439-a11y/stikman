import { soundEngine } from '../audio/soundEngine';
import {
  CHARACTER_CLASSES,
  CRAFT_RECIPES,
  EMOTE_LIST,
} from './characters';
import {
  Barrel,
  BuiltStructure,
  CharacterClassId,
  CraftItemId,
  EmoteId,
  EnemyKind,
  EnemyState,
  FloatingText,
  GameMode,
  HazardZone,
  HudSnapshot,
  Particle,
  Platform,
  PlayerCount,
  PlayerInput,
  PlayerState,
  Projectile,
  ResourceBag,
  ResourceNode,
  ResourceType,
  SupplyDrop,
  SupplyKind,
  WeatherState,
  WeatherType,
} from './types';

export const WEATHER_CYCLE_SEC = 120;
const WEATHER_ROTATION: WeatherType[] = [
  'clear',
  'radiation_storm',
  'acid_rain',
  'ash_blizzard',
];

export const ARENA_W = 1280;
export const ARENA_H = 720;
export const GROUND_Y = 632;
export const GRAVITY = 1450;

export const PLATFORMS: Platform[] = [
  {
    id: 'ground',
    x: 0,
    y: GROUND_Y,
    w: ARENA_W,
    h: ARENA_H - GROUND_Y,
    style: 'ground',
  },
  {
    id: 'bunker_roof',
    x: 470,
    y: 472,
    w: 340,
    h: 22,
    isShelter: true,
    isBunkerRoof: true,
    style: 'bunker',
  },
  {
    id: 'left_overpass',
    x: 75,
    y: 486,
    w: 255,
    h: 18,
    isShelter: true,
    style: 'concrete',
  },
  {
    id: 'right_overpass',
    x: 950,
    y: 486,
    w: 255,
    h: 18,
    isShelter: true,
    style: 'concrete',
  },
  {
    id: 'left_catwalk',
    x: 215,
    y: 325,
    w: 205,
    h: 14,
    style: 'steel',
  },
  {
    id: 'right_catwalk',
    x: 860,
    y: 325,
    w: 205,
    h: 14,
    style: 'steel',
  },
  {
    id: 'center_catwalk',
    x: 540,
    y: 250,
    w: 200,
    h: 14,
    style: 'steel',
  },
];

export interface SimulationWorld {
  mode: GameMode;
  playerCount: PlayerCount;
  wave: number;
  waveEnemiesToSpawn: number;
  spawnTimer: number;
  waveBannerTimer: number;
  teamScore: number;
  resources: ResourceBag;
  gameOver: boolean;
  winnerId: 1 | 2 | 'coop' | 'draw' | null;

  players: [PlayerState, PlayerState];
  enemies: EnemyState[];
  projectiles: Projectile[];
  hazards: HazardZone[];
  barrels: Barrel[];
  resourceNodes: ResourceNode[];
  structures: BuiltStructure[];
  supplies: SupplyDrop[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  weather: WeatherState;

  supplyTimer: number;
  shakeIntensity: number;
  hitstopTimer: number;
  nextId: number;
  ambientAshTimer: number;
  geigerTimer: number;
}

function createPlayer(
  id: 1 | 2,
  classId: CharacterClassId,
  x: number,
  facing: 1 | -1
): PlayerState {
  const def = CHARACTER_CLASSES[classId];
  const scarfPoints = Array.from({ length: 5 }, (_, i) => ({
    x: x - facing * i * 7,
    y: GROUND_Y - 52,
  }));
  return {
    id,
    classId,
    x,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    w: 32,
    h: 64,
    facing,
    onGround: true,
    jumpsRemaining: def.maxJumps,
    coyoteTimer: 0,
    jumpBufferTimer: 0,

    hp: def.maxHp,
    maxHp: def.maxHp,
    rad: 0,
    shieldTimer: 0,
    overchargeTimer: 0,
    invulnTimer: 0,
    hitFlashTimer: 0,

    attackTimer: 0,
    attackAnimTimer: 0,
    specialTimer: 0,
    maxSpecialCooldown: def.specialCooldown,

    hasPickaxe: false,
    activeEmote: null,
    emoteTimer: 0,

    enabled: true,
    isBot: false,
    downed: false,
    downedTimer: 14,
    reviveProgress: 0,
    dead: false,

    walkCycle: 0,
    squashX: 1,
    squashY: 1,
    scarfPoints,

    kills: 0,
    damageDealt: 0,
    revives: 0,
    craftedCount: 0,
    score: 0,
  };
}

function createInitialResourceNodes(): ResourceNode[] {
  const spots: { type: ResourceType; x: number; y: number }[] = [
    { type: 'wood', x: 165, y: 486 },
    { type: 'metal', x: 315, y: GROUND_Y },
    { type: 'electronics', x: 315, y: 325 },
    { type: 'wood', x: 640, y: GROUND_Y },
    { type: 'electronics', x: 640, y: 250 },
    { type: 'metal', x: 965, y: GROUND_Y },
    { type: 'electronics', x: 965, y: 325 },
    { type: 'wood', x: 1110, y: 486 },
  ];
  return spots.map((s, idx) => ({
    id: idx + 1,
    type: s.type,
    x: s.x,
    y: s.y,
    amount: 3,
    maxAmount: 3,
    respawnTimer: 0,
    active: true,
    hitFlashTimer: 0,
  }));
}

export function createWorld(
  mode: GameMode,
  p1Class: CharacterClassId,
  p2Class: CharacterClassId,
  playerCount: PlayerCount = 2
): SimulationWorld {
  const p1 = createPlayer(1, p1Class, mode === 'PVP' ? 220 : 540, 1);
  const p2 = createPlayer(2, p2Class, mode === 'PVP' ? 1060 : 740, -1);

  if (playerCount === 1 && mode === 'COOP') {
    p2.enabled = false;
    p2.dead = true;
    p2.hp = 0;
  } else if (playerCount === 1 && mode === 'PVP') {
    p2.isBot = true;
  }

  return {
    mode,
    playerCount,
    wave: 1,
    waveEnemiesToSpawn: mode === 'COOP' ? (playerCount === 1 ? 4 : 6) : 0,
    spawnTimer: 1.0,
    waveBannerTimer: 2.5,
    teamScore: 0,
    resources: {
      wood: 3,
      metal: 3,
      electronics: 2,
    },
    gameOver: false,
    winnerId: null,

    players: [p1, p2],
    enemies: [],
    projectiles: [],
    hazards: [],
    barrels: [
      {
        id: 1,
        x: 410,
        y: GROUND_Y,
        w: 30,
        h: 42,
        hp: 40,
        maxHp: 40,
        hitFlashTimer: 0,
        respawnTimer: 0,
        active: true,
      },
      {
        id: 2,
        x: 640,
        y: 472,
        w: 30,
        h: 42,
        hp: 40,
        maxHp: 40,
        hitFlashTimer: 0,
        respawnTimer: 0,
        active: true,
      },
      {
        id: 3,
        x: 870,
        y: GROUND_Y,
        w: 30,
        h: 42,
        hp: 40,
        maxHp: 40,
        hitFlashTimer: 0,
        respawnTimer: 0,
        active: true,
      },
    ],
    resourceNodes: createInitialResourceNodes(),
    structures: [],
    supplies: [],
    particles: [],
    floatingTexts: [],
    weather: {
      current: 'clear',
      next: 'radiation_storm',
      timer: WEATHER_CYCLE_SEC,
      duration: WEATHER_CYCLE_SEC,
      intensity: 0,
      windDir: 1,
      acidPoolTimer: 6,
      drainTickTimer: 0,
    },

    supplyTimer: 8,
    shakeIntensity: 0,
    hitstopTimer: 0,
    nextId: 100,
    ambientAshTimer: 0,
    geigerTimer: 0,
  };
}

function spawnParticles(
  world: SimulationWorld,
  x: number,
  y: number,
  count: number,
  color: string,
  speedMin: number,
  speedMax: number,
  sizeMin: number,
  sizeMax: number,
  gravity = 420
): void {
  for (let i = 0; i < count; i++) {
    if (world.particles.length > 260) {
      world.particles.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const life = 0.25 + Math.random() * 0.45;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      color,
      alpha: 1,
      life,
      maxLife: life,
      gravity,
    });
  }
}

function spawnShockwave(
  world: SimulationWorld,
  x: number,
  y: number,
  color: string,
  size: number
): void {
  world.particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    size,
    color,
    alpha: 0.9,
    life: 0.28,
    maxLife: 0.28,
    gravity: 0,
    ring: true,
  });
}

function addFloatingText(
  world: SimulationWorld,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  world.floatingTexts.push({
    x,
    y,
    vy: -55,
    text,
    color,
    life: 0.95,
    maxLife: 0.95,
  });
}

function isUnderShelter(
  world: SimulationWorld,
  x: number,
  y: number
): boolean {
  for (const p of PLATFORMS) {
    if (p.isShelter && x >= p.x + 6 && x <= p.x + p.w - 6 && y > p.y + p.h) {
      return true;
    }
  }
  for (const st of world.structures) {
    if (
      st.kind === 'shelter' &&
      Math.abs(x - st.x) <= st.w * 0.55 &&
      y >= st.y - st.h &&
      y <= st.y + 8
    ) {
      return true;
    }
  }
  return false;
}

export function getEffectiveCost(
  classId: CharacterClassId,
  itemId: CraftItemId
): ResourceBag {
  const recipe = CRAFT_RECIPES.find((r) => r.id === itemId)!;
  if (classId !== 'engineer') return { ...recipe.cost };
  return {
    wood: recipe.cost.wood > 1 ? recipe.cost.wood - 1 : recipe.cost.wood,
    metal: recipe.cost.metal > 1 ? recipe.cost.metal - 1 : recipe.cost.metal,
    electronics:
      recipe.cost.electronics > 1
        ? recipe.cost.electronics - 1
        : recipe.cost.electronics,
  };
}

export function craftItem(
  world: SimulationWorld,
  playerId: 1 | 2,
  itemId: CraftItemId
): boolean {
  const player = world.players[playerId - 1];
  if (!player || player.dead || player.downed) return false;
  if (itemId === 'pickaxe' && player.hasPickaxe) return false;

  const cost = getEffectiveCost(player.classId, itemId);
  if (
    world.resources.wood < cost.wood ||
    world.resources.metal < cost.metal ||
    world.resources.electronics < cost.electronics
  ) {
    return false;
  }

  world.resources.wood -= cost.wood;
  world.resources.metal -= cost.metal;
  world.resources.electronics -= cost.electronics;
  player.craftedCount += 1;
  player.score += 80;
  world.teamScore += 80;
  soundEngine.playCraft();

  const isEng = player.classId === 'engineer';
  const isMed = player.classId === 'medic';

  if (itemId === 'pickaxe') {
    player.hasPickaxe = true;
    addFloatingText(world, player.x, player.y - 76, '+PICO MEJORADO', '#fbbf24');
  } else if (itemId === 'bandage') {
    const heal = isMed ? 70 : 45;
    player.hp = Math.min(player.maxHp, player.hp + heal);
    addFloatingText(world, player.x, player.y - 76, `+${heal} HP`, '#34d399');
  } else if (itemId === 'antirad') {
    player.rad = Math.max(0, player.rad - 60);
    addFloatingText(world, player.x, player.y - 76, '-60% RAD', '#38bdf8');
  } else if (itemId === 'trap') {
    const maxHp = isEng ? 150 : 100;
    world.structures.push({
      id: world.nextId++,
      kind: 'trap',
      x: player.x + player.facing * 28,
      y: player.y,
      w: 56,
      h: 14,
      hp: maxHp,
      maxHp,
      life: isEng ? 45 : 30,
      maxLife: isEng ? 45 : 30,
      ownerId: player.id,
      fireTimer: 0,
      hitFlashTimer: 0,
    });
    addFloatingText(world, player.x, player.y - 76, 'TRAMPA LISTA', '#f97316');
  } else if (itemId === 'shelter') {
    const maxHp = isEng ? 360 : 240;
    world.structures.push({
      id: world.nextId++,
      kind: 'shelter',
      x: player.x,
      y: player.y,
      w: 112,
      h: 82,
      hp: maxHp,
      maxHp,
      life: isEng ? 55 : 38,
      maxLife: isEng ? 55 : 38,
      ownerId: player.id,
      fireTimer: 0,
      hitFlashTimer: 0,
    });
    addFloatingText(world, player.x, player.y - 90, 'REFUGIO CONSTRUIDO', '#38bdf8');
  } else if (itemId === 'turret') {
    const maxHp = isEng ? 200 : 130;
    world.structures.push({
      id: world.nextId++,
      kind: 'turret',
      x: player.x + player.facing * 24,
      y: player.y,
      w: 34,
      h: 42,
      hp: maxHp,
      maxHp,
      life: isEng ? 42 : 28,
      maxLife: isEng ? 42 : 28,
      ownerId: player.id,
      fireTimer: 0.3,
      hitFlashTimer: 0,
    });
    addFloatingText(world, player.x, player.y - 76, 'TORRETA ACTIVA', '#fbbf24');
  }

  spawnParticles(world, player.x, player.y - 26, 10, '#38bdf8', 40, 150, 2, 4, 120);
  return true;
}

export function sendEmote(
  world: SimulationWorld,
  playerId: 1 | 2,
  emoteId: EmoteId
): void {
  const player = world.players[playerId - 1];
  if (!player || player.dead) return;
  const emote = EMOTE_LIST.find((e) => e.id === emoteId);
  if (!emote) return;
  player.activeEmote = emote;
  player.emoteTimer = 3.2;
  soundEngine.playRadioChirp();
}

function harvestNode(
  world: SimulationWorld,
  node: ResourceNode,
  player: PlayerState
): void {
  if (!node.active) return;
  const bonus =
    (player.hasPickaxe ? 1 : 0) + (player.classId === 'engineer' ? 1 : 0);
  const yieldAmt = 1 + bonus;
  node.amount -= 1;
  node.hitFlashTimer = 0.14;

  world.resources[node.type] += yieldAmt;
  player.score += 35 * yieldAmt;
  world.teamScore += 35 * yieldAmt;

  const labelMap: Record<ResourceType, { label: string; color: string }> = {
    wood: { label: 'MADERA', color: '#d97706' },
    metal: { label: 'METAL', color: '#94a3b8' },
    electronics: { label: 'CIRCUITO', color: '#38bdf8' },
  };
  const info = labelMap[node.type];
  addFloatingText(
    world,
    node.x,
    node.y - 38,
    `+${yieldAmt} ${info.label}`,
    info.color
  );
  spawnParticles(world, node.x, node.y - 16, 8, info.color, 50, 170, 2, 4);
  soundEngine.playPickup();

  if (node.amount <= 0) {
    node.active = false;
    node.respawnTimer = 14;
  }
}

function damagePlayer(
  world: SimulationWorld,
  player: PlayerState,
  rawDamage: number,
  radDamage: number,
  knockX = 0,
  attackerId?: 1 | 2
): void {
  if (player.dead || player.downed) return;
  if (player.invulnTimer > 0) return;

  const def = CHARACTER_CLASSES[player.classId];

  if (player.shieldTimer > 0) {
    addFloatingText(world, player.x, player.y - 72, 'BLOQUEADO', '#e2e8f0');
    spawnParticles(world, player.x, player.y - 34, 6, '#e2e8f0', 60, 160, 2, 4);
    soundEngine.playHit();
    return;
  }

  let dmgMult = 1;
  // Built shelter reduces incoming hit damage by 45%
  for (const st of world.structures) {
    if (
      st.kind === 'shelter' &&
      Math.abs(player.x - st.x) < st.w * 0.55 &&
      Math.abs(player.y - st.y) < 30
    ) {
      dmgMult *= 0.55;
      st.hp -= rawDamage * 0.5;
      st.hitFlashTimer = 0.1;
      break;
    }
  }

  const other = world.players[player.id === 1 ? 1 : 0];
  if (
    world.mode === 'COOP' &&
    !other.dead &&
    !other.downed &&
    other.shieldTimer > 0 &&
    Math.hypot(other.x - player.x, other.y - player.y) < 120
  ) {
    dmgMult *= 0.4;
  }

  const finalDamage = Math.max(1, Math.round(rawDamage * dmgMult));
  const finalRad = radDamage * (1 - def.radResist);

  player.hp = Math.max(0, player.hp - finalDamage);
  player.rad = Math.min(100, player.rad + finalRad);
  player.hitFlashTimer = 0.14;
  player.vx += knockX;
  player.squashX = 1.25;
  player.squashY = 0.78;

  if (attackerId && attackerId !== player.id) {
    world.players[attackerId - 1].damageDealt += finalDamage;
  }

  addFloatingText(
    world,
    player.x + (Math.random() - 0.5) * 16,
    player.y - 68,
    `-${finalDamage}`,
    '#fb7185'
  );
  spawnParticles(world, player.x, player.y - 32, 8, '#fb7185', 80, 220, 2, 5);
  soundEngine.playHit();

  if (player.hp <= 0) {
    if (world.mode === 'COOP' && world.playerCount === 2) {
      player.downed = true;
      player.downedTimer = 15;
      player.reviveProgress = 0;
      addFloatingText(world, player.x, player.y - 80, '¡HERIDO!', '#f59e0b');
      world.shakeIntensity = Math.max(world.shakeIntensity, 8);
    } else {
      player.dead = true;
      if (attackerId && attackerId !== player.id) {
        world.players[attackerId - 1].kills += 1;
        world.players[attackerId - 1].score += 500;
      }
      world.shakeIntensity = Math.max(world.shakeIntensity, 12);
      spawnParticles(world, player.x, player.y - 32, 24, '#fb7185', 100, 320, 3, 7);
    }
  }
}

function damageEnemy(
  world: SimulationWorld,
  enemy: EnemyState,
  dmg: number,
  knockX: number,
  attackerId: 1 | 2
): void {
  enemy.hp -= dmg;
  enemy.hitFlashTimer = 0.12;
  enemy.vx += knockX;
  const attacker = world.players[attackerId - 1];
  attacker.damageDealt += dmg;

  addFloatingText(
    world,
    enemy.x + (Math.random() - 0.5) * 14,
    enemy.y - enemy.h - 8,
    `${Math.round(dmg)}`,
    '#f8fafc'
  );
  spawnParticles(world, enemy.x, enemy.y - enemy.h * 0.5, 6, '#84cc16', 70, 200, 2, 5);

  if (enemy.hp <= 0) {
    attacker.kills += 1;
    attacker.score += enemy.scoreValue;
    world.teamScore += enemy.scoreValue;

    // Chance to drop resources
    const roll = Math.random();
    if (roll < 0.4) {
      world.resources.metal += 1;
      addFloatingText(world, enemy.x, enemy.y - 40, '+1 METAL', '#94a3b8');
    } else if (roll < 0.7) {
      world.resources.wood += 1;
      addFloatingText(world, enemy.x, enemy.y - 40, '+1 MADERA', '#d97706');
    } else if (roll < 0.92) {
      world.resources.electronics += 1;
      addFloatingText(world, enemy.x, enemy.y - 40, '+1 CIRCUITO', '#38bdf8');
    }

    spawnParticles(world, enemy.x, enemy.y - enemy.h * 0.5, 18, '#84cc16', 90, 280, 3, 6);
    soundEngine.playHit();
  }
}

function triggerExplosion(
  world: SimulationWorld,
  x: number,
  y: number,
  radius: number,
  damage: number,
  color: string,
  clearAcid: boolean,
  attackerId?: 1 | 2
): void {
  soundEngine.playExplosion();
  world.shakeIntensity = Math.max(world.shakeIntensity, 13);
  world.hitstopTimer = Math.max(world.hitstopTimer, 0.045);
  spawnShockwave(world, x, y, color, radius);
  spawnParticles(world, x, y, 28, color, 120, 420, 3, 8, 250);
  spawnParticles(world, x, y, 16, '#fbbf24', 90, 300, 2, 6, 180);

  if (clearAcid) {
    world.hazards = world.hazards.filter(
      (h) => !(h.kind === 'acid' && Math.hypot(h.x - x, h.y - y) < radius + 30)
    );
  }

  for (const enemy of world.enemies) {
    const d = Math.hypot(enemy.x - x, enemy.y - enemy.h * 0.5 - y);
    if (d <= radius) {
      const falloff = 1 - (d / radius) * 0.4;
      const dir = enemy.x >= x ? 1 : -1;
      damageEnemy(
        world,
        enemy,
        Math.round(damage * falloff),
        dir * 260,
        attackerId || 1
      );
    }
  }

  for (const player of world.players) {
    if (player.dead || player.downed) continue;
    if (clearAcid && world.mode === 'COOP') continue;
    const d = Math.hypot(player.x - x, player.y - 32 - y);
    if (d <= radius) {
      const mult = world.mode === 'COOP' ? 0.35 : 0.8;
      const dir = player.x >= x ? 1 : -1;
      damagePlayer(
        world,
        player,
        Math.round(damage * mult),
        clearAcid ? 0 : 12,
        dir * 280,
        attackerId
      );
    }
  }

  for (const barrel of world.barrels) {
    if (!barrel.active) continue;
    const d = Math.hypot(barrel.x - x, barrel.y - 21 - y);
    if (d > 4 && d <= radius) {
      barrel.hp = 0;
    }
  }
}

function spawnEnemy(world: SimulationWorld): void {
  const wave = world.wave;
  const roll = Math.random();
  let kind: EnemyKind = 'crawler';
  if (wave >= 3 && world.waveEnemiesToSpawn === 1 && wave % 3 === 0) {
    kind = 'brute';
  } else if (wave >= 2 && roll > 0.72) {
    kind = 'drone';
  } else if (roll > 0.48) {
    kind = 'spitter';
  }

  const fromLeft = Math.random() < 0.5;
  const x = fromLeft ? -30 : ARENA_W + 30;
  const y = kind === 'drone' ? 140 + Math.random() * 140 : GROUND_Y;

  const hpScale = 1 + (wave - 1) * 0.22;
  const stats: Record<
    EnemyKind,
    { w: number; h: number; hp: number; score: number }
  > = {
    crawler: { w: 30, h: 54, hp: 55, score: 100 },
    spitter: { w: 34, h: 58, hp: 70, score: 140 },
    drone: { w: 36, h: 28, hp: 60, score: 160 },
    brute: { w: 50, h: 88, hp: 310, score: 450 },
  };
  const s = stats[kind];
  const alivePlayers = world.players.filter((p) => !p.dead && !p.downed);
  const target =
    alivePlayers.length > 0
      ? alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id
      : 1;

  world.enemies.push({
    id: world.nextId++,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    w: s.w,
    h: s.h,
    facing: fromLeft ? 1 : -1,
    hp: Math.round(s.hp * hpScale),
    maxHp: Math.round(s.hp * hpScale),
    onGround: kind !== 'drone',
    state: 'chase',
    stateTimer: 0,
    hitFlashTimer: 0,
    slowTimer: 0,
    walkCycle: Math.random() * 6,
    targetPlayerId: target,
    scoreValue: s.score,
  });
}

function performPlayerAttack(
  world: SimulationWorld,
  player: PlayerState
): void {
  const def = CHARACTER_CLASSES[player.classId];
  const dmgBoost = player.overchargeTimer > 0 ? 1.55 : 1;
  const cdMult = player.overchargeTimer > 0 ? 0.6 : 1;
  player.attackTimer = def.attackCooldown * cdMult;
  player.attackAnimTimer = 0.18;

  soundEngine.playShoot(player.classId);

  // Check if player is right next to a resource node to harvest it!
  for (const node of world.resourceNodes) {
    if (
      node.active &&
      Math.hypot(node.x - (player.x + player.facing * 20), node.y - player.y) <
        58
    ) {
      harvestNode(world, node, player);
      break;
    }
  }

  const ownerType = player.id === 1 ? 'player1' : 'player2';
  const muzzleX = player.x + player.facing * 24;
  const muzzleY = player.y - 38;

  if (player.classId === 'juggernaut') {
    const hitCenterX = player.x + player.facing * 52;
    const hitCenterY = player.y - 34;
    const extraDmg = player.hasPickaxe ? 14 : 0;
    spawnShockwave(world, hitCenterX, hitCenterY, '#e2e8f0', 68);
    spawnParticles(world, hitCenterX, hitCenterY, 10, '#fbbf24', 80, 220, 2, 5);
    world.shakeIntensity = Math.max(world.shakeIntensity, 5);

    for (const enemy of world.enemies) {
      const dx = enemy.x - hitCenterX;
      const dy = enemy.y - enemy.h * 0.5 - hitCenterY;
      if (Math.hypot(dx, dy) <= 78) {
        damageEnemy(
          world,
          enemy,
          Math.round((48 + extraDmg) * dmgBoost),
          player.facing * 320,
          player.id
        );
        world.hitstopTimer = Math.max(world.hitstopTimer, 0.035);
      }
    }

    for (const proj of world.projectiles) {
      if (
        proj.ownerType === 'enemy' ||
        (world.mode === 'PVP' && proj.ownerType !== ownerType)
      ) {
        if (Math.hypot(proj.x - hitCenterX, proj.y - hitCenterY) <= 74) {
          proj.vx = -proj.vx * 1.3;
          proj.vy = -Math.abs(proj.vy) * 0.5;
          proj.ownerType = ownerType;
          proj.color = '#fbbf24';
        }
      }
    }

    for (const barrel of world.barrels) {
      if (
        barrel.active &&
        Math.hypot(barrel.x - hitCenterX, barrel.y - 21 - hitCenterY) <= 74
      ) {
        barrel.hp -= 40;
        barrel.hitFlashTimer = 0.12;
      }
    }

    if (world.mode === 'PVP') {
      const opp = world.players[player.id === 1 ? 1 : 0];
      if (!opp.dead && Math.hypot(opp.x - hitCenterX, opp.y - 32 - hitCenterY) <= 74) {
        damagePlayer(
          world,
          opp,
          Math.round(34 * dmgBoost),
          4,
          player.facing * 360,
          player.id
        );
        world.hitstopTimer = Math.max(world.hitstopTimer, 0.04);
      }
    }
    return;
  }

  if (player.classId === 'engineer') {
    world.projectiles.push({
      id: world.nextId++,
      ownerType,
      kind: 'bullet',
      x: muzzleX,
      y: muzzleY,
      vx: player.facing * 760,
      vy: (Math.random() - 0.5) * 28,
      radius: 5,
      damage: Math.round((24 + (player.hasPickaxe ? 4 : 0)) * dmgBoost),
      radDamage: 0,
      life: 1.1,
      pierce: 1,
      color: '#fbbf24',
      trail: [],
    });
    player.vx -= player.facing * 18;
    return;
  }

  if (player.classId === 'medic') {
    world.projectiles.push({
      id: world.nextId++,
      ownerType,
      kind: 'plasma',
      x: muzzleX,
      y: muzzleY,
      vx: player.facing * 690,
      vy: 0,
      radius: 6,
      damage: Math.round((25 + (player.hasPickaxe ? 4 : 0)) * dmgBoost),
      radDamage: 0,
      life: 1.2,
      pierce: 2,
      color: '#34d399',
      trail: [],
    });
    return;
  }

  // Scout rail shot
  world.projectiles.push({
    id: world.nextId++,
    ownerType,
    kind: 'rail',
    x: muzzleX,
    y: muzzleY,
    vx: player.facing * 1180,
    vy: 0,
    radius: 5,
    damage: Math.round((62 + (player.hasPickaxe ? 8 : 0)) * dmgBoost),
    radDamage: 0,
    life: 1.0,
    pierce: 4,
    color: '#d8b4fe',
    trail: [],
  });
  player.vx -= player.facing * 80;
  world.shakeIntensity = Math.max(world.shakeIntensity, 4);
}

function performPlayerSpecial(
  world: SimulationWorld,
  player: PlayerState
): void {
  const def = CHARACTER_CLASSES[player.classId];
  player.specialTimer = def.specialCooldown;
  soundEngine.playSpecial(player.classId);

  if (player.classId === 'medic') {
    world.hazards.push({
      id: world.nextId++,
      kind: 'healDome',
      x: player.x,
      y: player.y,
      radius: 145,
      life: 7.0,
      maxLife: 7.0,
      ownerId: player.id,
      tickTimer: 0,
    });
    addFloatingText(world, player.x, player.y - 76, 'DOMO CURATIVO', '#34d399');
  } else if (player.classId === 'engineer') {
    world.structures.push({
      id: world.nextId++,
      kind: 'turret',
      x: player.x + player.facing * 24,
      y: player.y,
      w: 34,
      h: 42,
      hp: 160,
      maxHp: 160,
      life: 24,
      maxLife: 24,
      ownerId: player.id,
      fireTimer: 0.2,
      hitFlashTimer: 0,
    });
    addFloatingText(world, player.x, player.y - 76, 'TORRETA LISTA', '#fbbf24');
  } else if (player.classId === 'scout') {
    world.hazards.push({
      id: world.nextId++,
      kind: 'mine',
      x: player.x,
      y: player.y,
      radius: 38,
      life: 14,
      maxLife: 14,
      ownerId: player.id,
      tickTimer: 0,
    });
    world.hazards.push({
      id: world.nextId++,
      kind: 'flare',
      x: player.x,
      y: player.y - 40,
      radius: 210,
      life: 5,
      maxLife: 5,
      ownerId: player.id,
      tickTimer: 0,
    });
    spawnParticles(world, player.x, player.y - 28, 16, '#d8b4fe', 60, 220, 4, 8, 60);
    player.vx = -player.facing * 430;
    player.vy = -340;
    player.invulnTimer = 0.45;
    addFloatingText(world, player.x, player.y - 76, 'BENGALA + MINA', '#d8b4fe');
  } else if (player.classId === 'juggernaut') {
    player.shieldTimer = 4.0;
    spawnShockwave(world, player.x, player.y - 32, '#e2e8f0', 95);
    addFloatingText(world, player.x, player.y - 76, 'ESCUDO!', '#e2e8f0');
    for (const enemy of world.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (Math.hypot(dx, dy) < 130) {
        const dir = dx >= 0 ? 1 : -1;
        enemy.vx += dir * 420;
        enemy.vy -= 180;
      }
    }
  }
}

function computeBotInput(
  world: SimulationWorld,
  bot: PlayerState
): PlayerInput {
  const opp = world.players[0];
  const input: PlayerInput = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpJustPressed: false,
    attackJustPressed: false,
    attackHeld: false,
    specialJustPressed: false,
  };
  if (!bot.enabled || bot.dead || opp.dead) return input;

  // Seek shelter during radiation storm or acid rain
  if (
    (world.weather.current === 'radiation_storm' ||
      world.weather.current === 'acid_rain') &&
    !isUnderShelter(world, bot.x, bot.y)
  ) {
    const shelterTargets = [202, 640, 1077];
    const nearestShelter = shelterTargets.reduce((best, cur) =>
      Math.abs(cur - bot.x) < Math.abs(best - bot.x) ? cur : best
    );
    if (nearestShelter < bot.x - 18) input.left = true;
    else if (nearestShelter > bot.x + 18) input.right = true;
    return input;
  }

  // Grab nearby ground supply drop
  const nearSupply = world.supplies.find(
    (s) => s.onGround && Math.abs(s.x - bot.x) < 260 && Math.abs(s.y - bot.y) < 120
  );
  const targetX = nearSupply ? nearSupply.x : opp.x;
  const targetY = nearSupply ? nearSupply.y : opp.y;

  const dx = targetX - bot.x;
  const dy = targetY - bot.y;
  const preferredDist = bot.classId === 'juggernaut' ? 46 : 240;

  if (!nearSupply && Math.abs(dx) < preferredDist - 35 && bot.classId !== 'juggernaut') {
    if (dx > 0) input.left = true;
    else input.right = true;
  } else if (Math.abs(dx) > (nearSupply ? 12 : preferredDist)) {
    if (dx > 0) input.right = true;
    else input.left = true;
  } else {
    bot.facing = opp.x >= bot.x ? 1 : -1;
  }

  if (bot.onGround && dy < -75 && Math.random() < 0.08) {
    input.jumpJustPressed = true;
    input.jumpHeld = true;
  }

  const oppDx = Math.abs(opp.x - bot.x);
  const oppDy = Math.abs(opp.y - bot.y);
  const attackRange = bot.classId === 'juggernaut' ? 84 : 520;
  if (oppDx < attackRange && oppDy < 95 && bot.attackTimer <= 0) {
    input.attackJustPressed = true;
    input.attackHeld = true;
  }

  if (bot.specialTimer <= 0 && (oppDx < 180 || bot.hp < bot.maxHp * 0.6)) {
    input.specialJustPressed = true;
  }

  return input;
}

export function stepWorld(
  world: SimulationWorld,
  rawDt: number,
  inputs: [PlayerInput, PlayerInput]
): void {
  if (world.gameOver) return;

  const dt = Math.min(rawDt, 0.05);
  const effectiveInputs: [PlayerInput, PlayerInput] = [
    inputs[0],
    world.players[1].isBot ? computeBotInput(world, world.players[1]) : inputs[1],
  ];

  if (world.shakeIntensity > 0) {
    world.shakeIntensity = Math.max(0, world.shakeIntensity - dt * 32);
  }

  if (world.hitstopTimer > 0) {
    world.hitstopTimer -= dt;
    return;
  }

  if (world.waveBannerTimer > 0) {
    world.waveBannerTimer = Math.max(0, world.waveBannerTimer - dt);
  }

  // Ambient drifting ash & weather particles
  world.ambientAshTimer -= dt;
  if (world.ambientAshTimer <= 0) {
    world.ambientAshTimer =
      world.weather.current === 'ash_blizzard' ? 0.05 : 0.14;
    if (world.particles.length < 235) {
      const wType = world.weather.current;
      world.particles.push({
        x: Math.random() * ARENA_W,
        y: -10,
        vx:
          wType === 'ash_blizzard'
            ? world.weather.windDir * (140 + Math.random() * 90)
            : -25 + Math.random() * 50,
        vy:
          wType === 'ash_blizzard'
            ? 85 + Math.random() * 55
            : 35 + Math.random() * 45,
        size: wType === 'ash_blizzard' ? 2 + Math.random() * 2.5 : 1.5 + Math.random() * 2,
        color:
          wType === 'radiation_storm' || wType === 'acid_rain'
            ? '#84cc16'
            : wType === 'ash_blizzard'
            ? '#cbd5e1'
            : '#94a3b8',
        alpha: wType === 'ash_blizzard' ? 0.65 : 0.45,
        life: 5,
        maxLife: 5,
        gravity: 0,
      });
    }
  }

  // 2-Minute Dynamic Weather Cycle
  world.weather.timer -= dt;
  if (world.weather.timer <= 0) {
    const nextWeather = world.weather.next;
    const nextIdx =
      (WEATHER_ROTATION.indexOf(nextWeather) + 1) % WEATHER_ROTATION.length;
    world.weather.current = nextWeather;
    world.weather.next = WEATHER_ROTATION[nextIdx];
    world.weather.timer = WEATHER_CYCLE_SEC;
    world.weather.duration = WEATHER_CYCLE_SEC;
    world.weather.windDir = Math.random() < 0.5 ? 1 : -1;
    world.weather.acidPoolTimer = 5.0;

    if (nextWeather !== 'clear') {
      soundEngine.playSiren();
    } else {
      soundEngine.playWaveClear();
    }

    const bannerMap: Record<WeatherType, { text: string; color: string }> = {
      clear: { text: 'CLIMA: CIELO DESPEJADO', color: '#38bdf8' },
      radiation_storm: {
        text: 'TORMENTA RADIACTIVA · ¡BUSCA REFUGIO!',
        color: '#f59e0b',
      },
      acid_rain: {
        text: 'LLUVIA ÁCIDA · DAÑA ESTRUCTURAS',
        color: '#84cc16',
      },
      ash_blizzard: {
        text: 'VENTISCA DE CENIZA · VIENTO FUERTE',
        color: '#cbd5e1',
      },
    };
    const msg = bannerMap[nextWeather];
    addFloatingText(world, ARENA_W * 0.5, 195, msg.text, msg.color);
  }

  if (world.weather.current !== 'clear') {
    world.weather.intensity = Math.min(1, world.weather.intensity + dt * 1.4);
  } else {
    world.weather.intensity = Math.max(0, world.weather.intensity - dt * 1.4);
  }

  // Acid Rain periodically forms small acid puddles on exposed open ground
  if (world.weather.current === 'acid_rain') {
    world.weather.acidPoolTimer -= dt;
    if (world.weather.acidPoolTimer <= 0) {
      world.weather.acidPoolTimer = 6.5;
      const px =
        Math.random() < 0.5
          ? 90 + Math.random() * 340
          : 850 + Math.random() * 340;
      if (!isUnderShelter(world, px, GROUND_Y)) {
        world.hazards.push({
          id: world.nextId++,
          kind: 'acid',
          x: px,
          y: GROUND_Y,
          radius: 44,
          life: 6.0,
          maxLife: 6.0,
          tickTimer: 0,
        });
      }
    }
  }

  // Supply Drop spawner
  world.supplyTimer -= dt;
  if (world.supplyTimer <= 0) {
    world.supplyTimer = world.mode === 'PVP' ? 8.5 : 10.5;
    const kinds: SupplyKind[] =
      world.mode === 'PVP'
        ? ['medkit', 'antirad', 'overcharge']
        : ['medkit', 'antirad', 'overcharge', 'resources'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    world.supplies.push({
      id: world.nextId++,
      kind,
      x: 110 + Math.random() * (ARENA_W - 220),
      y: -30,
      vy: 95,
      onGround: false,
      life: 18,
      bobPhase: Math.random() * 6,
    });
  }

  // Co-op Wave Spawner
  if (world.mode === 'COOP') {
    if (world.waveEnemiesToSpawn > 0) {
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        spawnEnemy(world);
        world.waveEnemiesToSpawn -= 1;
        world.spawnTimer = Math.max(0.65, 1.85 - world.wave * 0.1);
      }
    } else if (world.enemies.length === 0) {
      world.wave += 1;
      world.waveEnemiesToSpawn =
        world.playerCount === 1 ? 3 + world.wave : 5 + world.wave * 2;
      world.spawnTimer = 2.0;
      world.waveBannerTimer = 2.6;
      soundEngine.playWaveClear();
      for (const p of world.players) {
        if (p.enabled && !p.dead) {
          p.hp = Math.min(p.maxHp, p.hp + 20);
          p.downed = false;
          p.score += 150;
        }
      }
      world.teamScore += 200;
    }
  }

  // Update Resource Nodes
  for (const node of world.resourceNodes) {
    node.hitFlashTimer = Math.max(0, node.hitFlashTimer - dt);
    if (!node.active) {
      node.respawnTimer -= dt;
      if (node.respawnTimer <= 0) {
        node.active = true;
        node.amount = node.maxAmount;
      }
    }
  }

  // Update Built Structures (Shelters, Traps, Turrets)
  for (let i = world.structures.length - 1; i >= 0; i--) {
    const st = world.structures[i];
    st.life -= dt;
    st.hitFlashTimer = Math.max(0, st.hitFlashTimer - dt);

    // Acid Rain corrodes exposed built structures
    if (world.weather.current === 'acid_rain') {
      const ownerIsEng = world.players[st.ownerId - 1]?.classId === 'engineer';
      const engMult = ownerIsEng ? 0.55 : 1;
      const sheltered =
        st.kind !== 'shelter' && isUnderShelter(world, st.x, st.y);
      if (!sheltered) {
        const acidRate = st.kind === 'shelter' ? 2.6 : 6.0;
        st.hp -= acidRate * engMult * dt;
        if (Math.random() < dt * 2.5) {
          spawnParticles(
            world,
            st.x + (Math.random() - 0.5) * st.w * 0.7,
            st.y - st.h,
            2,
            '#84cc16',
            20,
            70,
            1.5,
            3,
            180
          );
        }
      }
    }

    if (st.life <= 0 || st.hp <= 0) {
      spawnParticles(world, st.x, st.y - st.h * 0.5, 10, '#94a3b8', 50, 180, 2, 5);
      world.structures.splice(i, 1);
      continue;
    }

    if (st.kind === 'trap') {
      st.fireTimer = Math.max(0, st.fireTimer - dt);
      if (st.fireTimer <= 0) {
        for (const e of world.enemies) {
          if (Math.abs(e.x - st.x) < st.w * 0.6 && Math.abs(e.y - st.y) < 30) {
            st.fireTimer = 0.65;
            st.hp -= 12;
            e.slowTimer = 1.6;
            damageEnemy(world, e, 28, -e.facing * 80, st.ownerId);
            break;
          }
        }
      }
    } else if (st.kind === 'turret') {
      st.fireTimer -= dt;
      if (st.fireTimer <= 0 && world.enemies.length > 0) {
        let nearest: EnemyState | null = null;
        let bestDist = 420;
        for (const e of world.enemies) {
          const d = Math.hypot(e.x - st.x, e.y - e.h * 0.5 - (st.y - 28));
          if (d < bestDist) {
            bestDist = d;
            nearest = e;
          }
        }
        if (nearest) {
          st.fireTimer = 0.55;
          const ang = Math.atan2(
            nearest.y - nearest.h * 0.5 - (st.y - 28),
            nearest.x - st.x
          );
          world.projectiles.push({
            id: world.nextId++,
            ownerType: st.ownerId === 1 ? 'player1' : 'player2',
            kind: 'turretBolt',
            x: st.x,
            y: st.y - 28,
            vx: Math.cos(ang) * 680,
            vy: Math.sin(ang) * 680,
            radius: 4,
            damage: 16,
            radDamage: 0,
            life: 0.9,
            pierce: 1,
            color: '#fbbf24',
            trail: [],
          });
        }
      }
    }
  }

  // Update Players
  let anyHighRad = false;
  for (let idx = 0; idx < 2; idx++) {
    const p = world.players[idx];
    if (!p.enabled) continue;
    const inp = effectiveInputs[idx];
    const def = CHARACTER_CLASSES[p.classId];

    p.squashX += (1 - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (1 - p.squashY) * Math.min(1, dt * 14);
    p.hitFlashTimer = Math.max(0, p.hitFlashTimer - dt);
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.shieldTimer = Math.max(0, p.shieldTimer - dt);
    p.overchargeTimer = Math.max(0, p.overchargeTimer - dt);
    p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackAnimTimer = Math.max(0, p.attackAnimTimer - dt);
    p.specialTimer = Math.max(0, p.specialTimer - dt);
    if (p.emoteTimer > 0) {
      p.emoteTimer -= dt;
      if (p.emoteTimer <= 0) p.activeEmote = null;
    }

    if (p.dead) continue;

    // Medic passive gentle self-regen
    if (!p.downed && p.classId === 'medic' && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + 1.4 * dt);
    }

    if (p.downed) {
      p.downedTimer -= dt;
      const ally = world.players[idx === 0 ? 1 : 0];
      if (
        !ally.dead &&
        !ally.downed &&
        Math.hypot(ally.x - p.x, ally.y - p.y) < 78
      ) {
        // Medic revives 2x faster!
        const reviveSpeed = ally.classId === 'medic' ? 0.95 : 1.85;
        p.reviveProgress += dt / reviveSpeed;
        if (p.reviveProgress >= 1) {
          p.downed = false;
          p.hp = Math.round(p.maxHp * (ally.classId === 'medic' ? 0.75 : 0.55));
          p.rad = Math.max(0, p.rad - 30);
          p.invulnTimer = 1.5;
          ally.revives += 1;
          ally.score += 250;
          world.teamScore += 250;
          soundEngine.playRevive();
          addFloatingText(world, p.x, p.y - 76, '¡REVIVIDO!', '#34d399');
          spawnShockwave(world, p.x, p.y - 24, '#34d399', 80);
        }
      } else {
        p.reviveProgress = Math.max(0, p.reviveProgress - dt * 0.4);
      }
      if (p.downedTimer <= 0) {
        p.dead = true;
      }
      continue;
    }

    const moveDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (moveDir !== 0) {
      p.facing = moveDir as 1 | -1;
      const targetVx = moveDir * def.speed;
      p.vx += (targetVx - p.vx) * Math.min(1, dt * 15);
      if (p.onGround) {
        p.walkCycle += dt * 12;
      }
    } else {
      p.vx *= Math.pow(0.001, dt);
      if (Math.abs(p.vx) < 4) p.vx = 0;
    }

    if (p.onGround) {
      p.coyoteTimer = 0.1;
      p.jumpsRemaining = def.maxJumps;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (inp.jumpJustPressed) {
      p.jumpBufferTimer = 0.12;
    } else {
      p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    }

    if (p.jumpBufferTimer > 0) {
      if (p.coyoteTimer > 0 || p.jumpsRemaining > 0) {
        p.vy = -def.jumpForce;
        p.onGround = false;
        if (p.coyoteTimer <= 0) {
          p.jumpsRemaining = Math.max(0, p.jumpsRemaining - 1);
          spawnParticles(world, p.x, p.y, 7, '#d8b4fe', 40, 120, 2, 4, 100);
        } else {
          p.jumpsRemaining = def.maxJumps - 1;
        }
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.squashX = 0.8;
        p.squashY = 1.24;
        soundEngine.playJump();
      }
    }

    if (!inp.jumpHeld && p.vy < -220) {
      p.vy += GRAVITY * dt * 1.4;
    }

    p.vy += GRAVITY * dt;
    const prevY = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Math.max(24, Math.min(ARENA_W - 24, p.x));

    const wasOnGround = p.onGround;
    p.onGround = false;

    for (const plat of PLATFORMS) {
      const withinX = p.x + 12 > plat.x && p.x - 12 < plat.x + plat.w;
      if (plat.style === 'ground') {
        if (p.y >= plat.y) {
          p.y = plat.y;
          p.vy = 0;
          p.onGround = true;
        }
      } else if (
        withinX &&
        p.vy >= 0 &&
        prevY <= plat.y + 8 &&
        p.y >= plat.y
      ) {
        p.y = plat.y;
        p.vy = 0;
        p.onGround = true;
      }
    }

    if (!wasOnGround && p.onGround) {
      p.squashX = 1.22;
      p.squashY = 0.8;
    }

    if (p.classId === 'scout') {
      const anchorX = p.x - p.facing * 4;
      const anchorY = p.y - 46;
      p.scarfPoints[0] = { x: anchorX, y: anchorY };
      for (let i = 1; i < p.scarfPoints.length; i++) {
        const prev = p.scarfPoints[i - 1];
        const curr = p.scarfPoints[i];
        curr.x += (-p.facing * 20 - p.vx * 0.08) * dt * 5;
        curr.y += (18 + Math.sin(p.walkCycle + i) * 12) * dt * 4;
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy) || 1;
        const segLen = 8;
        if (dist > segLen) {
          curr.x = prev.x + (dx / dist) * segLen;
          curr.y = prev.y + (dy / dist) * segLen;
        }
      }
    }

    if ((inp.attackJustPressed || inp.attackHeld) && p.attackTimer <= 0) {
      performPlayerAttack(world, p);
    }
    if (inp.specialJustPressed && p.specialTimer <= 0) {
      performPlayerSpecial(world, p);
    }

    if (world.weather.current === 'ash_blizzard') {
      p.x += world.weather.windDir * 44 * dt;
      p.x = Math.max(24, Math.min(ARENA_W - 24, p.x));
    }

    if (
      (world.weather.current === 'radiation_storm' ||
        world.weather.current === 'acid_rain') &&
      p.shieldTimer <= 0 &&
      !isUnderShelter(world, p.x, p.y)
    ) {
      const isRadStorm = world.weather.current === 'radiation_storm';
      const radGain = (isRadStorm ? 9.5 : 4.5) * (1 - def.radResist) * dt;
      const hpDrain = (isRadStorm ? 2.8 : 1.5) * dt;
      p.rad = Math.min(100, p.rad + radGain);
      p.hp = Math.max(0, p.hp - hpDrain);
      anyHighRad = true;

      if (p.hp <= 0) {
        damagePlayer(world, p, 1, 0);
      }
    }

    if (p.rad >= 85) {
      anyHighRad = true;
      p.hp = Math.max(1, p.hp - (p.rad >= 100 ? 6 : 2.5) * dt);
    } else if (p.rad > 0 && world.weather.current === 'clear') {
      p.rad = Math.max(0, p.rad - 1.4 * dt);
    }
  }

  if (anyHighRad) {
    world.geigerTimer -= dt;
    if (world.geigerTimer <= 0) {
      world.geigerTimer = 0.12 + Math.random() * 0.14;
      soundEngine.playGeigerTick();
    }
  }

  // Update Hazards
  for (let i = world.hazards.length - 1; i >= 0; i--) {
    const h = world.hazards[i];
    h.life -= dt;
    h.tickTimer -= dt;
    if (h.life <= 0) {
      world.hazards.splice(i, 1);
      continue;
    }

    if (h.kind === 'acid' && h.tickTimer <= 0) {
      h.tickTimer = 0.45;
      for (const p of world.players) {
        if (
          !p.dead &&
          !p.downed &&
          Math.abs(p.x - h.x) < h.radius &&
          Math.abs(p.y - h.y) < 35
        ) {
          damagePlayer(world, p, 5, 9);
        }
      }
    } else if (h.kind === 'healDome' && h.tickTimer <= 0) {
      h.tickTimer = 0.35;
      for (const p of world.players) {
        if (
          !p.dead &&
          !p.downed &&
          Math.hypot(p.x - h.x, p.y - h.y) <= h.radius
        ) {
          p.hp = Math.min(p.maxHp, p.hp + 6);
          p.rad = Math.max(0, p.rad - 8);
        }
      }
    } else if (h.kind === 'mine') {
      let triggered = false;
      for (const enemy of world.enemies) {
        if (Math.hypot(enemy.x - h.x, enemy.y - h.y) < 48) {
          triggered = true;
          break;
        }
      }
      if (!triggered && world.mode === 'PVP') {
        const oppId = h.ownerId === 1 ? 2 : 1;
        const opp = world.players[oppId - 1];
        if (!opp.dead && Math.hypot(opp.x - h.x, opp.y - h.y) < 48) {
          triggered = true;
        }
      }
      if (triggered) {
        triggerExplosion(
          world,
          h.x,
          h.y - 12,
          125,
          95,
          '#d8b4fe',
          false,
          h.ownerId
        );
        world.hazards.splice(i, 1);
      }
    }
  }

  // Update Barrels
  for (const barrel of world.barrels) {
    barrel.hitFlashTimer = Math.max(0, barrel.hitFlashTimer - dt);
    if (!barrel.active) {
      barrel.respawnTimer -= dt;
      if (barrel.respawnTimer <= 0) {
        barrel.active = true;
        barrel.hp = barrel.maxHp;
      }
    } else if (barrel.hp <= 0) {
      barrel.active = false;
      barrel.respawnTimer = 18;
      triggerExplosion(world, barrel.x, barrel.y - 20, 145, 110, '#f97316', false);
    }
  }

  // Update Supply Drops
  for (let i = world.supplies.length - 1; i >= 0; i--) {
    const s = world.supplies[i];
    s.life -= dt;
    s.bobPhase += dt * 4;
    if (s.life <= 0) {
      world.supplies.splice(i, 1);
      continue;
    }

    if (!s.onGround) {
      s.y += s.vy * dt;
      for (const plat of PLATFORMS) {
        if (s.x >= plat.x && s.x <= plat.x + plat.w && s.y >= plat.y) {
          s.y = plat.y;
          s.onGround = true;
          break;
        }
      }
    }

    for (const p of world.players) {
      if (p.dead || p.downed) continue;
      if (Math.hypot(p.x - s.x, p.y - 24 - (s.y - 16)) < 44) {
        soundEngine.playPickup();
        if (s.kind === 'medkit') {
          const heal = p.classId === 'medic' ? 65 : 45;
          p.hp = Math.min(p.maxHp, p.hp + heal);
          addFloatingText(world, p.x, p.y - 72, `+${heal} VIDA`, '#34d399');
        } else if (s.kind === 'antirad') {
          p.rad = Math.max(0, p.rad - 55);
          p.hp = Math.min(p.maxHp, p.hp + 15);
          addFloatingText(world, p.x, p.y - 72, '-55 RAD', '#38bdf8');
        } else if (s.kind === 'overcharge') {
          p.overchargeTimer = 7.0;
          addFloatingText(world, p.x, p.y - 72, 'SOBRECARGA!', '#fbbf24');
        } else {
          world.resources.wood += 2;
          world.resources.metal += 2;
          world.resources.electronics += 2;
          p.score += 180;
          world.teamScore += 180;
          addFloatingText(world, p.x, p.y - 72, '+2 TODO RECURSO', '#fbbf24');
        }
        spawnParticles(world, s.x, s.y - 14, 12, '#34d399', 50, 160, 2, 4, 80);
        world.supplies.splice(i, 1);
        break;
      }
    }
  }

  // Update Enemies
  for (let i = world.enemies.length - 1; i >= 0; i--) {
    const e = world.enemies[i];
    if (e.hp <= 0) {
      world.enemies.splice(i, 1);
      continue;
    }
    e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
    e.slowTimer = Math.max(0, e.slowTimer - dt);

    const alive = world.players.filter((p) => !p.dead && !p.downed);
    let target = world.players[0];
    if (alive.length > 0) {
      target = alive.reduce((best, cur) =>
        Math.hypot(cur.x - e.x, cur.y - e.y) <
        Math.hypot(best.x - e.x, best.y - e.y)
          ? cur
          : best
      );
    }

    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const dist = Math.hypot(dx, dy);

    let slowMult = e.slowTimer > 0 ? 0.45 : 1;
    for (const h of world.hazards) {
      if (h.kind === 'healDome' && Math.hypot(h.x - e.x, h.y - e.y) < h.radius) {
        slowMult *= 0.6;
      }
    }

    if (e.kind === 'drone') {
      const desiredY = Math.max(95, Math.min(340, target.y - 165));
      if (e.state === 'chase') {
        e.facing = dx >= 0 ? 1 : -1;
        e.vx += (Math.sign(dx) * 145 * slowMult - e.vx) * Math.min(1, dt * 4);
        e.vy += ((desiredY - e.y) * 2.2 - e.vy) * Math.min(1, dt * 4);
        if (dist < 380 && Math.random() < dt * 0.9) {
          e.state = 'windup';
          e.stateTimer = 0.65;
          e.vx *= 0.2;
        }
      } else if (e.state === 'windup') {
        e.stateTimer -= dt;
        e.vx *= 0.9;
        e.vy *= 0.9;
        if (e.stateTimer <= 0) {
          const angle = Math.atan2(target.y - 32 - e.y, target.x - e.x);
          world.projectiles.push({
            id: world.nextId++,
            ownerType: 'enemy',
            kind: 'droneLaser',
            x: e.x,
            y: e.y + 8,
            vx: Math.cos(angle) * 460,
            vy: Math.sin(angle) * 460,
            radius: 5,
            damage: 14,
            radDamage: 6,
            life: 1.8,
            pierce: 1,
            color: '#f43f5e',
            trail: [],
          });
          e.state = 'recover';
          e.stateTimer = 1.0;
        }
      } else {
        e.stateTimer -= dt;
        if (e.stateTimer <= 0) e.state = 'chase';
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = Math.max(30, Math.min(ARENA_W - 30, e.x));
      continue;
    }

    const speed =
      e.kind === 'crawler' ? 190 : e.kind === 'spitter' ? 120 : 92;
    const attackRange =
      e.kind === 'crawler' ? 70 : e.kind === 'spitter' ? 340 : 88;

    if (e.state === 'chase') {
      e.facing = dx >= 0 ? 1 : -1;
      e.vx += (e.facing * speed * slowMult - e.vx) * Math.min(1, dt * 8);
      e.walkCycle += dt * 10;

      if (e.onGround && dy < -90 && Math.random() < dt * 1.4) {
        e.vy = -660;
        e.onGround = false;
      }

      if (Math.abs(dx) < attackRange && Math.abs(dy) < 90) {
        e.state = 'windup';
        e.stateTimer = e.kind === 'brute' ? 0.6 : 0.42;
        e.vx *= 0.2;
      }
    } else if (e.state === 'windup') {
      e.stateTimer -= dt;
      e.vx *= 0.88;
      if (e.stateTimer <= 0) {
        if (e.kind === 'crawler') {
          e.vx = e.facing * 380;
          e.vy = -210;
          e.state = 'attack';
          e.stateTimer = 0.28;
        } else if (e.kind === 'spitter') {
          world.projectiles.push({
            id: world.nextId++,
            ownerType: 'enemy',
            kind: 'acid',
            x: e.x + e.facing * 16,
            y: e.y - 40,
            vx: e.facing * 330,
            vy: -260,
            radius: 7,
            damage: 13,
            radDamage: 12,
            life: 2.0,
            pierce: 1,
            color: '#84cc16',
            trail: [],
          });
          e.state = 'recover';
          e.stateTimer = 1.25;
        } else {
          world.shakeIntensity = Math.max(world.shakeIntensity, 9);
          spawnShockwave(world, e.x, e.y, '#84cc16', 110);
          for (const p of world.players) {
            if (!p.dead && !p.downed && Math.hypot(p.x - e.x, p.y - e.y) < 115) {
              damagePlayer(world, p, 24, 10, (p.x >= e.x ? 1 : -1) * 300);
            }
          }
          e.state = 'recover';
          e.stateTimer = 1.1;
        }
      }
    } else if (e.state === 'attack') {
      e.stateTimer -= dt;
      for (const p of world.players) {
        if (
          !p.dead &&
          !p.downed &&
          Math.hypot(p.x - e.x, p.y - 32 - (e.y - 26)) < 42
        ) {
          damagePlayer(world, p, 15, 7, e.facing * 200);
          e.state = 'recover';
          e.stateTimer = 0.65;
          break;
        }
      }
      if (e.stateTimer <= 0) {
        e.state = 'recover';
        e.stateTimer = 0.55;
      }
    } else {
      e.stateTimer -= dt;
      e.vx *= 0.9;
      if (e.stateTimer <= 0) e.state = 'chase';
    }

    const prevEY = e.y;
    e.vy += GRAVITY * dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.x = Math.max(20, Math.min(ARENA_W - 20, e.x));
    e.onGround = false;

    for (const plat of PLATFORMS) {
      const withinX = e.x + 12 > plat.x && e.x - 12 < plat.x + plat.w;
      if (plat.style === 'ground') {
        if (e.y >= plat.y) {
          e.y = plat.y;
          e.vy = 0;
          e.onGround = true;
        }
      } else if (
        withinX &&
        e.vy >= 0 &&
        prevEY <= plat.y + 8 &&
        e.y >= plat.y
      ) {
        e.y = plat.y;
        e.vy = 0;
        e.onGround = true;
      }
    }
  }

  // Update Projectiles
  for (let i = world.projectiles.length - 1; i >= 0; i--) {
    const pr = world.projectiles[i];
    pr.life -= dt;
    pr.trail.push({ x: pr.x, y: pr.y });
    if (pr.trail.length > 6) pr.trail.shift();

    if (pr.kind === 'grenade' || pr.kind === 'acid') {
      pr.vy += GRAVITY * 0.72 * dt;
    }

    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;

    if (pr.life <= 0 || pr.x < -50 || pr.x > ARENA_W + 50 || pr.y > ARENA_H) {
      world.projectiles.splice(i, 1);
      continue;
    }

    if (pr.kind === 'acid') {
      let hitSurface = false;
      for (const plat of PLATFORMS) {
        if (
          pr.x >= plat.x &&
          pr.x <= plat.x + plat.w &&
          pr.y >= plat.y &&
          pr.vy > 0
        ) {
          hitSurface = true;
          pr.y = plat.y;
          break;
        }
      }
      if (hitSurface) {
        world.hazards.push({
          id: world.nextId++,
          kind: 'acid',
          x: pr.x,
          y: pr.y,
          radius: 48,
          life: 5.5,
          maxLife: 5.5,
          tickTimer: 0,
        });
        spawnParticles(world, pr.x, pr.y - 4, 8, '#84cc16', 40, 140, 2, 5);
        world.projectiles.splice(i, 1);
        continue;
      }
    }

    let consumed = false;
    for (const barrel of world.barrels) {
      if (
        barrel.active &&
        Math.abs(pr.x - barrel.x) < 20 &&
        pr.y >= barrel.y - barrel.h &&
        pr.y <= barrel.y
      ) {
        barrel.hp -= pr.damage;
        barrel.hitFlashTimer = 0.1;
        spawnParticles(world, pr.x, pr.y, 4, '#fb923c', 50, 150, 2, 4);
        pr.pierce -= 1;
        if (pr.pierce <= 0) {
          consumed = true;
          break;
        }
      }
    }
    if (consumed) {
      world.projectiles.splice(i, 1);
      continue;
    }

    if (pr.ownerType === 'player1' || pr.ownerType === 'player2') {
      const attackerId = pr.ownerType === 'player1' ? 1 : 2;
      for (const enemy of world.enemies) {
        if (
          Math.abs(pr.x - enemy.x) < enemy.w * 0.65 &&
          pr.y >= enemy.y - enemy.h &&
          pr.y <= enemy.y
        ) {
          damageEnemy(
            world,
            enemy,
            pr.damage,
            Math.sign(pr.vx) * 90,
            attackerId
          );
          pr.pierce -= 1;
          if (pr.pierce <= 0) break;
        }
      }

      if (pr.pierce > 0 && world.mode === 'PVP') {
        const opp = world.players[attackerId === 1 ? 1 : 0];
        if (
          !opp.dead &&
          Math.abs(pr.x - opp.x) < 20 &&
          pr.y >= opp.y - opp.h &&
          pr.y <= opp.y
        ) {
          damagePlayer(
            world,
            opp,
            Math.round(pr.damage * 0.72),
            pr.radDamage,
            Math.sign(pr.vx) * 140,
            attackerId
          );
          pr.pierce = 0;
        }
      }

      if (pr.pierce <= 0) {
        world.projectiles.splice(i, 1);
        continue;
      }
    } else {
      for (const p of world.players) {
        if (
          !p.dead &&
          !p.downed &&
          Math.abs(pr.x - p.x) < 20 &&
          pr.y >= p.y - p.h &&
          pr.y <= p.y
        ) {
          damagePlayer(
            world,
            p,
            pr.damage,
            pr.radDamage,
            Math.sign(pr.vx) * 110
          );
          world.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  for (let i = world.particles.length - 1; i >= 0; i--) {
    const pt = world.particles[i];
    pt.life -= dt;
    if (pt.life <= 0) {
      world.particles.splice(i, 1);
      continue;
    }
    if (!pt.ring) {
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
    }
    pt.alpha = Math.max(0, pt.life / pt.maxLife);
  }

  for (let i = world.floatingTexts.length - 1; i >= 0; i--) {
    const ft = world.floatingTexts[i];
    ft.life -= dt;
    ft.y += ft.vy * dt;
    if (ft.life <= 0) {
      world.floatingTexts.splice(i, 1);
    }
  }

  const [p1, p2] = world.players;
  if (world.mode === 'COOP') {
    const p1Down = p1.dead || p1.downed;
    const p2Down = !p2.enabled || p2.dead || p2.downed;
    if (p1Down && p2Down) {
      world.gameOver = true;
      world.winnerId = null;
    }
  } else {
    if (p1.dead && p2.dead) {
      world.gameOver = true;
      world.winnerId = 'draw';
    } else if (p1.dead) {
      world.gameOver = true;
      world.winnerId = 2;
    } else if (p2.dead) {
      world.gameOver = true;
      world.winnerId = 1;
    }
  }
}

export function getHudSnapshot(world: SimulationWorld): HudSnapshot {
  const [p1, p2] = world.players;
  const mapPlayer = (p: PlayerState) => {
    const def = CHARACTER_CLASSES[p.classId];
    return {
      id: p.id,
      classId: p.classId,
      name: def.name,
      enabled: p.enabled,
      isBot: p.isBot,
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      rad: Math.round(p.rad),
      specialReadyRatio:
        p.maxSpecialCooldown > 0
          ? Math.max(0, Math.min(1, 1 - p.specialTimer / p.maxSpecialCooldown))
          : 1,
      specialCooldownSec: Math.ceil(p.specialTimer),
      hasPickaxe: p.hasPickaxe,
      downed: p.downed,
      dead: p.dead,
      shieldActive: p.shieldTimer > 0,
      overchargeActive: p.overchargeTimer > 0,
      kills: p.kills,
      revives: p.revives,
      craftedCount: p.craftedCount,
      score: p.score,
    };
  };

  return {
    mode: world.mode,
    playerCount: world.playerCount,
    wave: world.wave,
    enemiesRemaining: world.enemies.length + world.waveEnemiesToSpawn,
    teamScore: world.teamScore,
    resources: { ...world.resources },
    weather: world.weather.current,
    nextWeather: world.weather.next,
    weatherTimerSec: Math.max(0, Math.ceil(world.weather.timer)),
    weatherWarning: world.weather.timer <= 12,
    winnerId: world.winnerId,
    p1: mapPlayer(p1),
    p2: mapPlayer(p2),
  };
}
