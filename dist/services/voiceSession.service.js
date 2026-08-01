"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openVoiceSession = openVoiceSession;
exports.closeVoiceSession = closeVoiceSession;
exports.reconcileVoiceSessions = reconcileVoiceSessions;
const prisma_1 = require("../config/prisma");
const points_service_1 = require("./points.service");
async function openVoiceSession(discordId, username, channelId, channelName) {
    const user = await (0, points_service_1.ensureUser)(discordId, username);
    // Guard against duplicate opens (e.g. a stray double-fire) — reuse an existing open session for this channel.
    const existing = await prisma_1.prisma.voiceSession.findFirst({
        where: { userId: user.id, channelId, leftAt: null },
    });
    if (existing)
        return;
    await prisma_1.prisma.voiceSession.create({
        data: { userId: user.id, channelId, channelName, joinedAt: new Date() },
    });
}
async function closeVoiceSession(discordId, channelId, at = new Date()) {
    const user = await prisma_1.prisma.user.findUnique({ where: { discordId } });
    if (!user)
        return;
    const open = await prisma_1.prisma.voiceSession.findFirst({
        where: { userId: user.id, channelId, leftAt: null },
        orderBy: { joinedAt: "desc" },
    });
    if (!open)
        return;
    const durationSeconds = Math.max(0, Math.round((at.getTime() - open.joinedAt.getTime()) / 1000));
    await prisma_1.prisma.voiceSession.update({
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
async function reconcileVoiceSessions(guild) {
    const now = new Date();
    const openSessions = await prisma_1.prisma.voiceSession.findMany({
        where: { leftAt: null },
        include: { user: true },
    });
    const liveUserChannel = new Map(); // discordId -> channelId
    for (const [, state] of guild.voiceStates.cache) {
        if (state.channelId && state.member) {
            liveUserChannel.set(state.member.id, state.channelId);
        }
    }
    for (const session of openSessions) {
        const liveChannelId = liveUserChannel.get(session.user.discordId);
        if (liveChannelId !== session.channelId) {
            const durationSeconds = Math.max(0, Math.round((now.getTime() - session.joinedAt.getTime()) / 1000));
            await prisma_1.prisma.voiceSession.update({
                where: { id: session.id },
                data: { leftAt: now, durationSeconds },
            });
        }
    }
    for (const [discordId, channelId] of liveUserChannel) {
        const alreadyOpen = openSessions.some((s) => s.user.discordId === discordId && s.channelId === channelId);
        if (alreadyOpen)
            continue;
        const member = guild.voiceStates.cache.find((s) => s.member?.id === discordId)?.member;
        const channel = guild.channels.cache.get(channelId);
        if (!member || !channel)
            continue;
        await openVoiceSession(discordId, member.user.username, channelId, channel.name);
    }
}
//# sourceMappingURL=voiceSession.service.js.map