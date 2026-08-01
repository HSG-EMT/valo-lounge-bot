"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementsCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const achievements_1 = require("../config/achievements");
const points_service_1 = require("../services/points.service");
const embed_1 = require("../utils/embed");
exports.achievementsCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("업적").setDescription("내가 달성한 업적/뱃지를 확인합니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const unlocked = await prisma_1.prisma.achievement.findMany({ where: { userId: user.id } });
        const unlockedKeys = new Set(unlocked.map((a) => a.key));
        const fields = achievements_1.ACHIEVEMENTS.map((a) => {
            const has = unlockedKeys.has(a.key);
            return {
                name: `${has ? "✅" : "🔒"} ${a.emoji} ${a.name}`,
                value: has ? a.description : "???",
                inline: true,
            };
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(embed_1.VALO_RED)
            .setAuthor({ name: "🏅 VALO LOUNGE ACHIEVEMENTS" })
            .setTitle("「 🏅 업적 」")
            .addFields(fields)
            .setFooter({ text: `${unlockedKeys.size} / ${achievements_1.ACHIEVEMENTS.length} 달성` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=achievements.js.map