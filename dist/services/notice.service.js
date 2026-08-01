"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertNoticeFromThread = upsertNoticeFromThread;
exports.deleteNoticeForThread = deleteNoticeForThread;
exports.upsertNoticeFromMessage = upsertNoticeFromMessage;
exports.deleteNoticeForMessage = deleteNoticeForMessage;
exports.backfillNotices = backfillNotices;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const prisma_1 = require("../config/prisma");
const TITLE_MAX_LENGTH = 60;
async function resolveMentions(text, guild) {
    if (!guild || !text)
        return text;
    let result = text;
    const roleIds = new Set([...result.matchAll(/<@&(\d+)>/g)].map((m) => m[1]));
    for (const id of roleIds) {
        const role = guild.roles.cache.get(id) ?? (await guild.roles.fetch(id).catch(() => null));
        if (role)
            result = result.replaceAll(`<@&${id}>`, `@${role.name}`);
    }
    const channelIds = new Set([...result.matchAll(/<#(\d+)>/g)].map((m) => m[1]));
    for (const id of channelIds) {
        const channel = guild.channels.cache.get(id) ?? (await guild.channels.fetch(id).catch(() => null));
        if (channel && "name" in channel && channel.name)
            result = result.replaceAll(`<#${id}>`, `#${channel.name}`);
    }
    const userIds = new Set([...result.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]));
    for (const id of userIds) {
        const member = guild.members.cache.get(id) ?? (await guild.members.fetch(id).catch(() => null));
        if (member) {
            result = result.replaceAll(`<@${id}>`, `@${member.displayName}`).replaceAll(`<@!${id}>`, `@${member.displayName}`);
        }
    }
    return result;
}
async function extractContent(message) {
    const embed = message.embeds?.[0];
    const raw = embed
        ? [embed.description, ...embed.fields.map((f) => `${f.name}\n${f.value}`)].filter(Boolean).join("\n\n") ||
            embed.title ||
            ""
        : message.content?.trim() ?? "";
    return resolveMentions(raw, message.guild);
}
function titleFromText(text) {
    const firstLine = text.split("\n")[0] || "공지";
    return firstLine.length > TITLE_MAX_LENGTH ? `${firstLine.slice(0, TITLE_MAX_LENGTH)}…` : firstLine;
}
// ── Forum-channel posts (each post is a thread) ─────────────
async function upsertNoticeFromThread(thread) {
    const starter = await thread.fetchStarterMessage().catch(() => null);
    const content = starter ? await extractContent(starter) : "";
    const publishedAt = thread.createdAt ?? new Date();
    await prisma_1.prisma.notice.upsert({
        where: { discordMessageId: thread.id },
        update: { title: thread.name, content, publishedAt },
        create: {
            discordMessageId: thread.id,
            channelId: thread.parentId ?? thread.id,
            title: thread.name,
            content,
            publishedAt,
        },
    });
}
async function deleteNoticeForThread(threadId) {
    await prisma_1.prisma.notice.deleteMany({ where: { discordMessageId: threadId } });
}
// ── Plain text/announcement channel messages ────────────────
async function upsertNoticeFromMessage(message) {
    if (!message.id || !message.channelId)
        return;
    const content = await extractContent(message);
    const title = content ? titleFromText(content) : message.attachments?.size ? "공지 (첨부 파일)" : "공지";
    const publishedAt = message.createdAt ?? new Date();
    await prisma_1.prisma.notice.upsert({
        where: { discordMessageId: message.id },
        update: { title, content, publishedAt },
        create: { discordMessageId: message.id, channelId: message.channelId, title, content, publishedAt },
    });
}
async function deleteNoticeForMessage(messageId) {
    await prisma_1.prisma.notice.deleteMany({ where: { discordMessageId: messageId } });
}
// ── startup backfill ─────────────────────────────────────────
async function backfillNotices(client, messageLimit = 50) {
    if (!env_1.env.announcementChannelId) {
        console.warn("ANNOUNCEMENT_CHANNEL_ID not set — skipping notice backfill.");
        return;
    }
    const channel = await client.channels.fetch(env_1.env.announcementChannelId).catch(() => null);
    if (!channel) {
        console.warn(`ANNOUNCEMENT_CHANNEL_ID (${env_1.env.announcementChannelId}) could not be fetched — check the bot has access to it.`);
        return;
    }
    if (channel.type === discord_js_1.ChannelType.GuildForum) {
        const [active, archived] = await Promise.all([channel.threads.fetchActive(), channel.threads.fetchArchived()]);
        const threads = [...active.threads.values(), ...archived.threads.values()];
        for (const thread of threads) {
            await upsertNoticeFromThread(thread);
        }
        console.log(`Notice sync: backfilled ${threads.length} forum post(s).`);
        return;
    }
    if (!channel.isTextBased()) {
        console.warn(`ANNOUNCEMENT_CHANNEL_ID (${env_1.env.announcementChannelId}) is not a supported channel type (${channel.type}).`);
        return;
    }
    const messages = await channel.messages.fetch({ limit: messageLimit });
    for (const message of messages.values()) {
        await upsertNoticeFromMessage(message);
    }
    console.log(`Notice sync: backfilled ${messages.size} message(s).`);
}
//# sourceMappingURL=notice.service.js.map