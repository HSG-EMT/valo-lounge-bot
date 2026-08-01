import { Guild } from "discord.js";
import { prisma } from "../config/prisma";
import { ensureUser } from "./points.service";

export async function openVoiceSession(discordId: string, username: string, channelId: string, channelName: string) {
  const user = await ensureUser(discordId, username);

  // Guard against duplicate opens (e.g. a stray double-fire) — reuse an existing open session for this channel.
  const existing = await prisma.voiceSession.findFirst({
    where: { userId: user.id, channelId, leftAt: null },
  });
  if (existing) return;

  await prisma.voiceSession.create({
    data: { userId: user.id, channelId, channelName, joinedAt: new Date() },
  });
}

export async function closeVoiceSession(discordId: string, channelId: string, at: Date = new Date()) {
  const user = await prisma.user.findUnique({ where: { discordId } });
  if (!user) return;

  const open = await prisma.voiceSession.findFirst({
    where: { userId: user.id, channelId, leftAt: null },
    orderBy: { joinedAt: "desc" },
  });
  if (!open) return;

  const durationSeconds = Math.max(0, Math.round((at.getTime() - open.joinedAt.getTime()) / 1000));
  await prisma.voiceSession.update({
    where: { id: open.id },
    data: { leftAt: at, durationSeconds },
  });
}

/**
 * Runs once on bot startup. The bot can't know what happened to voice channels
 * while it was offline, so this reconciles DB state with the guild's current
 * live voice state: closes sessions for anyone no longer connected, and opens
 * a fresh session (starting now) for anyone connected who doesn't have one.
 */
export async function reconcileVoiceSessions(guild: Guild): Promise<void> {
  const now = new Date();

  const openSessions = await prisma.voiceSession.findMany({
    where: { leftAt: null },
    include: { user: true },
  });

  const liveUserChannel = new Map<string, string>(); // discordId -> channelId
  for (const [, state] of guild.voiceStates.cache) {
    if (state.channelId && state.member) {
      liveUserChannel.set(state.member.id, state.channelId);
    }
  }

  for (const session of openSessions) {
    const liveChannelId = liveUserChannel.get(session.user.discordId);
    if (liveChannelId !== session.channelId) {
      const durationSeconds = Math.max(0, Math.round((now.getTime() - session.joinedAt.getTime()) / 1000));
      await prisma.voiceSession.update({
        where: { id: session.id },
        data: { leftAt: now, durationSeconds },
      });
    }
  }

  for (const [discordId, channelId] of liveUserChannel) {
    const alreadyOpen = openSessions.some(
      (s) => s.user.discordId === discordId && s.channelId === channelId
    );
    if (alreadyOpen) continue;

    const member = guild.voiceStates.cache.find((s) => s.member?.id === discordId)?.member;
    const channel = guild.channels.cache.get(channelId);
    if (!member || !channel) continue;

    await openVoiceSession(discordId, member.user.username, channelId, channel.name);
  }
}
