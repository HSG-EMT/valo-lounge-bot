import { prisma } from "../config/prisma";

export async function ensureUser(discordId: string, username: string) {
  const user = await prisma.user.upsert({
    where: { discordId },
    update: { discordUsername: username },
    create: {
      discordId,
      discordUsername: username,
      serverPoint: { create: { points: 0 } },
    },
    include: { serverPoint: true },
  });

  // Separate upsert (rather than a nested create on the user upsert above) so
  // accounts created before CP existed still get a CasinoPoint row on their
  // next command, instead of only new signups getting one.
  const casinoPoint = await prisma.casinoPoint.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, points: 0, rodTier: 0 },
  });

  return { ...user, casinoPoint };
}
