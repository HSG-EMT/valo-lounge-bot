"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryUnlockAchievement = tryUnlockAchievement;
exports.unlockBanner = unlockBanner;
const prisma_1 = require("../config/prisma");
const achievements_1 = require("../config/achievements");
// Two queries instead of a create+catch-unique-violation — achievement checks
// are infrequent (a few per command call), so the extra roundtrip isn't a
// concern and this keeps the call sites simple (no error-code branching).
async function tryUnlockAchievement(userId, key) {
    const existing = await prisma_1.prisma.achievement.findUnique({ where: { userId_key: { userId, key } } });
    if (existing)
        return null;
    await prisma_1.prisma.achievement.create({ data: { userId, key } });
    return achievements_1.ACHIEVEMENT_MAP.get(key) ?? null;
}
function unlockBanner(achievement) {
    return `\n\n🏅 **업적 달성!** ${achievement.emoji} ${achievement.name} — ${achievement.description}`;
}
//# sourceMappingURL=achievement.service.js.map