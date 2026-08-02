import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { getTier, hasDailyCpBonus, levelFromTotalXp } from "../config/levels";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { formatRemaining, getCooldownRemainingMs } from "../utils/cooldown";
import { buildEmbed, CASINO_TEAL } from "../utils/embed";

const BONUS_AMOUNT = 100;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ACTION = "TIER_BONUS";

export const tierBonusCommand: Command = {
  data: new SlashCommandBuilder().setName("등급보너스").setDescription("플래티넘 등급 이상, 하루 한 번 CP 보너스를 받습니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);
    const userLevel = await prisma.userLevel.findUnique({ where: { userId: user.id } });
    const { level } = levelFromTotalXp(userLevel?.totalXp ?? 0);

    if (!hasDailyCpBonus(level)) {
      const tier = getTier(level);
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "💠 등급 보너스",
            description: `플래티넘 등급(Lv.51)부터 이용할 수 있습니다.\n현재 등급: ${tier.emoji} ${tier.name} (Lv.${level})`,
            color: CASINO_TEAL,
          }),
        ],
      });
      return;
    }

    const remaining = await getCooldownRemainingMs(user.id, ACTION, DAILY_COOLDOWN_MS);
    if (remaining !== null) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "💠 등급 보너스",
            description: `오늘의 등급 보너스는 이미 받으셨습니다.\n**${formatRemaining(remaining)}** 후 다시 시도해주세요.`,
            color: CASINO_TEAL,
          }),
        ],
      });
      return;
    }

    const [casinoPoint] = await prisma.$transaction([
      prisma.casinoPoint.update({ where: { userId: user.id }, data: { points: { increment: BONUS_AMOUNT } } }),
      prisma.statusLog.create({ data: { userId: user.id, action: ACTION, detail: `+${BONUS_AMOUNT}CP` } }),
    ]);

    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "💠 등급 보너스 지급!",
          description: `┌ ${getTier(level).emoji} ${getTier(level).name} 등급 전용 보너스\n└ **+${BONUS_AMOUNT}CP**`,
          color: CASINO_TEAL,
          footer: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP`,
        }),
      ],
    });
  },
};
