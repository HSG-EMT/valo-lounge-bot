"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coinCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const levels_1 = require("../config/levels");
const level_service_1 = require("../services/level.service");
const points_service_1 = require("../services/points.service");
const cooldown_1 = require("../utils/cooldown");
const embed_1 = require("../utils/embed");
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const COIN_MIN = 10;
const COIN_MAX = 100;
const ACTION = "DAILY_COIN";
exports.coinCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("코인").setDescription("하루 한 번, 랜덤 서버 포인트를 받습니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const remaining = await (0, cooldown_1.getCooldownRemainingMs)(user.id, ACTION, DAILY_COOLDOWN_MS);
        if (remaining !== null) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "⏳ 오늘의 코인",
                        description: `이미 오늘의 코인을 받으셨습니다.\n**${(0, cooldown_1.formatRemaining)(remaining)}** 후 다시 시도해주세요.`,
                        author: "🪙 VALO LOUNGE",
                    }),
                ],
            });
            return;
        }
        const amount = Math.floor(Math.random() * (COIN_MAX - COIN_MIN + 1)) + COIN_MIN;
        const [serverPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.serverPoint.upsert({
                where: { userId: user.id },
                update: { points: { increment: amount } },
                create: { userId: user.id, points: amount },
            }),
            prisma_1.prisma.statusLog.create({
                data: { userId: user.id, action: ACTION, detail: `+${amount}P` },
            }),
        ]);
        const xpResult = await (0, level_service_1.addXp)(interaction.user.id, interaction.user.username, levels_1.XP_MINIGAME);
        await interaction.editReply({
            embeds: [
                (0, embed_1.buildEmbed)({
                    title: "🪙 오늘의 코인",
                    description: `┌ 오늘의 코인 획득\n└ **+${amount}P**${(0, level_service_1.levelUpBanner)(xpResult)}`,
                    author: "🪙 VALO LOUNGE",
                    footer: `현재 보유 포인트: ${serverPoint.points.toLocaleString()}P`,
                }),
            ],
        });
    },
};
//# sourceMappingURL=coin.js.map