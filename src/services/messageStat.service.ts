import { prisma } from "../config/prisma";
import { todayKstDateString } from "../utils/date";
import { ensureUser } from "./points.service";

export async function recordMessage(discordId: string, username: string): Promise<void> {
  const user = await ensureUser(discordId, username);
  const today = todayKstDateString();

  const existing = await prisma.messageStat.findUnique({ where: { userId: user.id } });
  const todayCount = existing && existing.todayDate === today ? existing.todayCount + 1 : 1;

  await prisma.messageStat.upsert({
    where: { userId: user.id },
    update: { totalCount: { increment: 1 }, todayCount, todayDate: today, lastMessageAt: new Date() },
    create: { userId: user.id, totalCount: 1, todayCount: 1, todayDate: today, lastMessageAt: new Date() },
  });
}
