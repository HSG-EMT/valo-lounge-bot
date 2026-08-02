"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerServerLogging = registerServerLogging;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const embed_1 = require("../utils/embed");
const serverLog_service_1 = require("../services/serverLog.service");
const MEMBER_LOG_AUTHOR = "👥 VALO LOUNGE MEMBER LOG";
const MOD_LOG_AUTHOR = "🔨 VALO LOUNGE MODERATION LOG";
const VOICE_LOG_AUTHOR = "🔊 VALO LOUNGE VOICE LOG";
const MESSAGE_LOG_AUTHOR = "💬 VALO LOUNGE MESSAGE LOG";
function dateStr(d) {
    return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}
function registerServerLogging(client) {
    const channels = env_1.env.logChannels;
    client.on(discord_js_1.Events.GuildMemberAdd, async (member) => {
        if (member.guild.id !== env_1.env.discordGuildId)
            return;
        const accountAge = dateStr(member.user.createdAt);
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "📥 서버 입장",
            description: `┌ ${member} (${member.user.tag})\n│ 계정 생성일: ${accountAge}\n└ 현재 인원: ${member.guild.memberCount}명`,
            author: MEMBER_LOG_AUTHOR,
            color: embed_1.CASINO_TEAL,
            thumbnail: member.user.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.memberJoin, embed);
    });
    client.on(discord_js_1.Events.GuildMemberRemove, async (member) => {
        if (member.guild.id !== env_1.env.discordGuildId)
            return;
        const roles = member.roles?.cache
            ? [...member.roles.cache.values()].filter((r) => r.id !== member.guild.id).map((r) => r.name)
            : [];
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "📤 서버 퇴장",
            description: `┌ ${member.user?.tag ?? member.id}\n│ 보유 역할: ${roles.length > 0 ? roles.join(", ") : "없음"}\n└ 현재 인원: ${member.guild.memberCount}명`,
            author: MEMBER_LOG_AUTHOR,
            color: embed_1.VALO_RED,
            thumbnail: member.user?.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.memberLeave, embed);
    });
    client.on(discord_js_1.Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (newMember.guild.id !== env_1.env.discordGuildId)
            return;
        if (oldMember.nickname === newMember.nickname)
            return;
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "✏️ 닉네임 변경",
            description: `┌ ${newMember}\n│ 이전: ${oldMember.nickname ?? "(없음)"}\n└ 이후: ${newMember.nickname ?? "(없음)"}`,
            author: MEMBER_LOG_AUTHOR,
            thumbnail: newMember.user.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.nicknameChange, embed);
    });
    client.on(discord_js_1.Events.GuildBanAdd, async (ban) => {
        if (ban.guild.id !== env_1.env.discordGuildId)
            return;
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "🔨 차단",
            description: `┌ ${ban.user.tag} (${ban.user.id})\n└ 사유: ${ban.reason ?? "사유 없음"}`,
            author: MOD_LOG_AUTHOR,
            color: embed_1.VALO_RED,
            thumbnail: ban.user.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.ban, embed);
    });
    client.on(discord_js_1.Events.VoiceStateUpdate, async (oldState, newState) => {
        if (newState.guild.id !== env_1.env.discordGuildId)
            return;
        const member = newState.member ?? oldState.member;
        if (!member || member.user.bot)
            return;
        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;
        if (oldChannelId === newChannelId)
            return; // mute/deafen/stream toggle only
        if (oldChannelId) {
            const embed = (0, serverLog_service_1.logEmbed)({
                title: "🔈 음성채널 퇴장",
                description: `┌ ${member}\n└ 채널: ${oldState.channel?.name ?? "알 수 없음"}`,
                author: VOICE_LOG_AUTHOR,
                color: embed_1.VALO_RED,
                thumbnail: member.user.displayAvatarURL(),
            });
            await (0, serverLog_service_1.sendLog)(client, channels.voiceLeave, embed);
        }
        if (newChannelId) {
            const embed = (0, serverLog_service_1.logEmbed)({
                title: "🔊 음성채널 입장",
                description: `┌ ${member}\n└ 채널: ${newState.channel?.name ?? "알 수 없음"}`,
                author: VOICE_LOG_AUTHOR,
                color: embed_1.CASINO_TEAL,
                thumbnail: member.user.displayAvatarURL(),
            });
            await (0, serverLog_service_1.sendLog)(client, channels.voiceJoin, embed);
        }
    });
    client.on(discord_js_1.Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (newMessage.guild?.id !== env_1.env.discordGuildId)
            return;
        if (newMessage.author?.bot)
            return;
        if (newMessage.partial || oldMessage.content === newMessage.content)
            return;
        const before = oldMessage.partial ? "*(캐시에 없어서 이전 내용 확인 불가)*" : (0, serverLog_service_1.truncate)(oldMessage.content || "(내용 없음)");
        const after = (0, serverLog_service_1.truncate)(newMessage.content || "(내용 없음)");
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "📝 메시지 수정",
            description: `┌ ${newMessage.author} · ${newMessage.channel}\n│ 이전: ${before}\n└ 이후: ${after}`,
            author: MESSAGE_LOG_AUTHOR,
            thumbnail: newMessage.author?.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.messageEdit, embed);
    });
    client.on(discord_js_1.Events.MessageDelete, async (message) => {
        if (message.guild?.id !== env_1.env.discordGuildId)
            return;
        if (message.author?.bot)
            return;
        const content = message.partial ? "*(캐시에 없어서 내용 확인 불가)*" : (0, serverLog_service_1.truncate)(message.content || "(내용 없음)");
        const author = message.author ? `${message.author}` : "알 수 없음";
        const embed = (0, serverLog_service_1.logEmbed)({
            title: "🗑️ 메시지 삭제",
            description: `┌ ${author} · ${message.channel}\n└ 내용: ${content}`,
            author: MESSAGE_LOG_AUTHOR,
            color: embed_1.VALO_RED,
            thumbnail: message.author?.displayAvatarURL(),
        });
        await (0, serverLog_service_1.sendLog)(client, channels.messageDelete, embed);
    });
}
//# sourceMappingURL=serverLogging.js.map