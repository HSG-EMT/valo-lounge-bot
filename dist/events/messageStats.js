"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMessageStats = registerMessageStats;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const levels_1 = require("../config/levels");
const level_service_1 = require("../services/level.service");
const messageStat_service_1 = require("../services/messageStat.service");
function registerMessageStats(client) {
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.guild?.id !== env_1.env.discordGuildId)
            return;
        if (message.author.bot)
            return;
        try {
            await (0, messageStat_service_1.recordMessage)(message.author.id, message.author.username);
            await (0, level_service_1.addXp)(message.author.id, message.author.username, levels_1.XP_MESSAGE);
        }
        catch (err) {
            console.error("Message stat recording failed:", err);
        }
    });
}
//# sourceMappingURL=messageStats.js.map