"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tierBonusCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const levels_1 = require("../config/levels");
const points_service_1 = require("../services/points.service");
const cooldown_1 = require("../utils/cooldown");
const embed_1 = require("../utils/embed");
const BONUS_AMOUNT = 100;
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const ACTION = "TIER_BONUS";
exports.tierBonusCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("등급보너스").setDescription("플래티넘 등급 이상, 하루 한 번 CP 보너스를 받습니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const userLevel = await prisma_1.prisma.userLevel.findUnique({ where: { userId: user.id } });
        const { level } = (0, levels_1.levelFromTotalXp)(userLevel?.totalXp ?? 0);
        if (!(0, levels_1.hasDailyCpBonus)(level)) {
            const tier = (0, levels_1.getTier)(level);
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "💠 등급 보너스",
                        description: `플래티넘 등급(Lv.51)부터 이용할 수 있습니다.\n현재 등급: ${tier.emoji} ${tier.name} (Lv.${level})`,
                        color: embed_1.CASINO_TEAL,
                    }),
                ],
            });
            return;
        }
        const remaining = await (0, cooldown_1.getCooldownRemainingMs)(user.id, ACTION, DAILY_COOLDOWN_MS);
        if (remaining !== null) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "💠 등급 보너스",
                        description: `오늘의 등급 보너스는 이미 받으셨습니다.\n**${(0, cooldown_1.formatRemaining)(remaining)}** 후 다시 시도해주세요.`,
                        color: embed_1.CASINO_TEAL,
                    }),
                ],
            });
            return;
        }
        const [casinoPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.casinoPoint.update({ where: { userId: user.id }, data: { points: { increment: BONUS_AMOUNT } } }),
            prisma_1.prisma.statusLog.create({ data: { userId: user.id, action: ACTION, detail: `+${BONUS_AMOUNT}CP` } }),
        ]);
        await interaction.editReply({
            embeds: [
                (0, embed_1.buildEmbed)({
                    title: "💠 등급 보너스 지급!",
                    description: `┌ ${(0, levels_1.getTier)(level).emoji} ${(0, levels_1.getTier)(level).name} 등급 전용 보너스\n└ **+${BONUS_AMOUNT}CP**`,
                    color: embed_1.CASINO_TEAL,
                    footer: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP`,
                }),
            ],
        });
    },
};
//# sourceMappingURL=tierBonus.js.map