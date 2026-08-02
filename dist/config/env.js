"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
exports.env = {
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
};
//# sourceMappingURL=env.js.map