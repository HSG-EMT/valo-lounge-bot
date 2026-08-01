import { Client, Events, InteractionReplyOptions, MessageFlags } from "discord.js";
import { Command } from "../types/command";

export function registerInteractionCreate(client: Client, commands: Map<string, Command>): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`Command "${interaction.commandName}" failed:`, err);
      const payload: InteractionReplyOptions = {
        content: "명령어 실행 중 오류가 발생했습니다.",
        flags: MessageFlags.Ephemeral,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });
}
