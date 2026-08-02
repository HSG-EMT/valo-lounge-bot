import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { XP_MINIGAME } from "../config/levels";
import { addXp, levelUpBanner } from "../services/level.service";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { formatRemaining, getCooldownRemainingMs } from "../utils/cooldown";
import { buildEmbed } from "../utils/embed";

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COIN_MIN = 10;
const COIN_MAX = 100;
const ACTION = "DAILY_COIN";

export const coinCommand: Command = {
  data: new SlashCommandBuilder().setName("코인").setDescription("하루 한 번, 랜덤 서버 포인트를 받습니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);

    const remaining = await getCooldownRemainingMs(user.id, ACTION, DAILY_COOLDOWN_MS);
    if (remaining !== null) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "⏳ 오늘의 코인",
            description: `이미 오늘의 코인을 받으셨습니다.\n**${formatRemaining(remaining)}** 후 다시 시도해주세요.`,
            author: "🪙 VALO LOUNGE",
          }),
        ],
      });
      return;
    }

    const amount = Math.floor(Math.random() * (COIN_MAX - COIN_MIN + 1)) + COIN_MIN;

    const [serverPoint] = await prisma.$transaction([
      prisma.serverPoint.upsert({
        where: { userId: user.id },
        update: { points: { increment: amount } },
        create: { userId: user.id, points: amount },
      }),
      prisma.statusLog.create({
        data: { userId: user.id, action: ACTION, detail: `+${amount}P` },
      }),
    ]);

    const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);

    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "🪙 오늘의 코인",
          description: `┌ 오늘의 코인 획득\n└ **+${amount}P**${levelUpBanner(xpResult)}`,
          author: "🪙 VALO LOUNGE",
          footer: `현재 보유 포인트: ${serverPoint.points.toLocaleString()}P`,
        }),
      ],
    });
  },
};
