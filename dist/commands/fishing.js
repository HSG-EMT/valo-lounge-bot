"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fishingCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const fishing_1 = require("../config/fishing");
const points_service_1 = require("../services/points.service");
const achievement_service_1 = require("../services/achievement.service");
const cooldown_1 = require("../utils/cooldown");
const embed_1 = require("../utils/embed");
const FISHING_COOLDOWN_MS = 25_000;
const ACTION = "FISHING";
exports.fishingCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("낚시").setDescription("낚시를 해서 CP(Casino Point)를 얻습니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const remaining = await (0, cooldown_1.getCooldownRemainingMs)(user.id, ACTION, FISHING_COOLDOWN_MS);
        if (remaining !== null) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "🎣 낚시",
                        description: `낚싯줄을 정리하는 중입니다.\n**${(0, cooldown_1.formatRemainingShort)(remaining)}** 후 다시 시도해주세요.`,
                        color: embed_1.CASINO_TEAL,
                        author: "🎣 VALO LOUNGE FISHING",
                    }),
                ],
            });
            return;
        }
        const rod = fishing_1.ROD_TIERS[user.casinoPoint.rodTier];
        const { grade, amount } = (0, fishing_1.rollFish)(user.casinoPoint.rodTier);
        const isCatch = amount > 0;
        const [casinoPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.casinoPoint.update({
                where: { userId: user.id },
                data: { points: { increment: amount } },
            }),
            prisma_1.prisma.statusLog.create({
                data: {
                    userId: user.id,
                    action: ACTION,
                    detail: isCatch ? `${grade.name} 낚음 +${amount}CP` : "꽝",
                },
            }),
        ]);
        let description = isCatch
            ? `┌ ${rod.emoji} ${rod.name}(으)로 낚는 중\n│ ${grade.emoji} **${grade.name}** 획득 — **+${amount.toLocaleString()}CP**\n└ CP는 /카지노·/낚시대상점·/주식에서 쓸 수 있어요`
            : `┌ ${rod.emoji} ${rod.name}(으)로 낚는 중\n│ 🥾 아무것도 걸리지 않았습니다\n└ 낚시대를 업그레이드하면 고급 물고기 확률이 올라가요`;
        if (grade.name === "전설") {
            const unlocked = await (0, achievement_service_1.tryUnlockAchievement)(user.id, "FISH_LEGENDARY");
            if (unlocked)
                description += (0, achievement_service_1.unlockBanner)(unlocked);
        }
        else if (grade.name === "심연의 괴물") {
            const unlocked = await (0, achievement_service_1.tryUnlockAchievement)(user.id, "FISH_ABYSS");
            if (unlocked)
                description += (0, achievement_service_1.unlockBanner)(unlocked);
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embed_1.CASINO_TEAL)
            .setAuthor({ name: "🎣 VALO LOUNGE FISHING" })
            .setTitle(isCatch ? `「 ${grade.emoji} ${grade.name} 낚시 성공! 」` : "「 🥾 꽝... 」")
            .setDescription(description)
            .setFooter({ text: `현재 보유 CP: ${casinoPoint.points.toLocaleString()}CP` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=fishing.js.map