import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  discordBotToken: required("DISCORD_BOT_TOKEN"),
  discordClientId: required("DISCORD_CLIENT_ID"),
  discordGuildId: required("DISCORD_GUILD_ID"),

  // optional — only /전적 needs this. Commands check for it themselves instead of
  // crashing the whole bot on startup when it's missing.
  riotApiKey: process.env.RIOT_API_KEY ?? "",

  // optional — the channel synced into the Notice table for the website's
  // community page. Notice sync is skipped (with a warning) if unset.
  announcementChannelId: process.env.ANNOUNCEMENT_CHANNEL_ID ?? "",
};
