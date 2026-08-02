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

  // optional — server activity log channels (StatBot-style). Each is independently
  // skipped (with a warning) if unset, so partial setups don't crash the bot.
  logChannels: {
    memberJoin: process.env.LOG_CHANNEL_MEMBER_JOIN ?? "",
    memberLeave: process.env.LOG_CHANNEL_MEMBER_LEAVE ?? "",
    nicknameChange: process.env.LOG_CHANNEL_NICKNAME_CHANGE ?? "",
    ban: process.env.LOG_CHANNEL_BAN ?? "",
    voiceJoin: process.env.LOG_CHANNEL_VOICE_JOIN ?? "",
    voiceLeave: process.env.LOG_CHANNEL_VOICE_LEAVE ?? "",
    messageEdit: process.env.LOG_CHANNEL_MESSAGE_EDIT ?? "",
    messageDelete: process.env.LOG_CHANNEL_MESSAGE_DELETE ?? "",
  },

  // Comma-separated Discord role IDs allowed to use /통계 (admin usage-lookup
  // command). A member needs at least one of these roles.
  statsRoleIds: (process.env.STATS_ROLE_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
};
