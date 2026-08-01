"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGuildStats = registerGuildStats;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const guildStats_service_1 = require("../services/guildStats.service");
const REFRESH_INTERVAL_MS = 60 * 1000;
function registerGuildStats(client) {
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        if (member.guild.id !== env_1.env.discordGuildId)
            return;
        await (0, guildStats_service_1.recordMemberJoin)().catch((err) => console.error("Guild stats (member join) failed:", err));
    });
    client.once(discord_js_1.Events.ClientReady, () => {
        (0, guildStats_service_1.refreshGuildStats)(client).catch((err) => console.error("Initial guild stats refresh failed:", err));
        setInterval(() => {
            (0, guildStats_service_1.refreshGuildStats)(client).catch((err) => console.error("Guild stats refresh failed:", err));
        }, REFRESH_INTERVAL_MS);
    });
}
//# sourceMappingURL=guildStats.js.map