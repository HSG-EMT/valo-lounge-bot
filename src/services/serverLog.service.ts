import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { VALO_RED } from "../utils/embed";

// Every log type is independently optional (blank channel id = skip) and
// failures (missing channel, no send permission, channel deleted) are
// swallowed with a console warning rather than crashing the bot — a broken
// log channel shouldn't take down the rest of the bot's features.
export async function sendLog(client: Client, channelId: string, embed: EmbedBuilder): Promise<void> {
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.warn(`Log channel ${channelId} is not a text channel or was not found.`);
      return;
    }
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error(`Failed to send log to channel ${channelId}:`, err);
  }
}

export function logEmbed(title: string, description: string, color: number = VALO_RED): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
}

// Discord doesn't send old message content for messages the client hasn't
// cached (e.g. sent before this process started) — MessageUpdate/MessageDelete
// fire with a partial in that case, so callers must handle a possibly-missing value.
export function truncate(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
