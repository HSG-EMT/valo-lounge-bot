"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshGuildStats = refreshGuildStats;
exports.recordMemberJoin = recordMemberJoin;
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const date_1 = require("../utils/date");
/** Full resync — member/online counts (REST, "approximate" per Discord) + live voice count (gateway cache). */
async function refreshGuildStats(client) {
    try {
        // force: true — the guild is already gateway-cached (bot is a member), and
        // GuildManager#fetch returns the cache hit as-is (ignoring withCounts)
        // unless forced to actually hit the REST endpoint.
        const guild = await client.guilds.fetch({ guild: env_1.env.discordGuildId, withCounts: true, force: true });
        const voiceCount = guild.voiceStates?.cache.size ?? 0;
        const existing = await prisma_1.prisma.guildStats.findUnique({ where: { guildId: env_1.env.discordGuildId } });
        const today = (0, date_1.todayKstDateString)();
        const joinedTodayCount = existing && existing.joinedCountDate === today ? existing.joinedTodayCount : 0;
        await prisma_1.prisma.guildStats.upsert({
            where: { guildId: env_1.env.discordGuildId },
            update: {
                onlineCount: guild.approximatePresenceCount ?? 0,
                voiceCount,
                joinedTodayCount,
                joinedCountDate: today,
            },
            create: {
                guildId: env_1.env.discordGuildId,
                onlineCount: guild.approximatePresenceCount ?? 0,
                voiceCount,
                joinedTodayCount,
                joinedCountDate: today,
            },
        });
    }
    catch (err) {
        console.error("Failed to refresh guild stats:", err);
    }
}
/** Called from the GuildMemberAdd listener — bumps today's join count by one. */
async function recordMemberJoin() {
    const today = (0, date_1.todayKstDateString)();
    const existing = await prisma_1.prisma.guildStats.findUnique({ where: { guildId: env_1.env.discordGuildId } });
    const joinedTodayCount = existing && existing.joinedCountDate === today ? existing.joinedTodayCount + 1 : 1;
    await prisma_1.prisma.guildStats.upsert({
        where: { guildId: env_1.env.discordGuildId },
        update: { joinedTodayCount, joinedCountDate: today },
        create: {
            guildId: env_1.env.discordGuildId,
            onlineCount: 0,
            voiceCount: 0,
            joinedTodayCount,
            joinedCountDate: today,
        },
    });
}
//# sourceMappingURL=guildStats.service.js.map