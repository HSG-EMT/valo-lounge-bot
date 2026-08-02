"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const env_1 = require("./config/env");
const achievements_1 = require("./commands/achievements");
const attendance_1 = require("./commands/attendance");
const casino_1 = require("./commands/casino");
const coin_1 = require("./commands/coin");
const dice_1 = require("./commands/dice");
const fishing_1 = require("./commands/fishing");
const fishingShop_1 = require("./commands/fishingShop");
const luck_1 = require("./commands/luck");
const matchHistory_1 = require("./commands/matchHistory");
const slot_1 = require("./commands/slot");
const stats_1 = require("./commands/stats");
const stock_1 = require("./commands/stock");
const team_1 = require("./commands/team");
const guildStats_1 = require("./events/guildStats");
const interactionCreate_1 = require("./events/interactionCreate");
const messageStats_1 = require("./events/messageStats");
const noticeSync_1 = require("./events/noticeSync");
const ready_1 = require("./events/ready");
const serverLogging_1 = require("./events/serverLogging");
const stockMarket_1 = require("./events/stockMarket");
const voiceTracking_1 = require("./events/voiceTracking");
const notice_service_1 = require("./services/notice.service");
const commands = new Map();
for (const command of [
    dice_1.diceCommand,
    coin_1.coinCommand,
    casino_1.casinoCommand,
    luck_1.luckCommand,
    matchHistory_1.matchHistoryCommand,
    team_1.teamCommand,
    attendance_1.attendanceCommand,
    fishing_1.fishingCommand,
    fishingShop_1.fishingShopCommand,
    stock_1.stockCommand,
    slot_1.slotCommand,
    achievements_1.achievementsCommand,
    stats_1.statsCommand,
]) {
    commands.set(command.data.name, command);
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        // Privileged intents — must be enabled under Bot > Privileged Gateway Intents
        // in the Discord Developer Portal, or the bot fails to log in.
        discord_js_1.GatewayIntentBits.GuildMembers, // resolves voice channel members for /팀짜기, also powers join/leave/nickname logs
        discord_js_1.GatewayIntentBits.GuildMessages, // receives messages for notice sync + message edit/delete logs
        discord_js_1.GatewayIntentBits.MessageContent, // reads message text/embeds for notice sync + message edit/delete logs
        discord_js_1.GatewayIntentBits.GuildModeration, // ban log — not privileged, no Developer Portal toggle needed
    ],
});
(0, ready_1.registerReady)(client);
(0, interactionCreate_1.registerInteractionCreate)(client, commands);
(0, noticeSync_1.registerNoticeSync)(client);
(0, guildStats_1.registerGuildStats)(client);
(0, voiceTracking_1.registerVoiceTracking)(client);
(0, stockMarket_1.registerStockMarket)(client);
(0, serverLogging_1.registerServerLogging)(client);
(0, messageStats_1.registerMessageStats)(client);
client.once(discord_js_1.Events.ClientReady, () => {
    (0, notice_service_1.backfillNotices)(client).catch((err) => console.error("Notice backfill failed:", err));
});
client.login(env_1.env.discordBotToken);
//# sourceMappingURL=index.js.map