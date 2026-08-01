import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { ROD_TIERS } from "../config/fishing";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { buildEmbed, CASINO_TEAL } from "../utils/embed";

export const fishingShopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("낚시대상점")
    .setDescription("낚시대 목록을 보거나 CP로 다음 등급 낚시대를 구매합니다.")
    .addBooleanOption((opt) => opt.setName("구매").setDescription("다음 등급 낚시대를 CP로 구매합니다")),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);
    const currentTier = user.casinoPoint.rodTier;

    if (interaction.options.getBoolean("구매")) {
      const nextTier = currentTier + 1;
      const nextRod = ROD_TIERS[nextTier];

      if (!nextRod) {
        await interaction.editReply({
          embeds: [
            buildEmbed({
              title: "🎣 낚시대 상점",
              description: "이미 최고 등급 낚시대를 보유하고 있습니다.",
              color: CASINO_TEAL,
              author: "🎣 VALO LOUNGE FISHING SHOP",
            }),
          ],
        });
        return;
      }

      if (user.casinoPoint.points < nextRod.cost) {
        await interaction.editReply({
          embeds: [
            buildEmbed({
              title: "🎣 낚시대 상점",
              description: `CP가 부족합니다. (필요 **${nextRod.cost.toLocaleString()}CP**, 보유 **${user.casinoPoint.points.toLocaleString()}CP**)`,
              color: CASINO_TEAL,
              author: "🎣 VALO LOUNGE FISHING SHOP",
            }),
          ],
        });
        return;
      }

      const [casinoPoint] = await prisma.$transaction([
        prisma.casinoPoint.update({
          where: { userId: user.id },
          data: { points: { decrement: nextRod.cost }, rodTier: nextTier },
        }),
        prisma.statusLog.create({
          data: { userId: user.id, action: "ROD_UPGRADE", detail: `${nextRod.name} 구매 -${nextRod.cost}CP` },
        }),
      ]);

      const boughtEmbed = new EmbedBuilder()
        .setColor(CASINO_TEAL)
        .setAuthor({ name: "🎣 VALO LOUNGE FISHING SHOP" })
        .setTitle(`「 ${nextRod.emoji} ${nextRod.name} 구매 완료! 」`)
        .setDescription(`┌ 가격 -${nextRod.cost.toLocaleString()}CP\n└ 고급 물고기를 낚을 확률이 올라갑니다`)
        .setFooter({ text: `남은 CP: ${casinoPoint.points.toLocaleString()}CP` })
        .setTimestamp();

      await interaction.editReply({ embeds: [boughtEmbed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(CASINO_TEAL)
      .setAuthor({ name: "🎣 VALO LOUNGE FISHING SHOP" })
      .setTitle("「 🎣 낚시대 상점 」")
      .addFields(
        ROD_TIERS.map((rod, i) => {
          const equipped = i === currentTier;
          const owned = i <= currentTier;
          const marker = equipped ? "▶" : owned ? "✅" : "🔒";
          const status = equipped ? "장착 중" : owned ? "보유" : i === 0 ? "기본 지급" : `${rod.cost.toLocaleString()}CP`;
          return {
            name: `${marker} ${rod.emoji} ${rod.name}`,
            value: status,
            inline: true,
          };
        })
      )
      .setFooter({ text: `보유 CP: ${user.casinoPoint.points.toLocaleString()}CP · /낚시대상점 구매:true 로 다음 등급 구매` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
