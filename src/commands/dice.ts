import { SlashCommandBuilder } from "discord.js";
import { Command } from "../types/command";
import { buildEmbed } from "../utils/embed";

export const diceCommand: Command = {
  data: new SlashCommandBuilder().setName("주사위").setDescription("1~100 사이의 숫자를 굴립니다."),

  async execute(interaction) {
    const roll = Math.floor(Math.random() * 100) + 1;

    await interaction.reply({
      embeds: [
        buildEmbed({
          title: "🎲 주사위",
          description: `${interaction.user}님이 주사위를 굴려 **${roll}**이(가) 나왔습니다!`,
          author: "🎲 VALO LOUNGE",
          footer: "1~100 사이의 무작위 숫자",
        }),
      ],
    });
  },
};
