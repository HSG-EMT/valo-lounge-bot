"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FISH_GRADES = exports.ROD_TIERS = void 0;
exports.rollFish = rollFish;
exports.ROD_TIERS = [
    { name: "낡은 낚시대", emoji: "🥢", cost: 0, rareBonus: 0 },
    { name: "기본 낚시대", emoji: "🎣", cost: 500, rareBonus: 0.08 },
    { name: "은빛 낚시대", emoji: "⚙️", cost: 2000, rareBonus: 0.18 },
    { name: "금빛 낚시대", emoji: "🌟", cost: 6000, rareBonus: 0.3 },
    { name: "전설의 낚시대", emoji: "👑", cost: 15000, rareBonus: 0.45 },
];
exports.FISH_GRADES = [
    { name: "꽝", emoji: "🥾", weight: 30, cpRange: [0, 0] },
    { name: "일반", emoji: "🐟", weight: 40, cpRange: [10, 30] },
    { name: "고급", emoji: "🐠", weight: 18, cpRange: [40, 80] },
    { name: "희귀", emoji: "🦑", weight: 8, cpRange: [100, 200] },
    { name: "전설", emoji: "🐋", weight: 3, cpRange: [300, 600] },
    { name: "심연의 괴물", emoji: "🐉", weight: 1, cpRange: [1000, 2000] },
];
// Grades 0-1 (꽝/일반) shrink as the rod's rareBonus grows; grades further up
// the rarity list grow proportional to their index, so a maxed-out rod meaningfully
// tilts the roll toward 희귀/전설/심연의 괴물 instead of a flat percentage bump.
function rollFish(rodTier) {
    const bonus = exports.ROD_TIERS[rodTier]?.rareBonus ?? 0;
    const weights = exports.FISH_GRADES.map((g, i) => (i <= 1 ? g.weight * (1 - bonus) : g.weight * (1 + bonus * i)));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let grade = exports.FISH_GRADES[exports.FISH_GRADES.length - 1];
    for (let i = 0; i < exports.FISH_GRADES.length; i++) {
        if (roll < weights[i]) {
            grade = exports.FISH_GRADES[i];
            break;
        }
        roll -= weights[i];
    }
    const [min, max] = grade.cpRange;
    const amount = min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
    return { grade, amount };
}
//# sourceMappingURL=fishing.js.map