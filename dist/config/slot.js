"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLOT_PAIR_MULTIPLIER = exports.SLOT_SYMBOLS = void 0;
exports.spinSlot = spinSlot;
// Weighted so rarer symbols pay out more on a triple. Expected return is
// roughly ~92% of the bet (a bit more house edge than /카지노's 47% coin flip,
// which is typical for slot machines vs. a coin flip).
exports.SLOT_SYMBOLS = [
    { emoji: "🍒", weight: 30, tripleMultiplier: 2 },
    { emoji: "🍋", weight: 25, tripleMultiplier: 3 },
    { emoji: "🍇", weight: 20, tripleMultiplier: 4 },
    { emoji: "🔔", weight: 15, tripleMultiplier: 8 },
    { emoji: "💎", weight: 8, tripleMultiplier: 15 },
    { emoji: "7️⃣", weight: 2, tripleMultiplier: 50 },
];
exports.SLOT_PAIR_MULTIPLIER = 1.5;
function spinOneReel() {
    const total = exports.SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
    let roll = Math.random() * total;
    for (const symbol of exports.SLOT_SYMBOLS) {
        if (roll < symbol.weight)
            return symbol;
        roll -= symbol.weight;
    }
    return exports.SLOT_SYMBOLS[exports.SLOT_SYMBOLS.length - 1];
}
function spinSlot() {
    const reels = [spinOneReel(), spinOneReel(), spinOneReel()];
    const [a, b, c] = reels;
    if (a.emoji === b.emoji && b.emoji === c.emoji) {
        return { reels, multiplier: a.tripleMultiplier, kind: "triple" };
    }
    if (a.emoji === b.emoji || b.emoji === c.emoji || a.emoji === c.emoji) {
        return { reels, multiplier: exports.SLOT_PAIR_MULTIPLIER, kind: "pair" };
    }
    return { reels, multiplier: 0, kind: "none" };
}
//# sourceMappingURL=slot.js.map