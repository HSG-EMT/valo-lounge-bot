"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diceCommand = void 0;
const discord_js_1 = require("discord.js");
const levels_1 = require("../config/levels");
const level_service_1 = require("../services/level.service");
const embed_1 = require("../utils/embed");
exports.diceCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("주사위").setDescription("1~100 사이의 숫자를 굴립니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const roll = Math.floor(Math.random() * 100) + 1;
        const xpResult = await (0, level_service_1.addXp)(interaction.user.id, interaction.user.username, levels_1.XP_MINIGAME);
        await interaction.editReply({
            embeds: [
                (0, embed_1.buildEmbed)({
                    title: "🎲 주사위",
                    description: `${interaction.user}님이 주사위를 굴려 **${roll}**이(가) 나왔습니다!${(0, level_service_1.levelUpBanner)(xpResult)}`,
                    author: "🎲 VALO LOUNGE",
                    footer: "1~100 사이의 무작위 숫자",
                }),
            ],
        });
    },
};
//# sourceMappingURL=dice.js.map