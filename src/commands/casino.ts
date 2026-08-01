import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { buildEmbed, CASINO_TEAL } from "../utils/embed";

const MIN_BET = 10;
const WIN_CHANCE = 0.47; // slight house edge
const ACTION = "CASINO";

export const casinoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("카지노")
    .setDescription("CP(Casino Point)를 걸고 동전 던지기에 도전합니다.")
    .addIntegerOption((opt) =>
      opt
        .setName("베팅")
        .setDescription(`베팅할 CP (최소 ${MIN_BET}CP)`)
        .setRequired(true)
        .setMinValue(MIN_BET)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const bet = interaction.options.getInteger("베팅", true);
    const user = await ensureUser(interaction.user.id, interaction.user.username);
    const currentPoints = user.casinoPoint.points;

    if (bet > currentPoints) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "🎰 카지노",
            description: `보유 CP가 부족합니다. (보유: **${currentPoints.toLocaleString()}CP**)\nCP는 \`/낚시\`로 모을 수 있습니다.`,
            color: CASINO_TEAL,
            author: "🎰 VALO LOUNGE CASINO",
          }),
        ],
      });
      return;
    }

    const won = Math.random() < WIN_CHANCE;
    const delta = won ? bet : -bet;

    const [casinoPoint] = await prisma.$transaction([
      prisma.casinoPoint.update({
        where: { userId: user.id },
        data: { points: { increment: delta } },
      }),
      prisma.statusLog.create({
        data: {
          userId: user.id,
          action: ACTION,
          detail: `${won ? "승" : "패"} ${delta >= 0 ? "+" : ""}${delta}CP (베팅 ${bet}CP)`,
        },
      }),
    ]);

    const embed = new EmbedBuilder()
      .setColor(CASINO_TEAL)
      .setAuthor({ name: "🎰 VALO LOUNGE CASINO" })
      .setTitle(won ? "「 🪙 승리! 」" : "「 💸 패배... 」")
      .setDescription(
        `┌ 베팅 ${bet.toLocaleString()}CP · 승률 47%\n└ 결과 ${won ? "**+" : "**-"}${bet.toLocaleString()}CP**`
      )
      .setFooter({ text: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
