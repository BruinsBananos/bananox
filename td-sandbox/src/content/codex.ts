/** Knowledge codex — no combat power. */

export interface CodexEntry {
  id: string;
  tab: "bananas" | "bosses" | "properties" | "towers";
  name: string;
  blurb: string;
  counters?: string;
  first?: string;
}

export const CODEX: CodexEntry[] = [
  { id: "green", tab: "bananas", name: "Unripe", blurb: "Green means go… for them.", first: "w1", counters: "Any" },
  { id: "ripe", tab: "bananas", name: "Ripe", blurb: "Classic potassium. Don't sleep.", first: "w1–3", counters: "Any" },
  { id: "gold", tab: "bananas", name: "Golden", blurb: "Not the jackpot. Still shiny.", first: "w5+", counters: "Pierce helps" },
  { id: "purple", tab: "bananas", name: "Meme", blurb: "Spreads faster than a group chat.", first: "w12+", counters: "ROF / multi" },
  { id: "star", tab: "bananas", name: "Cosmic", blurb: "Orbiting your patience.", first: "w22+", counters: "Strong DPS" },
  { id: "zebra", tab: "bananas", name: "Zebra", blurb: "Stripes mean trouble in bulk.", first: "w28+", counters: "Splash + pierce" },
  { id: "golden", tab: "bananas", name: "JACKPOT", blurb: "Pay day. Try not to leak it.", first: "rare", counters: "Focus fire" },
  { id: "ceramic", tab: "bosses", name: "Ceramic Crate", blurb: "Clay shell then children.", first: "~24", counters: "Sniper / Bomb" },
  { id: "boss", tab: "bosses", name: "BAN-Barge", blurb: "Heavy cargo. Do not sign for it.", first: "~30", counters: "Battery / Missile / Deadeye" },
  { id: "freighter", tab: "bosses", name: "Potassium Freighter", blurb: "Logistics of doom.", first: "~50", counters: "Boss melt line" },
  { id: "titan", tab: "bosses", name: "Vaultbreaker Titan", blurb: "If it smiles, look away and shoot.", first: "~100", counters: "Full stack" },
  { id: "camo", tab: "properties", name: "Camo", blurb: "Untargetable without detect.", counters: "Sniper, Village radar, high Chill" },
  { id: "lead", tab: "properties", name: "Lead", blurb: "Soft projectiles spark.", counters: "Bomb, Sniper A1+, Super, Battery" },
  { id: "fortified", tab: "properties", name: "Fortified", blurb: "Pop-1 blocked; shells tougher.", counters: "Higher pop" },
  { id: "dart", tab: "towers", name: "Dart MonKey", blurb: "Stitch single-file peels.", counters: "—" },
  { id: "boomer", tab: "towers", name: "Boomer K+", blurb: "Sweep long path lines." },
  { id: "sniper", tab: "towers", name: "Sniper MonKey", blurb: "Mark priority · camo native." },
  { id: "bomb", tab: "towers", name: "Bomb MonKey", blurb: "Crack packs + lead." },
  { id: "ice", tab: "towers", name: "Chill MonKey", blurb: "Hold tempo with frost." },
  { id: "farm", tab: "towers", name: "Banana Farm", blurb: "Mint end-round BAN." },
  { id: "village", tab: "towers", name: "Jungle Village", blurb: "Buff doctrine bubble." },
  { id: "super", tab: "towers", name: "Super MonKey", blurb: "Flood late multi-beam." },
  { id: "battery", tab: "towers", name: "Starship Battery", blurb: "Rail delete super-heavies." },
  { id: "alchemist", tab: "towers", name: "Peel Alchemist", blurb: "Coat — brittle or midas." },
];
