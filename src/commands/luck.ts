import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { XP_MINIGAME } from "../config/levels";
import { addXp, levelUpBanner } from "../services/level.service";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { formatRemaining, getCooldownRemainingMs } from "../utils/cooldown";
import { buildEmbed, CASINO_TEAL, VALO_RED } from "../utils/embed";

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ACTION = "DAILY_LUCK";

const FORTUNES = [
  { tier: "대길", emoji: "🌟", weight: 10, message: "오늘은 무엇을 해도 술술 풀리는 날입니다!", color: CASINO_TEAL },
  { tier: "길", emoji: "✨", weight: 30, message: "좋은 일이 생길 예감이 드는 하루입니다.", color: CASINO_TEAL },
  { tier: "평", emoji: "🍃", weight: 35, message: "평범하지만 무탈한 하루가 될 거예요.", color: VALO_RED },
  { tier: "흉", emoji: "🌧️", weight: 20, message: "오늘은 신중하게 행동하는 게 좋겠어요.", color: VALO_RED },
  { tier: "대흉", emoji: "⚡", weight: 5, message: "오늘은 무리하지 말고 푹 쉬는 게 어떨까요.", color: VALO_RED },
];

function pickFortune() {
  const total = FORTUNES.reduce((sum, f) => sum + f.weight, 0);
  let roll = Math.random() * total;
  for (const fortune of FORTUNES) {
    if (roll < fortune.weight) return fortune;
    roll -= fortune.weight;
  }
  return FORTUNES[FORTUNES.length - 1];
}

export const luckCommand: Command = {
  data: new SlashCommandBuilder().setName("행운").setDescription("오늘의 운세를 확인합니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);

    const remaining = await getCooldownRemainingMs(user.id, ACTION, DAILY_COOLDOWN_MS);
    if (remaining !== null) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "🔮 오늘의 행운",
            description: `이미 오늘의 운세를 확인하셨습니다.\n**${formatRemaining(remaining)}** 후 다시 시도해주세요.`,
            author: "🔮 VALO LOUNGE",
          }),
        ],
      });
      return;
    }

    const fortune = pickFortune();

    await prisma.statusLog.create({
      data: { userId: user.id, action: ACTION, detail: fortune.tier },
    });

    const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);

    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: `${fortune.emoji} 오늘의 운세 — ${fortune.tier}`,
          description: `${fortune.message}${levelUpBanner(xpResult)}`,
          author: "🔮 VALO LOUNGE",
          color: fortune.color,
        }),
      ],
    });
  },
};
