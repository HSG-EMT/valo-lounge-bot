import { prisma } from "../config/prisma";

export function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}시간 ${minutes}분`;
}

/** Seconds-granularity variant for short cooldowns (e.g. /낚시), where "0시간 0분" would be useless. */
export function formatRemainingShort(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}초`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
}

/** Returns remaining cooldown ms if the user's last `action` was within `cooldownMs`, otherwise null. */
export async function getCooldownRemainingMs(
  userId: string,
  action: string,
  cooldownMs: number
): Promise<number | null> {
  const lastClaim = await prisma.statusLog.findFirst({
    where: { userId, action },
    orderBy: { createdAt: "desc" },
  });

  if (!lastClaim) return null;

  const elapsed = Date.now() - lastClaim.createdAt.getTime();
  return elapsed < cooldownMs ? cooldownMs - elapsed : null;
}
