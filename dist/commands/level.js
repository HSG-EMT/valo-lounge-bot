"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levelCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const levels_1 = require("../config/levels");
const points_service_1 = require("../services/points.service");
const embed_1 = require("../utils/embed");
exports.levelCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("레벨")
        .setDescription("나 또는 다른 유저의 레벨/등급을 확인합니다.")
        .addUserOption((opt) => opt.setName("대상").setDescription("확인할 유저 (생략 시 본인)")),
    async execute(interaction) {
        await interaction.deferReply();
        const target = interaction.options.getUser("대상") ?? interaction.user;
        const user = await (0, points_service_1.ensureUser)(target.id, target.username);
        const userLevel = await prisma_1.prisma.userLevel.findUnique({ where: { userId: user.id } });
        const totalXp = userLevel?.totalXp ?? 0;
        const { level, xpIntoLevel, xpToNextLevel } = (0, levels_1.levelFromTotalXp)(totalXp);
        const tier = (0, levels_1.getTier)(level);
        const isMax = level >= levels_1.MAX_LEVEL;
        const progressLine = isMax
            ? `${(0, levels_1.progressBar)(1, 1)} MAX`
            : `${(0, levels_1.progressBar)(xpIntoLevel, xpToNextLevel)} ${xpIntoLevel} / ${xpToNextLevel} XP`;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embed_1.VALO_RED)
            .setAuthor({ name: "🎮 VALO LOUNGE LEVEL" })
            .setTitle(`「 ${tier.emoji} ${target.username} — Lv.${level} ${tier.name} 」`)
            .setDescription(`┌ 다음 레벨까지\n│ ${progressLine}\n└ 누적 XP: ${totalXp.toLocaleString()}`)
            .addFields({
            name: `${tier.emoji} ${tier.name} 등급 혜택`,
            value: (0, levels_1.cumulativeBenefits)(tier).map((b) => `• ${b}`).join("\n"),
        })
            .setFooter({ text: "메시지·음성채널 활동, 출석체크, 미니게임 플레이로 경험치를 얻을 수 있어요" })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=level.js.map