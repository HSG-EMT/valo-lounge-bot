import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { SLOT_SYMBOLS, spinSlot } from "../config/slot";
import { XP_MINIGAME } from "../config/levels";
import { ensureUser } from "../services/points.service";
import { tryUnlockAchievement, unlockBanner } from "../services/achievement.service";
import { addXp, levelUpBanner } from "../services/level.service";
import { Command } from "../types/command";
import { buildEmbed, CASINO_TEAL } from "../utils/embed";

const MIN_BET = 10;
const ACTION = "SLOT";
const JACKPOT_EMOJI = "7️⃣";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomReelEmoji(): string {
  return SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)].emoji;
}

function spinningEmbed(reels: string[], bet: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(CASINO_TEAL)
    .setAuthor({ name: "🎰 VALO LOUNGE SLOTS" })
    .setTitle("「 🎰 슬롯머신 — 돌아가는 중... 」")
    .setDescription(`┌ [ ${reels.join(" | ")} ]\n│ 베팅 ${bet.toLocaleString()}CP\n└ 릴이 멈추는 중...`);
}

export const slotCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("슬롯")
    .setDescription("CP(Casino Point)를 걸고 슬롯머신을 돌립니다.")
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

    if (bet > user.casinoPoint.points) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "🎰 슬롯머신",
            description: `보유 CP가 부족합니다. (보유: **${user.casinoPoint.points.toLocaleString()}CP**)\nCP는 \`/낚시\`로 모을 수 있습니다.`,
            color: CASINO_TEAL,
            author: "🎰 VALO LOUNGE SLOTS",
          }),
        ],
      });
      return;
    }

    const result = spinSlot();
    const finalEmojis = result.reels.map((r) => r.emoji);

    // Reels stop one at a time, left to right, like a real slot machine —
    // the outcome is already decided above, this just plays it out visually.
    const spinStages: string[][] = [
      [randomReelEmoji(), randomReelEmoji(), randomReelEmoji()],
      [randomReelEmoji(), randomReelEmoji(), randomReelEmoji()],
      [finalEmojis[0], randomReelEmoji(), randomReelEmoji()],
      [finalEmojis[0], finalEmojis[1], randomReelEmoji()],
    ];
    for (const stage of spinStages) {
      await interaction.editReply({ embeds: [spinningEmbed(stage, bet)] });
      await sleep(450);
    }

    const payout = Math.round(bet * result.multiplier);
    const delta = payout - bet;

    const [casinoPoint] = await prisma.$transaction([
      prisma.casinoPoint.update({
        where: { userId: user.id },
        data: { points: { increment: delta } },
      }),
      prisma.statusLog.create({
        data: {
          userId: user.id,
          action: ACTION,
          detail: `[${result.reels.map((r) => r.emoji).join("")}] ${delta >= 0 ? "+" : ""}${delta}CP (베팅 ${bet}CP)`,
        },
      }),
    ]);

    const reelLine = result.reels.map((r) => r.emoji).join(" | ");
    const resultLine =
      result.kind === "triple"
        ? `🎉 트리플! ×${result.multiplier} 배당 — **+${delta.toLocaleString()}CP**`
        : result.kind === "pair"
        ? `✨ 페어! ×${result.multiplier} 배당 — **+${delta.toLocaleString()}CP**`
        : `💨 꽝 — **${delta.toLocaleString()}CP**`;

    let description = `┌ [ ${reelLine} ]\n│ 베팅 ${bet.toLocaleString()}CP\n└ ${resultLine}`;

    const isJackpot = result.kind === "triple" && result.reels[0].emoji === JACKPOT_EMOJI;
    if (isJackpot) {
      const unlocked = await tryUnlockAchievement(user.id, "SLOT_JACKPOT");
      if (unlocked) description += unlockBanner(unlocked);
    }

    const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);
    description += levelUpBanner(xpResult);

    const embed = new EmbedBuilder()
      .setColor(CASINO_TEAL)
      .setAuthor({ name: "🎰 VALO LOUNGE SLOTS" })
      .setTitle(isJackpot ? "「 🎰 777 JACKPOT!! 」" : result.kind === "none" ? "「 🎰 슬롯머신 」" : "「 🎰 슬롯머신 — 적중! 」")
      .setDescription(description)
      .setFooter({ text: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
