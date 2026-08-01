"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRemaining = formatRemaining;
exports.formatRemainingShort = formatRemainingShort;
exports.getCooldownRemainingMs = getCooldownRemainingMs;
const prisma_1 = require("../config/prisma");
function formatRemaining(ms) {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}시간 ${minutes}분`;
}
/** Seconds-granularity variant for short cooldowns (e.g. /낚시), where "0시간 0분" would be useless. */
function formatRemainingShort(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    if (totalSeconds < 60)
        return `${totalSeconds}초`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
}
/** Returns remaining cooldown ms if the user's last `action` was within `cooldownMs`, otherwise null. */
async function getCooldownRemainingMs(userId, action, cooldownMs) {
    const lastClaim = await prisma_1.prisma.statusLog.findFirst({
        where: { userId, action },
        orderBy: { createdAt: "desc" },
    });
    if (!lastClaim)
        return null;
    const elapsed = Date.now() - lastClaim.createdAt.getTime();
    return elapsed < cooldownMs ? cooldownMs - elapsed : null;
}
//# sourceMappingURL=cooldown.js.map