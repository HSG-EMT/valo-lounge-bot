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
const help_1 = require("./commands/help");
const level_1 = require("./commands/level");
const luck_1 = require("./commands/luck");
const matchHistory_1 = require("./commands/matchHistory");
const slot_1 = require("./commands/slot");
const stats_1 = require("./commands/stats");
const stock_1 = require("./commands/stock");
const team_1 = require("./commands/team");
const tierBonus_1 = require("./commands/tierBonus");
const commands = [
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
    level_1.levelCommand,
    tierBonus_1.tierBonusCommand,
    help_1.helpCommand,
].map((c) => c.data.toJSON());
const rest = new discord_js_1.REST().setToken(env_1.env.discordBotToken);
async function main() {
    const result = (await rest.put(discord_js_1.Routes.applicationGuildCommands(env_1.env.discordClientId, env_1.env.discordGuildId), {
        body: commands,
    }));
    console.log(`Registered ${result.length} guild slash command(s).`);
}
main().catch((err) => {
    console.error("Failed to deploy commands:", err);
    process.exit(1);
});
//# sourceMappingURL=deploy-commands.js.map