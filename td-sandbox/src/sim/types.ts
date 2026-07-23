import type { TargetMode } from "../content/towers";
import type { DiffId, LengthId, MapId, ModeId, RunConfig } from "../content/runConfig";
import type { EventId } from "../content/events";

export type Phase = "prep" | "combat" | "won" | "lost";
export type AbilityId = "storm" | "cryo" | "drop" | "rage";

export interface TowerEntity {
  uid: number;
  defId: string;
  c: number;
  r: number;
  x: number;
  y: number;
  pathA: number;
  pathB: number;
  deepPath: 0 | 1 | null;
  invested: number;
  targetMode: TargetMode;
  cooldown: number;
  range: number;
  rof: number;
  pierce: number;
  pop: number;
  splash: number;
  slow: number;
  camo: boolean;
  lead: boolean;
  multishot: number;
  preferStrong: boolean;
  farm: boolean;
  freezePulse: boolean;
  support: boolean;
  /** Alchemist: applies coat instead of raw DPS */
  coat: boolean;
  coatBrittle: number;
  coatMidas: number;
  income: number;
  auraRof: number;
  auraCamo: boolean;
  color: string;
  /** runtime aura */
  effCamo: boolean;
  effRofMul: number;
}

export interface ThreatEntity {
  uid: number;
  kind: "layer" | "ceramic" | "boss" | "freighter" | "titan";
  layer: string | null;
  dist: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  baseSpeed: number;
  camo: boolean;
  lead: boolean;
  fortified: boolean;
  alive: boolean;
  hp: number;
  maxHp: number;
  value: number;
  lives: number;
  slowMul: number;
  freezeT: number;
  /** Alchemist coats — extra pop taken / bounty mult; duration */
  coatBrittle: number;
  coatMidas: number;
  coatT: number;
  children?: string;
  childCount?: number;
  color: string;
}

export interface ProjectileEntity {
  uid: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pierce: number;
  pop: number;
  splash: number;
  slow: number;
  camo: boolean;
  lead: boolean;
  targetUid: number | null;
  ttl: number;
  color: string;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface AbilityState {
  cd: number;
  maxCd: number;
}

export type SimEvent =
  | { type: "pop"; x: number; y: number; value: number; layer: string }
  | { type: "leak"; lives: number }
  | { type: "leadFail"; x: number; y: number }
  | { type: "waveClear"; ban: number; interest: number; farm: number }
  | { type: "waveStart"; wave: number }
  | { type: "place"; defId: string }
  | { type: "upgrade"; path?: 0 | 1; tier?: number; deep?: boolean }
  | { type: "tier4"; towerUid: number; name: string }
  | { type: "sell" }
  | { type: "lost" }
  | { type: "won" }
  | { type: "fever"; duration: number }
  | { type: "event"; id: EventId; name: string }
  | { type: "tour"; map: MapId }
  | { type: "ability"; id: AbilityId }
  | { type: "bossSpawn"; kind: string; x: number; y: number }
  | { type: "toast"; msg: string };

export interface SpawnItem {
  delay: number;
  unit: string;
  camo: boolean;
  lead: boolean;
  fortified: boolean;
}

export interface SimWorld {
  config: RunConfig;
  ban: number;
  lives: number;
  wave: number;
  maxWave: number;
  pops: number;
  banEarned: number;
  phase: Phase;
  speed: number;
  paused: boolean;
  towers: TowerEntity[];
  threats: ThreatEntity[];
  projectiles: ProjectileEntity[];
  floats: FloatText[];
  spawnQueue: SpawnItem[];
  spawnTimer: number;
  nextUid: number;
  selectedUid: number | null;
  showRanges: boolean;
  showImmunities: boolean;
  waveActive: boolean;
  killStreak: number;
  killStreakT: number;
  feverT: number;
  rageT: number;
  abilities: Record<AbilityId, AbilityState>;
  dropUses: number;
  perfectWaves: number;
  leakedThisWave: boolean;
  coachStep: number;
  densMul: number;
  banMul: number;
  rewardMul: number;
  interestCap: number;
  hpScale: number;
  speedMul: number;
  /** active event */
  eventId: EventId | null;
  eventT: number;
  eventCd: number;
  eventCamoAll: boolean;
  eventLeadSoft: boolean;
  eventRangeMul: number;
  eventBountyMul: number;
  eventRofMul: number;
  eventAbilityHaste: number;
  tourStop: number;
  usedFarm: boolean;
  onlyDart: boolean;
  jackpotMul: number;
  /** Juice (cosmetic) */
  shake: number;
  hitFlash: number;
  bossBanner: string;
  bossBannerT: number;
  ceremonyT: number;
  ceremonyX: number;
  ceremonyY: number;
  ceremonyLabel: string;
  dailySeed: string | null;
  /** Set if god cash / lab cheats used — blocks ranked writes even if misconfigured */
  usedGodTools: boolean;
  /** Tower ids allowed this run (sandbox = all) */
  unlockedTowers: string[];
  /** Rush start fever: ROF only, no bounty×2 */
  feverRofOnly: boolean;
  /** Soft BAN from events this wave (Party cap) */
  eventBanThisWave: number;
  /** Pending dens mul for next spawn group (swarm) */
  swarmNext: boolean;
}

export type { DiffId, LengthId, MapId, ModeId, RunConfig };
