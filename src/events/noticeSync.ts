import { Client, Events } from "discord.js";
import { env } from "../config/env";
import {
  deleteNoticeForMessage,
  deleteNoticeForThread,
  upsertNoticeFromMessage,
  upsertNoticeFromThread,
} from "../services/notice.service";

export function registerNoticeSync(client: Client): void {
  if (!env.announcementChannelId) {
    console.warn("ANNOUNCEMENT_CHANNEL_ID not set — notice sync disabled.");
    return;
  }

  // forum-channel posts (new/edited/deleted threads)
  client.on(Events.ThreadCreate, async (thread) => {
    if (thread.parentId !== env.announcementChannelId) return;
    await upsertNoticeFromThread(thread).catch((err) => console.error("Notice sync (thread create) failed:", err));
  });

  client.on(Events.ThreadUpdate, async (_oldThread, newThread) => {
    if (newThread.parentId !== env.announcementChannelId) return;
    await upsertNoticeFromThread(newThread).catch((err) => console.error("Notice sync (thread update) failed:", err));
  });

  client.on(Events.ThreadDelete, async (thread) => {
    if (thread.parentId !== env.announcementChannelId) return;
    await deleteNoticeForThread(thread.id).catch((err) => console.error("Notice sync (thread delete) failed:", err));
  });

  // editing a forum post's first message also needs to refresh that post's Notice
  client.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
    const channel = newMessage.channel;
    const isForumPost = channel.isThread() && channel.parentId === env.announcementChannelId;
    const isPlainChannelMessage = newMessage.channelId === env.announcementChannelId;
    if (!isForumPost && !isPlainChannelMessage) return;

    if (isForumPost && channel.isThread()) {
      await upsertNoticeFromThread(channel).catch((err) => console.error("Notice sync (post edit) failed:", err));
      return;
    }

    const full = newMessage.partial ? await newMessage.fetch().catch(() => null) : newMessage;
    if (!full) return;
    await upsertNoticeFromMessage(full).catch((err) => console.error("Notice sync (update) failed:", err));
  });

  // plain text/announcement channel messages
  client.on(Events.MessageCreate, async (message) => {
    if (message.channelId !== env.announcementChannelId) return;
    await upsertNoticeFromMessage(message).catch((err) => console.error("Notice sync (create) failed:", err));
  });

  client.on(Events.MessageDelete, async (message) => {
    if (message.channelId !== env.announcementChannelId || !message.id) return;
    await deleteNoticeForMessage(message.id).catch((err) => console.error("Notice sync (delete) failed:", err));
  });
}
