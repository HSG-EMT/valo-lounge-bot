"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const slot_1 = require("../config/slot");
const levels_1 = require("../config/levels");
const points_service_1 = require("../services/points.service");
const achievement_service_1 = require("../services/achievement.service");
const level_service_1 = require("../services/level.service");
const embed_1 = require("../utils/embed");
const MIN_BET = 10;
const ACTION = "SLOT";
const JACKPOT_EMOJI = "7️⃣";
exports.slotCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("슬롯")
        .setDescription("CP(Casino Point)를 걸고 슬롯머신을 돌립니다.")
        .addIntegerOption((opt) => opt
        .setName("베팅")
        .setDescription(`베팅할 CP (최소 ${MIN_BET}CP)`)
        .setRequired(true)
        .setMinValue(MIN_BET)),
    async execute(interaction) {
        await interaction.deferReply();
        const bet = interaction.options.getInteger("베팅", true);
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        if (bet > user.casinoPoint.points) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "🎰 슬롯머신",
                        description: `보유 CP가 부족합니다. (보유: **${user.casinoPoint.points.toLocaleString()}CP**)\nCP는 \`/낚시\`로 모을 수 있습니다.`,
                        color: embed_1.CASINO_TEAL,
                        author: "🎰 VALO LOUNGE SLOTS",
                    }),
                ],
            });
            return;
        }
        const result = (0, slot_1.spinSlot)();
        const payout = Math.round(bet * result.multiplier);
        const delta = payout - bet;
        const [casinoPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.casinoPoint.update({
                where: { userId: user.id },
                data: { points: { increment: delta } },
            }),
            prisma_1.prisma.statusLog.create({
                data: {
                    userId: user.id,
                    action: ACTION,
                    detail: `[${result.reels.map((r) => r.emoji).join("")}] ${delta >= 0 ? "+" : ""}${delta}CP (베팅 ${bet}CP)`,
                },
            }),
        ]);
        const reelLine = result.reels.map((r) => r.emoji).join(" | ");
        const resultLine = result.kind === "triple"
            ? `🎉 트리플! ×${result.multiplier} 배당 — **+${delta.toLocaleString()}CP**`
            : result.kind === "pair"
                ? `✨ 페어! ×${result.multiplier} 배당 — **+${delta.toLocaleString()}CP**`
                : `💨 꽝 — **${delta.toLocaleString()}CP**`;
        let description = `┌ [ ${reelLine} ]\n│ 베팅 ${bet.toLocaleString()}CP\n└ ${resultLine}`;
        const isJackpot = result.kind === "triple" && result.reels[0].emoji === JACKPOT_EMOJI;
        if (isJackpot) {
            const unlocked = await (0, achievement_service_1.tryUnlockAchievement)(user.id, "SLOT_JACKPOT");
            if (unlocked)
                description += (0, achievement_service_1.unlockBanner)(unlocked);
        }
        const xpResult = await (0, level_service_1.addXp)(interaction.user.id, interaction.user.username, levels_1.XP_MINIGAME);
        description += (0, level_service_1.levelUpBanner)(xpResult);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embed_1.CASINO_TEAL)
            .setAuthor({ name: "🎰 VALO LOUNGE SLOTS" })
            .setTitle(isJackpot ? "「 🎰 777 JACKPOT!! 」" : result.kind === "none" ? "「 🎰 슬롯머신 」" : "「 🎰 슬롯머신 — 적중! 」")
            .setDescription(description)
            .setFooter({ text: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=slot.js.map