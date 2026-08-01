import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { ACHIEVEMENTS } from "../config/achievements";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { VALO_RED } from "../utils/embed";

export const achievementsCommand: Command = {
  data: new SlashCommandBuilder().setName("업적").setDescription("내가 달성한 업적/뱃지를 확인합니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);
    const unlocked = await prisma.achievement.findMany({ where: { userId: user.id } });
    const unlockedKeys = new Set(unlocked.map((a) => a.key));

    const fields = ACHIEVEMENTS.map((a) => {
      const has = unlockedKeys.has(a.key);
      return {
        name: `${has ? "✅" : "🔒"} ${a.emoji} ${a.name}`,
        value: has ? a.description : "???",
        inline: true,
      };
    });

    const embed = new EmbedBuilder()
      .setColor(VALO_RED)
      .setAuthor({ name: "🏅 VALO LOUNGE ACHIEVEMENTS" })
      .setTitle("「 🏅 업적 」")
      .addFields(fields)
      .setFooter({ text: `${unlockedKeys.size} / ${ACHIEVEMENTS.length} 달성` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
