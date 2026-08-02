"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerVoiceTracking = registerVoiceTracking;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const levels_1 = require("../config/levels");
const level_service_1 = require("../services/level.service");
const voiceSession_service_1 = require("../services/voiceSession.service");
function registerVoiceTracking(client) {
    client.on(discord_js_1.Events.VoiceStateUpdate, async (oldState, newState) => {
        if (newState.guild.id !== env_1.env.discordGuildId)
            return;
        const member = newState.member ?? oldState.member;
        if (!member || member.user.bot)
            return;
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;
        if (oldChannelId === newChannelId)
            return; // mute/deafen/stream toggle — not a channel move
        try {
            if (oldChannelId) {
                const durationSeconds = await (0, voiceSession_service_1.closeVoiceSession)(member.id, oldChannelId);
                const xpGain = Math.floor((durationSeconds ?? 0) / 60) * levels_1.XP_PER_VOICE_MINUTE;
                if (xpGain > 0) {
                    await (0, level_service_1.addXp)(member.id, member.user.username, xpGain);
                }
            }
            if (newChannelId) {
                const channelName = newState.channel?.name ?? "알 수 없음";
                await (0, voiceSession_service_1.openVoiceSession)(member.id, member.user.username, newChannelId, channelName);
            }
        }
        catch (err) {
            console.error("Voice tracking failed:", err);
        }
    });
    client.once(discord_js_1.Events.ClientReady, async () => {
        const guild = await client.guilds.fetch(env_1.env.discordGuildId).catch(() => null);
        if (!guild)
            return;
        await (0, voiceSession_service_1.reconcileVoiceSessions)(guild).catch((err) => console.error("Voice session reconcile failed:", err));
    });
}
//# sourceMappingURL=voiceTracking.js.map