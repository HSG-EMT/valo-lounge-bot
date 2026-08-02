import { Client, Events, GatewayIntentBits } from "discord.js";
import { env } from "./config/env";
import { achievementsCommand } from "./commands/achievements";
import { attendanceCommand } from "./commands/attendance";
import { casinoCommand } from "./commands/casino";
import { coinCommand } from "./commands/coin";
import { diceCommand } from "./commands/dice";
import { fishingCommand } from "./commands/fishing";
import { fishingShopCommand } from "./commands/fishingShop";
import { helpCommand } from "./commands/help";
import { levelCommand } from "./commands/level";
import { luckCommand } from "./commands/luck";
import { matchHistoryCommand } from "./commands/matchHistory";
import { slotCommand } from "./commands/slot";
import { statsCommand } from "./commands/stats";
import { stockCommand } from "./commands/stock";
import { teamCommand } from "./commands/team";
import { tierBonusCommand } from "./commands/tierBonus";
import { registerGuildStats } from "./events/guildStats";
import { registerInteractionCreate } from "./events/interactionCreate";
import { registerMessageStats } from "./events/messageStats";
import { registerNoticeSync } from "./events/noticeSync";
import { registerReady } from "./events/ready";
import { registerServerLogging } from "./events/serverLogging";
import { registerStockMarket } from "./events/stockMarket";
import { registerVoiceTracking } from "./events/voiceTracking";
import { backfillNotices } from "./services/notice.service";
import { Command } from "./types/command";

const commands = new Map<string, Command>();
for (const command of [
  diceCommand,
  coinCommand,
  casinoCommand,
  luckCommand,
  matchHistoryCommand,
  teamCommand,
  attendanceCommand,
  fishingCommand,
  fishingShopCommand,
  stockCommand,
  slotCommand,
  achievementsCommand,
  statsCommand,
  levelCommand,
  tierBonusCommand,
  helpCommand,
]) {
  commands.set(command.data.name, command);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    // Privileged intents — must be enabled under Bot > Privileged Gateway Intents
    // in the Discord Developer Portal, or the bot fails to log in.
    GatewayIntentBits.GuildMembers, // resolves voice channel members for /팀짜기, also powers join/leave/nickname logs
    GatewayIntentBits.GuildMessages, // receives messages for notice sync + message edit/delete logs
    GatewayIntentBits.MessageContent, // reads message text/embeds for notice sync + message edit/delete logs
    GatewayIntentBits.GuildModeration, // ban log — not privileged, no Developer Portal toggle needed
  ],
});

registerReady(client);
registerInteractionCreate(client, commands);
registerNoticeSync(client);
registerGuildStats(client);
registerVoiceTracking(client);
registerStockMarket(client);
registerServerLogging(client);
registerMessageStats(client);

client.once(Events.ClientReady, () => {
  backfillNotices(client).catch((err) => console.error("Notice backfill failed:", err));
});

client.login(env.discordBotToken);
