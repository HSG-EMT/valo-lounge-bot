import { Client, Events } from "discord.js";
import { env } from "../config/env";
import { recordMessage } from "../services/messageStat.service";

export function registerMessageStats(client: Client): void {
  client.on(Events.MessageCreate, async (message) => {
    if (message.guild?.id !== env.discordGuildId) return;
    if (message.author.bot) return;

    try {
      await recordMessage(message.author.id, message.author.username);
    } catch (err) {
      console.error("Message stat recording failed:", err);
    }
  });
}
