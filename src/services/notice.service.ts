import { ChannelType, Client, Guild, Message, PartialMessage, ThreadChannel } from "discord.js";
import { env } from "../config/env";
import { prisma } from "../config/prisma";

const TITLE_MAX_LENGTH = 60;

async function resolveMentions(text: string, guild: Guild | null): Promise<string> {
  if (!guild || !text) return text;
  let result = text;

  const roleIds = new Set([...result.matchAll(/<@&(\d+)>/g)].map((m) => m[1]));
  for (const id of roleIds) {
    const role = guild.roles.cache.get(id) ?? (await guild.roles.fetch(id).catch(() => null));
    if (role) result = result.replaceAll(`<@&${id}>`, `@${role.name}`);
  }

  const channelIds = new Set([...result.matchAll(/<#(\d+)>/g)].map((m) => m[1]));
  for (const id of channelIds) {
    const channel = guild.channels.cache.get(id) ?? (await guild.channels.fetch(id).catch(() => null));
    if (channel && "name" in channel && channel.name) result = result.replaceAll(`<#${id}>`, `#${channel.name}`);
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

async function extractContent(message: Message | PartialMessage): Promise<string> {
  const embed = message.embeds?.[0];
  const raw = embed
    ? [embed.description, ...embed.fields.map((f) => `${f.name}\n${f.value}`)].filter(Boolean).join("\n\n") ||
      embed.title ||
      ""
    : message.content?.trim() ?? "";

  return resolveMentions(raw, message.guild);
}

function titleFromText(text: string): string {
  const firstLine = text.split("\n")[0] || "공지";
  return firstLine.length > TITLE_MAX_LENGTH ? `${firstLine.slice(0, TITLE_MAX_LENGTH)}…` : firstLine;
}

// ── Forum-channel posts (each post is a thread) ─────────────

export async function upsertNoticeFromThread(thread: ThreadChannel): Promise<void> {
  const starter = await thread.fetchStarterMessage().catch(() => null);
  const content = starter ? await extractContent(starter) : "";
  const publishedAt = thread.createdAt ?? new Date();

  await prisma.notice.upsert({
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

export async function deleteNoticeForThread(threadId: string): Promise<void> {
  await prisma.notice.deleteMany({ where: { discordMessageId: threadId } });
}

// ── Plain text/announcement channel messages ────────────────

export async function upsertNoticeFromMessage(message: Message | PartialMessage): Promise<void> {
  if (!message.id || !message.channelId) return;
  const content = await extractContent(message);
  const title = content ? titleFromText(content) : message.attachments?.size ? "공지 (첨부 파일)" : "공지";
  const publishedAt = message.createdAt ?? new Date();

  await prisma.notice.upsert({
    where: { discordMessageId: message.id },
    update: { title, content, publishedAt },
    create: { discordMessageId: message.id, channelId: message.channelId, title, content, publishedAt },
  });
}

export async function deleteNoticeForMessage(messageId: string): Promise<void> {
  await prisma.notice.deleteMany({ where: { discordMessageId: messageId } });
}

// ── startup backfill ─────────────────────────────────────────

export async function backfillNotices(client: Client, messageLimit = 50): Promise<void> {
  if (!env.announcementChannelId) {
    console.warn("ANNOUNCEMENT_CHANNEL_ID not set — skipping notice backfill.");
    return;
  }

  const channel = await client.channels.fetch(env.announcementChannelId).catch(() => null);
  if (!channel) {
    console.warn(
      `ANNOUNCEMENT_CHANNEL_ID (${env.announcementChannelId}) could not be fetched — check the bot has access to it.`
    );
    return;
  }

  if (channel.type === ChannelType.GuildForum) {
    const [active, archived] = await Promise.all([channel.threads.fetchActive(), channel.threads.fetchArchived()]);
    const threads = [...active.threads.values(), ...archived.threads.values()];
    for (const thread of threads) {
      await upsertNoticeFromThread(thread);
    }
    console.log(`Notice sync: backfilled ${threads.length} forum post(s).`);
    return;
  }

  if (!channel.isTextBased()) {
    console.warn(`ANNOUNCEMENT_CHANNEL_ID (${env.announcementChannelId}) is not a supported channel type (${channel.type}).`);
    return;
  }

  const messages = await channel.messages.fetch({ limit: messageLimit });
  for (const message of messages.values()) {
    await upsertNoticeFromMessage(message);
  }
  console.log(`Notice sync: backfilled ${messages.size} message(s).`);
}
