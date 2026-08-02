"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamCommand = void 0;
const discord_js_1 = require("discord.js");
const levels_1 = require("../config/levels");
const level_service_1 = require("../services/level.service");
const TEAM_BALANCER_PURPLE = 0x8b5cf6;
const TEAM_DOT = ["🔵", "🟣", "🟢", "🟡", "🔴", "🟠"];
function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
exports.teamCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("팀짜기")
        .setDescription("현재 음성 채널 참여자를 랜덤으로 팀 나눕니다.")
        .addIntegerOption((opt) => opt.setName("팀수").setDescription("나눌 팀 개수 (기본 2)").setMinValue(2).setMaxValue(6)),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: "서버 안에서만 사용할 수 있는 명령어입니다.",
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.deferReply();
        const guild = interaction.guild;
        if (!guild) {
            await interaction.editReply("서버 정보를 불러올 수 없습니다.");
            return;
        }
        // Full member fetch ensures voiceChannel.members below isn't limited to
        // whichever members the client's cache happened to already have.
        await guild.members.fetch();
        const member = await guild.members.fetch(interaction.user.id);
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            await interaction.editReply("먼저 음성 채널에 참여한 뒤 사용해주세요.");
            return;
        }
        const teamCount = interaction.options.getInteger("팀수") ?? 2;
        const participants = [...voiceChannel.members.values()].filter((m) => !m.user.bot);
        if (participants.length < teamCount) {
            await interaction.editReply(`음성 채널 인원(${participants.length}명)이 팀 수(${teamCount})보다 적습니다.`);
            return;
        }
        const shuffled = shuffle(participants);
        const teams = Array.from({ length: teamCount }, () => []);
        shuffled.forEach((m, i) => teams[i % teamCount].push(m.id));
        const xpResult = await (0, level_service_1.addXp)(interaction.user.id, interaction.user.username, levels_1.XP_MINIGAME);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(TEAM_BALANCER_PURPLE)
            .setAuthor({ name: "⚡ TEAM BALANCER SYSTEM" })
            .setTitle("「 🎲 팀 자동 분배 완료 」")
            .setDescription(`◆ 현재 음성채널 기준 자동 팀 분배\n◆ 공정한 랜덤 셔플 적용${(0, level_service_1.levelUpBanner)(xpResult)}`)
            .addFields(teams.map((team, i) => ({
            name: `┌ ${TEAM_DOT[i % TEAM_DOT.length]} TEAM ${i + 1} (${team.length}명)`,
            value: team.map((id) => `│ 🎯 <@${id}>`).join("\n"),
            inline: true,
        })))
            .setFooter({ text: `총 인원: ${participants.length}명 | 팀 수: ${teamCount}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};
//# sourceMappingURL=team.js.map