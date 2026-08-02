import { prisma } from "../config/prisma";
import { getTier, levelFromTotalXp, MAX_TOTAL_XP, Tier } from "../config/levels";
import { ensureUser } from "./points.service";

export interface AddXpResult {
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  tierBefore: Tier;
  tierAfter: Tier;
  leveledUp: boolean;
  tierChanged: boolean;
}

export async function addXp(discordId: string, username: string, amount: number): Promise<AddXpResult> {
  const user = await ensureUser(discordId, username);
  const existing = await prisma.userLevel.findUnique({ where: { userId: user.id } });
  const beforeTotal = existing?.totalXp ?? 0;
  const levelBefore = levelFromTotalXp(beforeTotal).level;

  const afterTotal = Math.min(MAX_TOTAL_XP, beforeTotal + amount);

  await prisma.userLevel.upsert({
    where: { userId: user.id },
    update: { totalXp: afterTotal },
    create: { userId: user.id, totalXp: afterTotal },
  });

  const levelAfter = levelFromTotalXp(afterTotal).level;
  const tierBefore = getTier(levelBefore);
  const tierAfter = getTier(levelAfter);

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
export function levelUpBanner(result: AddXpResult): string {
  if (result.tierChanged) {
    return `\n\n🎉 **등급 승급!** ${result.tierBefore.emoji}${result.tierBefore.name} → ${result.tierAfter.emoji}${result.tierAfter.name} (Lv.${result.levelAfter})`;
  }
  if (result.leveledUp) {
    return `\n\n⬆️ **레벨업!** Lv.${result.levelBefore} → Lv.${result.levelAfter}`;
  }
  return "";
}
