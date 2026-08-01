"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNoticeSync = registerNoticeSync;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const notice_service_1 = require("../services/notice.service");
function registerNoticeSync(client) {
    if (!env_1.env.announcementChannelId) {
        console.warn("ANNOUNCEMENT_CHANNEL_ID not set — notice sync disabled.");
        return;
    }
    // forum-channel posts (new/edited/deleted threads)
    client.on(discord_js_1.Events.ThreadCreate, async (thread) => {
        if (thread.parentId !== env_1.env.announcementChannelId)
            return;
        await (0, notice_service_1.upsertNoticeFromThread)(thread).catch((err) => console.error("Notice sync (thread create) failed:", err));
    });
    client.on(discord_js_1.Events.ThreadUpdate, async (_oldThread, newThread) => {
        if (newThread.parentId !== env_1.env.announcementChannelId)
            return;
        await (0, notice_service_1.upsertNoticeFromThread)(newThread).catch((err) => console.error("Notice sync (thread update) failed:", err));
    });
    client.on(discord_js_1.Events.ThreadDelete, async (thread) => {
        if (thread.parentId !== env_1.env.announcementChannelId)
            return;
        await (0, notice_service_1.deleteNoticeForThread)(thread.id).catch((err) => console.error("Notice sync (thread delete) failed:", err));
    });
    // editing a forum post's first message also needs to refresh that post's Notice
    client.on(discord_js_1.Events.MessageUpdate, async (_oldMessage, newMessage) => {
        const channel = newMessage.channel;
        const isForumPost = channel.isThread() && channel.parentId === env_1.env.announcementChannelId;
        const isPlainChannelMessage = newMessage.channelId === env_1.env.announcementChannelId;
        if (!isForumPost && !isPlainChannelMessage)
            return;
        if (isForumPost && channel.isThread()) {
            await (0, notice_service_1.upsertNoticeFromThread)(channel).catch((err) => console.error("Notice sync (post edit) failed:", err));
            return;
        }
        const full = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
        if (!full)
            return;
        await (0, notice_service_1.upsertNoticeFromMessage)(full).catch((err) => console.error("Notice sync (update) failed:", err));
    });
    // plain text/announcement channel messages
    client.on(discord_js_1.Events.MessageCreate, async (message) => {
        if (message.channelId !== env_1.env.announcementChannelId)
            return;
        await (0, notice_service_1.upsertNoticeFromMessage)(message).catch((err) => console.error("Notice sync (create) failed:", err));
    });
    client.on(discord_js_1.Events.MessageDelete, async (message) => {
        if (message.channelId !== env_1.env.announcementChannelId || !message.id)
            return;
        await (0, notice_service_1.deleteNoticeForMessage)(message.id).catch((err) => console.error("Notice sync (delete) failed:", err));
    });
}
//# sourceMappingURL=noticeSync.js.map