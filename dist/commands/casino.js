"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.casinoCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const points_service_1 = require("../services/points.service");
const achievement_service_1 = require("../services/achievement.service");
const embed_1 = require("../utils/embed");
const MIN_BET = 10;
const WIN_CHANCE = 0.47; // slight house edge
const ACTION = "CASINO";
exports.casinoCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("카지노")
        .setDescription("CP(Casino Point)를 걸고 동전 던지기에 도전합니다.")
        .addIntegerOption((opt) => opt
        .setName("베팅")
        .setDescription(`베팅할 CP (최소 ${MIN_BET}CP)`)
        .setRequired(true)
        .setMinValue(MIN_BET)),
    async execute(interaction) {
        await interaction.deferReply();
        const bet = interaction.options.getInteger("베팅", true);
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const currentPoints = user.casinoPoint.points;
        if (bet > currentPoints) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "🎰 카지노",
                        description: `보유 CP가 부족합니다. (보유: **${currentPoints.toLocaleString()}CP**)\nCP는 \`/낚시\`로 모을 수 있습니다.`,
                        color: embed_1.CASINO_TEAL,
                        author: "🎰 VALO LOUNGE CASINO",
                    }),
                ],
            });
            return;
        }
        const won = Math.random() < WIN_CHANCE;
        const delta = won ? bet : -bet;
        const nextStreak = won ? user.casinoPoint.casinoWinStreak + 1 : 0;
        const [casinoPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.casinoPoint.update({
                where: { userId: user.id },
                data: { points: { increment: delta }, casinoWinStreak: nextStreak },
            }),
            prisma_1.prisma.statusLog.create({
                data: {
                    userId: user.id,
                    action: ACTION,
                    detail: `${won ? "승" : "패"} ${delta >= 0 ? "+" : ""}${delta}CP (베팅 ${bet}CP)`,
                },
            }),
        ]);
        let description = `┌ 베팅 ${bet.toLocaleString()}CP · 승률 47%\n└ 결과 ${won ? "**+" : "**-"}${bet.toLocaleString()}CP**`;
        if (nextStreak >= 5) {
            const unlocked = await (0, achievement_service_1.tryUnlockAchievement)(user.id, "CASINO_STREAK_5");
            if (unlocked)
                description += (0, achievement_service_1.unlockBanner)(unlocked);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embed_1.CASINO_TEAL)
            .setAuthor({ name: "🎰 VALO LOUNGE CASINO" })
            .setTitle(won ? "「 🪙 승리! 」" : "「 💸 패배... 」")
            .setDescription(description)
            .setFooter({ text: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=casino.js.map