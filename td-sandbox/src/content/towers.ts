export type TargetMode = "first" | "last" | "strong" | "close";

export interface UpgradeTier {
  name: string;
  cost: number;
  pierce?: number;
  pop?: number;
  range?: number;
  rof?: number;
  splash?: number;
  slow?: number;
  multishot?: number;
  camo?: boolean;
  lead?: boolean;
  preferStrong?: boolean;
  income?: number;
  auraRof?: number;
  auraCamo?: boolean;
  /** Alchemist Brittle: extra layers taken per hit while coated */
  coatBrittle?: number;
  /** Alchemist Midas: bounty mult bonus while coated (0.2 = +20%) */
  coatMidas?: number;
}

export interface TowerDef {
  id: string;
  name: string;
  role: string;
  cost: number;
  range: number;
  rof: number;
  pierce: number;
  pop: number;
  splash: number;
  slow: number;
  camo: boolean;
  lead: boolean;
  multishot: number;
  farm?: boolean;
  freezePulse?: boolean;
  preferStrong?: boolean;
  support?: boolean;
  rail?: boolean;
  /** Applies coat status; not a raw DPS primary */
  coat?: boolean;
  color: string;
  pathNames: [string, string];
  paths: [UpgradeTier[], UpgradeTier[]];
  defaultTarget: TargetMode;
}

export interface UpgradeTierAura {
  auraRof?: number;
  auraCamo?: boolean;
}

