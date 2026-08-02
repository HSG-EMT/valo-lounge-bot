import { SlashCommandBuilder } from "discord.js";
import { XP_MINIGAME } from "../config/levels";
import { addXp, levelUpBanner } from "../services/level.service";
import { Command } from "../types/command";
import { buildEmbed } from "../utils/embed";

export const diceCommand: Command = {
  data: new SlashCommandBuilder().setName("주사위").setDescription("1~100 사이의 숫자를 굴립니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const roll = Math.floor(Math.random() * 100) + 1;
    const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);

    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "🎲 주사위",
          description: `${interaction.user}님이 주사위를 굴려 **${roll}**이(가) 나왔습니다!${levelUpBanner(xpResult)}`,
          author: "🎲 VALO LOUNGE",
          footer: "1~100 사이의 무작위 숫자",
        }),
      ],
    });
  },
};
