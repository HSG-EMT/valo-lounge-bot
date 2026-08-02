"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addXp = addXp;
exports.levelUpBanner = levelUpBanner;
const prisma_1 = require("../config/prisma");
const levels_1 = require("../config/levels");
const points_service_1 = require("./points.service");
async function addXp(discordId, username, amount) {
    const user = await (0, points_service_1.ensureUser)(discordId, username);
    const existing = await prisma_1.prisma.userLevel.findUnique({ where: { userId: user.id } });
    const beforeTotal = existing?.totalXp ?? 0;
    const levelBefore = (0, levels_1.levelFromTotalXp)(beforeTotal).level;
    const afterTotal = Math.min(levels_1.MAX_TOTAL_XP, beforeTotal + amount);
    await prisma_1.prisma.userLevel.upsert({
        where: { userId: user.id },
        update: { totalXp: afterTotal },
        create: { userId: user.id, totalXp: afterTotal },
    });
    const levelAfter = (0, levels_1.levelFromTotalXp)(afterTotal).level;
    const tierBefore = (0, levels_1.getTier)(levelBefore);
    const tierAfter = (0, levels_1.getTier)(levelAfter);
    return {
        totalXp: afterTotal,
        levelBefore,
        levelAfter,
        tierBefore,
        tierAfter,
        leveledUp: levelAfter > levelBefore,
        tierChanged: tierBefore.key !== tierAfter.key,
    };
}
/** Appended to a command's existing reply description — mirrors achievement.service.ts's unlockBanner(). */
function levelUpBanner(result) {
    if (result.tierChanged) {
        return `\n\n🎉 **등급 승급!** ${result.tierBefore.emoji}${result.tierBefore.name} → ${result.tierAfter.emoji}${result.tierAfter.name} (Lv.${result.levelAfter})`;
    }
    if (result.leveledUp) {
        return `\n\n⬆️ **레벨업!** Lv.${result.levelBefore} → Lv.${result.levelAfter}`;
    }
    return "";
}
//# sourceMappingURL=level.service.js.map