import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { cumulativeBenefits, getTier, levelFromTotalXp, MAX_LEVEL, progressBar } from "../config/levels";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";

export const levelCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("레벨")
    .setDescription("나 또는 다른 유저의 레벨/등급을 확인합니다.")
    .addUserOption((opt) => opt.setName("대상").setDescription("확인할 유저 (생략 시 본인)")),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getUser("대상") ?? interaction.user;
    const user = await ensureUser(target.id, target.username);
    const userLevel = await prisma.userLevel.findUnique({ where: { userId: user.id } });
    const totalXp = userLevel?.totalXp ?? 0;

    const { level, xpIntoLevel, xpToNextLevel } = levelFromTotalXp(totalXp);
    const tier = getTier(level);
    const isMax = level >= MAX_LEVEL;

    const progressLine = isMax
      ? `${progressBar(1, 1)} MAX`
      : `${progressBar(xpIntoLevel, xpToNextLevel)} ${xpIntoLevel} / ${xpToNextLevel} XP`;

    const embed = new EmbedBuilder()
      .setColor(tier.color)
      .setAuthor({ name: "🎮 VALO LOUNGE LEVEL" })
      .setTitle(`「 ${tier.emoji} ${target.username} — Lv.${level} ${tier.name} 」`)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(
        `┌ 다음 레벨까지\n│ ${progressLine}\n└ 누적 XP: ${totalXp.toLocaleString()}`
      )
      .addFields({
        name: `${tier.emoji} ${tier.name} 등급 혜택`,
        value: cumulativeBenefits(tier).map((b) => `• ${b}`).join("\n"),
      })
      .setFooter({ text: "메시지·음성채널 활동, 출석체크, 미니게임 플레이로 경험치를 얻을 수 있어요" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
