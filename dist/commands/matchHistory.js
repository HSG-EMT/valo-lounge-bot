"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchHistoryCommand = void 0;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const riot_service_1 = require("../services/riot.service");
const embed_1 = require("../utils/embed");
const REGION_CHOICES = [
    { name: "한국 (KR)", value: "kr" },
    { name: "북미 (NA)", value: "na" },
    { name: "유럽 (EU)", value: "eu" },
    { name: "아시아태평양 (AP)", value: "ap" },
];
exports.matchHistoryCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("전적")
        .setDescription("발로란트 최근 전적을 조회합니다.")
        .addStringOption((opt) => opt.setName("닉네임").setDescription("Riot 게임 이름").setRequired(true))
        .addStringOption((opt) => opt.setName("태그").setDescription("Riot 태그 (# 뒤 부분)").setRequired(true))
        .addStringOption((opt) => opt.setName("지역").setDescription("리전 (기본: 한국)").addChoices(...REGION_CHOICES)),
    async execute(interaction) {
        if (!env_1.env.riotApiKey) {
            await interaction.reply({
                content: "Riot API 키가 설정되지 않아 전적 조회를 사용할 수 없습니다. 관리자에게 문의해주세요.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.deferReply();
        const gameName = interaction.options.getString("닉네임", true);
        const tagLine = interaction.options.getString("태그", true);
        const platform = interaction.options.getString("지역") ?? "kr";
        try {
            const account = await (0, riot_service_1.getAccountByRiotId)(gameName, tagLine, platform);
            const matchId = await (0, riot_service_1.getRecentMatchId)(account.puuid, platform);
            if (!matchId) {
                await interaction.editReply(`**${account.gameName}#${account.tagLine}**님의 최근 전적을 찾을 수 없습니다.`);
                return;
            }
            const [match, content] = await Promise.all([(0, riot_service_1.getMatchDetails)(matchId, platform), (0, riot_service_1.getContent)(platform)]);
            const me = match.players.find((p) => p.puuid === account.puuid);
            if (!me) {
                await interaction.editReply("매치에서 플레이어 정보를 찾을 수 없습니다.");
                return;
            }
            const myTeam = match.teams.find((t) => t.teamId === me.teamId);
            const agentName = (0, riot_service_1.resolveName)(content.characters, me.characterId);
            const mapName = (0, riot_service_1.resolveName)(content.maps, match.matchInfo.mapId);
            const resultText = myTeam ? (myTeam.won ? "승리" : "패배") : "결과 불명";
            const resultEmoji = myTeam ? (myTeam.won ? "🏆" : "💀") : "❔";
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: `📊 ${account.gameName}#${account.tagLine} 최근 전적`,
                        description: [
                            `┌ 🗺️ 맵: **${mapName}**`,
                            `│ ${resultEmoji} 결과: **${resultText}**`,
                            `│ 🧑‍🚀 에이전트: **${agentName}**`,
                            `└ ⚔️ K / D / A: **${me.stats.kills} / ${me.stats.deaths} / ${me.stats.assists}**`,
                        ].join("\n"),
                        author: "🎯 VALO LOUNGE MATCH TRACKER",
                    }),
                ],
            });
        }
        catch (err) {
            console.error("전적 조회 실패:", err);
            await interaction.editReply("전적 조회에 실패했습니다. 닉네임/태그를 확인하거나 잠시 후 다시 시도해주세요. (Riot API 키가 만료되었을 수 있습니다)");
        }
    },
};
//# sourceMappingURL=matchHistory.js.map