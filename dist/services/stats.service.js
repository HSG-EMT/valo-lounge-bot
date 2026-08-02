"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserVoiceSeconds = getUserVoiceSeconds;
exports.getVoiceLeaderboard = getVoiceLeaderboard;
exports.getMessageLeaderboard = getMessageLeaderboard;
exports.getOverallStats = getOverallStats;
exports.formatDuration = formatDuration;
const prisma_1 = require("../config/prisma");
function elapsedSeconds(joinedAt, now) {
    return Math.max(0, Math.round((now - joinedAt.getTime()) / 1000));
}
/** Total voice seconds for one user — closed sessions + elapsed time on any still-open one. */
async function getUserVoiceSeconds(userId) {
    const sessions = await prisma_1.prisma.voiceSession.findMany({ where: { userId } });
    const now = Date.now();
    return sessions.reduce((sum, s) => sum + (s.durationSeconds ?? elapsedSeconds(s.joinedAt, now)), 0);
}
/** Voice usage leaderboard, in seconds, "as of right now" (open sessions included). */
async function getVoiceLeaderboard(limit) {
    const closedSums = await prisma_1.prisma.voiceSession.groupBy({
        by: ["userId"],
        where: { leftAt: { not: null } },
        _sum: { durationSeconds: true },
    });
    const openSessions = await prisma_1.prisma.voiceSession.findMany({ where: { leftAt: null } });
    const now = Date.now();
    const totals = new Map();
    for (const row of closedSums) {
        totals.set(row.userId, row._sum.durationSeconds ?? 0);
    }
    for (const s of openSessions) {
        totals.set(s.userId, (totals.get(s.userId) ?? 0) + elapsedSeconds(s.joinedAt, now));
    }
    return resolveLeaderboard(totals, limit);
}
async function getMessageLeaderboard(limit) {
    const rows = await prisma_1.prisma.messageStat.findMany({
        orderBy: { totalCount: "desc" },
        take: limit,
        include: { user: true },
    });
    return rows.map((r) => ({ discordId: r.user.discordId, discordUsername: r.user.discordUsername, value: r.totalCount }));
}
async function resolveLeaderboard(totals, limit) {
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    if (top.length === 0)
        return [];
    const users = await prisma_1.prisma.user.findMany({ where: { id: { in: top.map(([userId]) => userId) } } });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return top
        .map(([userId, value]) => {
        const user = userMap.get(userId);
        if (!user)
            return null;
        return { discordId: user.discordId, discordUsername: user.discordUsername, value };
    })
        .filter((e) => e !== null);
}
async function getOverallStats(guild) {
    const [messageAgg, messageActiveUsers, closedVoiceAgg, openSessions, voiceUserIds] = await Promise.all([
        prisma_1.prisma.messageStat.aggregate({ _sum: { totalCount: true } }),
        prisma_1.prisma.messageStat.count(),
        prisma_1.prisma.voiceSession.aggregate({ where: { leftAt: { not: null } }, _sum: { durationSeconds: true } }),
        prisma_1.prisma.voiceSession.findMany({ where: { leftAt: null } }),
        prisma_1.prisma.voiceSession.findMany({ select: { userId: true }, distinct: ["userId"] }),
    ]);
    const now = Date.now();
    const openTotal = openSessions.reduce((sum, s) => sum + elapsedSeconds(s.joinedAt, now), 0);
    return {
        totalMessages: messageAgg._sum.totalCount ?? 0,
        messageActiveUsers,
        totalVoiceSeconds: (closedVoiceAgg._sum.durationSeconds ?? 0) + openTotal,
        voiceActiveUsers: voiceUserIds.length,
        currentMemberCount: guild.memberCount,
        currentVoiceCount: openSessions.length,
    };
}
function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours === 0)
        return `${minutes}분`;
    return `${hours}시간 ${minutes}분`;
}
//# sourceMappingURL=stats.service.js.map