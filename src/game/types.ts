export type GameState =
  | 'TITLE_MENU'
  | 'CHARACTER_SELECT'
  | 'ONLINE_LOBBY'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER';

export type GameMode = 'COOP' | 'PVP';

export type PlayerCount = 1 | 2;

export type CharacterClassId = 'medic' | 'engineer' | 'scout' | 'juggernaut';

export interface CharacterClassDef {
  id: CharacterClassId;
  name: string;
  role: string;
  passiveTitle: string;
  passiveDesc: string;
  maxHp: number;
  speed: number;
  jumpForce: number;
  maxJumps: number;
  radResist: number;
  attackCooldown: number;
  specialCooldown: number;
  weaponName: string;
  specialName: string;
  specialDesc: string;
  armorColor: string;
  accentColor: string;
  statSpeed: number;
  statPower: number;
  statDefense: number;
}

export type ResourceType = 'wood' | 'metal' | 'electronics';

export interface ResourceBag {
  wood: number;
  metal: number;
  electronics: number;
}

export type CraftItemId =
  | 'pickaxe'
  | 'bandage'
  | 'antirad'
  | 'trap'
  | 'shelter'
  | 'turret';

export interface CraftRecipe {
  id: CraftItemId;
  name: string;
  shortLabel: string;
  desc: string;
  cost: ResourceBag;
}

export type WeaponId =
  | 'default'
  | 'shotgun'
  | 'smg'
  | 'flamethrower'
  | 'launcher'
  | 'laser_cannon';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortLabel: string;
  desc: string;
  costCredits: number;
  damageLabel: string;
  rateLabel: string;
  color: string;
}

export type EmoteId = 'help' | 'gather' | 'danger' | 'build' | 'ok';

export interface EmoteDef {
  id: EmoteId;
  label: string;
  symbol: string;
  color: string;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  attackHeld: boolean;
  specialJustPressed: boolean;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isShelter?: boolean;
  isBunkerRoof?: boolean;
  style: 'ground' | 'concrete' | 'steel' | 'bunker';
}

export interface ResourceNode {
  id: number;
  type: ResourceType;
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
  respawnTimer: number;
  active: boolean;
  hitFlashTimer: number;
}

export interface BuiltStructure {
  id: number;
  kind: 'shelter' | 'trap' | 'turret';
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  life: number;
  maxLife: number;
  ownerId: 1 | 2;
  fireTimer: number;
  hitFlashTimer: number;
}

export interface PlayerState {
  id: 1 | 2;
  classId: CharacterClassId;
  customName: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  onGround: boolean;
  jumpsRemaining: number;
  coyoteTimer: number;
  jumpBufferTimer: number;

  hp: number;
  maxHp: number;
  rad: number;
  shieldTimer: number;
  overchargeTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;

  attackTimer: number;
  attackAnimTimer: number;
  specialTimer: number;
  maxSpecialCooldown: number;

  hasPickaxe: boolean;
  credits: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  activeEmote: EmoteDef | null;
  emoteTimer: number;

  enabled: boolean;
  isBot: boolean;
  downed: boolean;
  downedTimer: number;
  reviveProgress: number;
  dead: boolean;

  walkCycle: number;
  squashX: number;
  squashY: number;
  scarfPoints: { x: number; y: number }[];

  kills: number;
  damageDealt: number;
  revives: number;
  craftedCount: number;
  score: number;
}

export type EnemyKind = 'crawler' | 'spitter' | 'drone' | 'brute';

export interface EnemyState {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  hp: number;
  maxHp: number;
  onGround: boolean;
  state: 'chase' | 'windup' | 'attack' | 'recover';
  stateTimer: number;
  hitFlashTimer: number;
  slowTimer: number;
  walkCycle: number;
  targetPlayerId: 1 | 2;
  scoreValue: number;
}

export interface Projectile {
  id: number;
  ownerType: 'player1' | 'player2' | 'enemy' | 'turret';
  kind: 'bullet' | 'plasma' | 'rail' | 'grenade' | 'acid' | 'droneLaser' | 'turretBolt';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  radDamage: number;
  life: number;
  pierce: number;
  color: string;
  trail: { x: number; y: number }[];
}

export interface HazardZone {
  id: number;
  kind: 'acid' | 'healDome' | 'mine' | 'flare';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  ownerId?: 1 | 2;
  tickTimer: number;
}

export interface Barrel {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  hitFlashTimer: number;
  respawnTimer: number;
  active: boolean;
}

export type SupplyKind = 'medkit' | 'antirad' | 'overcharge' | 'resources';

export interface SupplyDrop {
  id: number;
  kind: SupplyKind;
  x: number;
  y: number;
  vy: number;
  onGround: boolean;
  life: number;
  bobPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  ring?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export type WeatherType =
  | 'clear'
  | 'radiation_storm'
  | 'acid_rain'
  | 'ash_blizzard';

export interface WeatherState {
  current: WeatherType;
  next: WeatherType;
  timer: number;
  duration: number;
  intensity: number;
  windDir: 1 | -1;
  acidPoolTimer: number;
  drainTickTimer: number;
}

export interface PlayerHudInfo {
  id: 1 | 2;
  classId: CharacterClassId;
  name: string;
  className: string;
  enabled: boolean;
  isBot: boolean;
  hp: number;
  maxHp: number;
  rad: number;
  specialReadyRatio: number;
  specialCooldownSec: number;
  hasPickaxe: boolean;
  credits: number;
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  downed: boolean;
  dead: boolean;
  shieldActive: boolean;
  overchargeActive: boolean;
  kills: number;
  revives: number;
  craftedCount: number;
  score: number;
}

export type EventLogCategory = 'weather' | 'resource' | 'combat' | 'craft';

export interface EventLogEntry {
  id: number;
  text: string;
  category: EventLogCategory;
  timestampSec: number;
}

export interface HudSnapshot {
  mode: GameMode;
  playerCount: PlayerCount;
  isOnline?: boolean;
  localPlayerId?: 1 | 2;
  wave: number;
  enemiesRemaining: number;
  teamScore: number;
  resources: ResourceBag;
  weather: WeatherType;
  nextWeather: WeatherType;
  weatherTimerSec: number;
  weatherWarning: boolean;
  eventLog: EventLogEntry[];
  winnerId: 1 | 2 | 'coop' | 'draw' | null;
  p1: PlayerHudInfo;
  p2: PlayerHudInfo;
}

export interface OnlineRoomPlayer {
  slot: 1 | 2;
  name: string;
  classId: CharacterClassId;
  ready: boolean;
}

export type ClientWsMessage =
  | { type: 'create_room'; name: string; classId: CharacterClassId }
  | { type: 'join_room'; code: string; name: string; classId: CharacterClassId }
  | { type: 'quick_match'; name: string; classId: CharacterClassId }
  | { type: 'update_profile'; name: string; classId: CharacterClassId }
  | { type: 'start_match' }
  | { type: 'input'; input: PlayerInput }
  | { type: 'craft'; itemId: CraftItemId }
  | { type: 'buy_weapon'; weaponId: WeaponId }
  | { type: 'emote'; emoteId: EmoteId }
  | { type: 'rematch' }
  | { type: 'leave_room' };

export type ServerWsMessage =
  | {
      type: 'room_joined';
      code: string;
      slot: 1 | 2;
      players: OnlineRoomPlayer[];
    }
  | { type: 'room_updated'; players: OnlineRoomPlayer[] }
  | { type: 'match_started'; world: unknown }
  | { type: 'state'; world: unknown }
  | { type: 'opponent_left'; message: string }
  | { type: 'error'; message: string };