/** Phase 2 slice: 6 towers — dual path full rules. */
export const TOWERS: TowerDef[] = [
  {
    id: "dart",
    name: "Dart MonKey",
    role: "Primary",
    cost: 175,
    range: 170,
    rof: 0.46,
    pierce: 1,
    pop: 1,
    splash: 0,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    color: "#f5d041",
    pathNames: ["Sharp", "Frenzy"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Sharp Tips", cost: 140, pierce: 1, rof: -0.06 },
        { name: "Razor Rinds", cost: 280, pop: 1, range: 25 },
        { name: "Spike Storm", cost: 900, pierce: 4, pop: 1, range: 20 },
        { name: "K+ Javelin", cost: 2200, pierce: 8, pop: 2, range: 40, preferStrong: true },
      ],
      [
        { name: "Quick Hands", cost: 160, rof: -0.1 },
        { name: "Twin Peel", cost: 350, multishot: 1 },
        { name: "Triple Threat", cost: 1100, multishot: 1, rof: -0.05, pierce: 1 },
        { name: "Peel Fan Club", cost: 2800, multishot: 2, rof: -0.08, pierce: 1, pop: 1 },
      ],
    ],
  },
  {
    id: "boomer",
    name: "Boomer K+",
    role: "Mid",
    cost: 320,
    range: 150,
    rof: 0.85,
    pierce: 6,
    pop: 1,
    splash: 0,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    color: "#fb923c",
    pathNames: ["Glaive", "Chase"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Wide Arc", cost: 220, pierce: 3 },
        { name: "K-Rang", cost: 400, pop: 1, pierce: 2 },
        { name: "Glaive Ricochet", cost: 1200, pierce: 6, pop: 1, rof: -0.1 },
        { name: "Barge Cleaver", cost: 2800, pierce: 10, pop: 3, lead: true, range: 30 },
      ],
      [
        { name: "Red Hot Rangs", cost: 200, rof: -0.15 },
        { name: "Twin Return", cost: 450, multishot: 1 },
        { name: "Turbo Charge", cost: 1400, rof: -0.25, pierce: 2 },
        { name: "Perma-Charge", cost: 3200, multishot: 1, rof: -0.2, pierce: 3, pop: 1 },
      ],
    ],
  },
  {
    id: "bomb",
    name: "Bomb MonKey",
    role: "Military",
    cost: 550,
    range: 160,
    rof: 1.1,
    pierce: 1,
    pop: 1,
    splash: 78,
    slow: 0,
    camo: false,
    lead: true,
    multishot: 0,
    color: "#f97316",
    pathNames: ["Blast", "Missile"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Bigger Bombs", cost: 350, splash: 25, pop: 1 },
        { name: "Heavy Shells", cost: 650, pop: 2, splash: 15 },
        { name: "Really Big Bombs", cost: 1600, splash: 40, pop: 2, range: 20 },
        { name: "Peel Impact", cost: 3800, splash: 50, pop: 3, slow: 0.35 },
      ],
      [
        { name: "Faster Reload", cost: 280, rof: -0.25 },
        { name: "Missile Launcher", cost: 600, range: 50, rof: -0.1 },
        { name: "Barge Mauler", cost: 1500, pop: 5, preferStrong: true, range: 30 },
        { name: "Vaultbreaker", cost: 4200, pop: 10, multishot: 1, range: 40 },
      ],
    ],
  },
  {
    id: "sniper",
    name: "Sniper MonKey",
    role: "Military",
    cost: 380,
    range: 420,
    rof: 1.0,
    pierce: 1,
    pop: 2,
    splash: 0,
    slow: 0,
    camo: true,
    lead: false,
    multishot: 0,
    preferStrong: true,
    color: "#86efac",
    pathNames: ["Deadeye", "Supply"],
    defaultTarget: "strong",
    paths: [
      [
        { name: "Full Metal Jacket", cost: 300, lead: true, pop: 2 },
        { name: "Point Five Oh", cost: 700, pop: 4, range: 30 },
        { name: "Deadly Precision", cost: 1800, pop: 6, pierce: 1 },
        { name: "Barge Breaker", cost: 4000, pop: 12, pierce: 2, range: 50 },
      ],
      [
        { name: "Night Vision", cost: 250, rof: -0.25, range: 30 },
        { name: "Shrapnel Shot", cost: 550, splash: 35, pop: 1 },
        { name: "Bouncing Bullet", cost: 1600, pierce: 4, rof: -0.1 },
        { name: "Jungle Supply", cost: 3500, income: 100, rof: -0.2, pierce: 2 },
      ],
    ],
  },
  {
    id: "ice",
    name: "Chill MonKey",
    role: "Magic",
    cost: 400,
    range: 145,
    rof: 1.2,
    pierce: 1,
    pop: 0,
    splash: 100,
    slow: 0.52,
    camo: false,
    lead: false,
    multishot: 0,
    freezePulse: true,
    color: "#67e8f9",
    pathNames: ["Freeze", "Impale"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Permafrost", cost: 250, slow: 0.12, splash: 15 },
        { name: "Deep Freeze", cost: 500, slow: 0.1, rof: -0.15 },
        { name: "Arctic Wind", cost: 1400, splash: 45, range: 30, slow: 0.08 },
        { name: "Absolute Zero", cost: 3200, splash: 55, slow: 0.15, pop: 1, camo: true },
      ],
      [
        { name: "Ice Shards", cost: 280, pop: 1 },
        { name: "Shatter", cost: 550, pop: 1, splash: 15 },
        { name: "Icicle Impale", cost: 1500, camo: true, lead: true, pop: 2 },
        { name: "Snowstorm", cost: 3600, splash: 80, pop: 2, range: 40, rof: -0.25 },
      ],
    ],
  },
  {
    id: "farm",
    name: "Banana Farm",
    role: "Economy",
    cost: 750,
    range: 90,
    rof: 99,
    pierce: 0,
    pop: 0,
    splash: 0,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    farm: true,
    color: "#84cc16",
    pathNames: ["Harvest", "Bank"],
    defaultTarget: "first",
    paths: [
      [
        { name: "More Trees", cost: 400, income: 45 },
        { name: "Irrigation", cost: 800, income: 70 },
        { name: "Marketplace", cost: 1800, income: 120 },
        { name: "Banana Republic", cost: 4000, income: 250 },
      ],
      [
        { name: "Banana Saver", cost: 450, income: 40 },
        { name: "Jungle Bank", cost: 900, income: 80 },
        { name: "Core Loan", cost: 2000, income: 150 },
        { name: "Peel Street", cost: 4500, income: 320 },
      ],
    ],
  },
  {
    id: "village",
    name: "Jungle Village",
    role: "Support",
    cost: 1000,
    range: 190,
    rof: 99,
    pierce: 0,
    pop: 0,
    splash: 0,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    support: true,
    color: "#c084fc",
    pathNames: ["Support", "Trade"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Jungle Drums", cost: 500, auraRof: 0.12 },
        { name: "Radar Scanner", cost: 1000, auraCamo: true, auraRof: 0.06, range: 20 },
        { name: "Call to Arms", cost: 2200, auraRof: 0.2, range: 30 },
        { name: "Homeland Defense", cost: 5000, auraRof: 0.28, auraCamo: true, range: 40 },
      ],
      [
        { name: "Banana Farmer", cost: 450, income: 50 },
        { name: "Monkey Commerce", cost: 950, income: 100 },
        { name: "Marketplace Hub", cost: 2100, income: 180, range: 15 },
        { name: "Trade Empire", cost: 4800, income: 350, auraRof: 0.08 },
      ],
    ],
  },
  {
    id: "super",
    name: "Super MonKey",
    role: "Hero",
    cost: 2400,
    range: 200,
    rof: 0.1,
    pierce: 1,
    pop: 1,
    splash: 0,
    slow: 0,
    camo: true,
    lead: true,
    multishot: 1,
    color: "#f472b6",
    pathNames: ["Plasma", "Robo"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Laser Shockwave", cost: 1200, pierce: 2 },
        { name: "Plasma Blasts", cost: 2800, splash: 30, pop: 1, pierce: 1 },
        { name: "Solar Avatar", cost: 7000, multishot: 2, pierce: 2, pop: 2, splash: 20 },
        { name: "Solar Temple", cost: 16000, multishot: 3, pierce: 4, pop: 3, splash: 35, range: 50 },
      ],
      [
        { name: "Robo Super", cost: 1400, multishot: 1, rof: -0.02 },
        { name: "Tech Terror", cost: 3200, multishot: 2, pierce: 1, pop: 1 },
        { name: "Anti-Peel Array", cost: 8000, multishot: 2, pierce: 3, pop: 4, splash: 25 },
        { name: "Night Legend", cost: 18000, multishot: 3, pierce: 3, pop: 3, rof: -0.03, range: 40 },
      ],
    ],
  },
  {
    id: "battery",
    name: "Starship Battery",
    role: "Ultimate",
    cost: 4800,
    range: 460,
    rof: 1.7,
    pierce: 1,
    pop: 14,
    splash: 0,
    slow: 0,
    camo: true,
    lead: true,
    multishot: 0,
    preferStrong: true,
    rail: true,
    color: "#38bdf8",
    pathNames: ["Rail", "Salvo"],
    defaultTarget: "strong",
    paths: [
      [
        { name: "Capacitor Bank", cost: 2400, rof: -0.35 },
        { name: "Rail Expansion", cost: 4800, pierce: 3, pop: 4 },
        { name: "Hyper Rail", cost: 11000, pierce: 5, pop: 8, range: 40 },
        { name: "Full Stack Raptor", cost: 24000, pierce: 8, pop: 16, range: 60, rof: -0.2 },
      ],
      [
        { name: "Cluster Tip", cost: 2600, splash: 45, pop: 3 },
        { name: "Multi-Vector", cost: 5200, multishot: 1, pop: 3 },
        { name: "Barrage Array", cost: 12000, multishot: 2, splash: 30, pop: 4 },
        { name: "Starfall Battery", cost: 26000, multishot: 3, splash: 55, pop: 8, rof: -0.25 },
      ],
    ],
  },
  {
    id: "alchemist",
    name: "Peel Alchemist",
    role: "Magic",
    cost: 500,
    range: 155,
    rof: 0.9,
    pierce: 1,
    pop: 0,
    splash: 60,
    slow: 0,
    camo: false,
    lead: false,
    multishot: 0,
    coat: true,
    color: "#a78bfa",
    pathNames: ["Brittle", "Midas"],
    defaultTarget: "first",
    paths: [
      [
        { name: "Soften", cost: 200, coatBrittle: 1, splash: 10 },
        { name: "Cracked Peel", cost: 450, coatBrittle: 1, splash: 15 },
        { name: "Glass Banana", cost: 1200, coatBrittle: 1, range: 15 },
        { name: "Shatter Protocol", cost: 2800, coatBrittle: 1, splash: 25, range: 20 },
      ],
      [
        { name: "Gild", cost: 220, coatMidas: 0.2 },
        { name: "Lucky Peel", cost: 500, coatMidas: 0.15, splash: 10 },
        { name: "Treasure Touch", cost: 1400, coatMidas: 0.15, range: 15 },
        { name: "Midas Rain", cost: 3000, coatMidas: 0.25, splash: 20 },
      ],
    ],
  },
];

export const TOWER_BY_ID: Record<string, TowerDef> = Object.fromEntries(
  TOWERS.map((t) => [t.id, t])
);
