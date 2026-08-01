import { Client } from "discord.js";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { todayKstDateString } from "../utils/date";

/** Full resync — member/online counts (REST, "approximate" per Discord) + live voice count (gateway cache). */
export async function refreshGuildStats(client: Client): Promise<void> {
  try {
    // force: true — the guild is already gateway-cached (bot is a member), and
    // GuildManager#fetch returns the cache hit as-is (ignoring withCounts)
    // unless forced to actually hit the REST endpoint.
    const guild = await client.guilds.fetch({ guild: env.discordGuildId, withCounts: true, force: true });
    const voiceCount = guild.voiceStates?.cache.size ?? 0;

    const existing = await prisma.guildStats.findUnique({ where: { guildId: env.discordGuildId } });
    const today = todayKstDateString();
    const joinedTodayCount = existing && existing.joinedCountDate === today ? existing.joinedTodayCount : 0;

    await prisma.guildStats.upsert({
      where: { guildId: env.discordGuildId },
      update: {
        onlineCount: guild.approximatePresenceCount ?? 0,
        voiceCount,
        joinedTodayCount,
        joinedCountDate: today,
      },
      create: {
        guildId: env.discordGuildId,
        onlineCount: guild.approximatePresenceCount ?? 0,
        voiceCount,
        joinedTodayCount,
        joinedCountDate: today,
      },
    });
  } catch (err) {
    console.error("Failed to refresh guild stats:", err);
  }
}

/** Called from the GuildMemberAdd listener — bumps today's join count by one. */
export async function recordMemberJoin(): Promise<void> {
  const today = todayKstDateString();
  const existing = await prisma.guildStats.findUnique({ where: { guildId: env.discordGuildId } });
  const joinedTodayCount = existing && existing.joinedCountDate === today ? existing.joinedTodayCount + 1 : 1;

  await prisma.guildStats.upsert({
    where: { guildId: env.discordGuildId },
    update: { joinedTodayCount, joinedCountDate: today },
    create: {
      guildId: env.discordGuildId,
      onlineCount: 0,
      voiceCount: 0,
      joinedTodayCount,
      joinedCountDate: today,
    },
  });
}
