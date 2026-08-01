import { REST, Routes } from "discord.js";
import { env } from "./config/env";
import { achievementsCommand } from "./commands/achievements";
import { attendanceCommand } from "./commands/attendance";
import { casinoCommand } from "./commands/casino";
import { coinCommand } from "./commands/coin";
import { diceCommand } from "./commands/dice";
import { fishingCommand } from "./commands/fishing";
import { fishingShopCommand } from "./commands/fishingShop";
import { luckCommand } from "./commands/luck";
import { matchHistoryCommand } from "./commands/matchHistory";
import { slotCommand } from "./commands/slot";
import { stockCommand } from "./commands/stock";
import { teamCommand } from "./commands/team";

const commands = [
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
].map((c) => c.data.toJSON());

const rest = new REST().setToken(env.discordBotToken);

async function main() {
  const result = (await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), {
    body: commands,
  })) as unknown[];

  console.log(`Registered ${result.length} guild slash command(s).`);
}

main().catch((err) => {
  console.error("Failed to deploy commands:", err);
  process.exit(1);
});
