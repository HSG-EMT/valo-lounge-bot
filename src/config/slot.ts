export interface SlotSymbol {
  emoji: string;
  weight: number;
  tripleMultiplier: number;
}

// Weighted so rarer symbols pay out more on a triple. Expected return is
// roughly ~92% of the bet (a bit more house edge than /카지노's 47% coin flip,
// which is typical for slot machines vs. a coin flip).
export const SLOT_SYMBOLS: SlotSymbol[] = [
  { emoji: "🍒", weight: 30, tripleMultiplier: 2 },
  { emoji: "🍋", weight: 25, tripleMultiplier: 3 },
  { emoji: "🍇", weight: 20, tripleMultiplier: 4 },
  { emoji: "🔔", weight: 15, tripleMultiplier: 8 },
  { emoji: "💎", weight: 8, tripleMultiplier: 15 },
  { emoji: "7️⃣", weight: 2, tripleMultiplier: 50 },
];

export const SLOT_PAIR_MULTIPLIER = 1.5;

function spinOneReel(): SlotSymbol {
  const total = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const symbol of SLOT_SYMBOLS) {
    if (roll < symbol.weight) return symbol;
    roll -= symbol.weight;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

export interface SlotResult {
  reels: SlotSymbol[];
  multiplier: number;
  kind: "triple" | "pair" | "none";
}

export function spinSlot(): SlotResult {
  const reels = [spinOneReel(), spinOneReel(), spinOneReel()];
  const [a, b, c] = reels;

  if (a.emoji === b.emoji && b.emoji === c.emoji) {
    return { reels, multiplier: a.tripleMultiplier, kind: "triple" };
  }
  if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
    return { reels, multiplier: SLOT_PAIR_MULTIPLIER, kind: "pair" };
  }
  return { reels, multiplier: 0, kind: "none" };
}
