import { prisma } from "../config/prisma";
import { ACHIEVEMENT_MAP, Achievement } from "../config/achievements";

// Two queries instead of a create+catch-unique-violation — achievement checks
// are infrequent (a few per command call), so the extra roundtrip isn't a
// concern and this keeps the call sites simple (no error-code branching).
export async function tryUnlockAchievement(userId: string, key: string): Promise<Achievement | null> {
  const existing = await prisma.achievement.findUnique({ where: { userId_key: { userId, key } } });
  if (existing) return null;

  await prisma.achievement.create({ data: { userId, key } });
  return ACHIEVEMENT_MAP.get(key) ?? null;
}

export function unlockBanner(achievement: Achievement): string {
  return `\n\n🏅 **업적 달성!** ${achievement.emoji} ${achievement.name} — ${achievement.description}`;
}
