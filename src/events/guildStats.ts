import { Client, Events } from "discord.js";
import { env } from "../config/env";
import { recordMemberJoin, refreshGuildStats } from "../services/guildStats.service";

const REFRESH_INTERVAL_MS = 60 * 1000;

export function registerGuildStats(client: Client): void {
  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.guild.id !== env.discordGuildId) return;
    await recordMemberJoin().catch((err) => console.error("Guild stats (member join) failed:", err));
  });

  client.once(Events.ClientReady, () => {
    refreshGuildStats(client).catch((err) => console.error("Initial guild stats refresh failed:", err));
    setInterval(() => {
      refreshGuildStats(client).catch((err) => console.error("Guild stats refresh failed:", err));
    }, REFRESH_INTERVAL_MS);
  });
}
