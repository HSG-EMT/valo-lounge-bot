"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const stats_service_1 = require("../services/stats.service");
const permissions_1 = require("../utils/permissions");
const embed_1 = require("../utils/embed");
const DEFAULT_LIMIT = 10;
function medal(rank) {
    return rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`;
}
function leaderboardDescription(entries, formatValue) {
    if (entries.length === 0)
        return "아직 데이터가 없습니다.";
    return entries.map((e, i) => `${medal(i)} <@${e.discordId}> — **${formatValue(e.value)}**`).join("\n");
}
async function checkPermission(interaction) {
    if (!interaction.inGuild() || !interaction.guild) {
        await interaction.reply({ content: "서버 안에서만 사용할 수 있는 명령어입니다.", flags: discord_js_1.MessageFlags.Ephemeral });
        return false;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!(0, permissions_1.hasStatsRole)(member)) {
        await interaction.reply({ content: "이 명령어를 사용할 권한이 없습니다.", flags: discord_js_1.MessageFlags.Ephemeral });
        return false;
    }
    return true;
}
async function handleUser(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser("대상", true);
    const dbUser = await prisma_1.prisma.user.findUnique({ where: { discordId: target.id } });
    const messageStat = dbUser ? await prisma_1.prisma.messageStat.findUnique({ where: { userId: dbUser.id } }) : null;
    const voiceSeconds = dbUser ? await (0, stats_service_1.getUserVoiceSeconds)(dbUser.id) : 0;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embed_1.VALO_RED)
        .setAuthor({ name: "📊 VALO LOUNGE STATS" })
        .setTitle(`「 ${target.username} 사용량 조사 」`)
        .setThumbnail(target.displayAvatarURL())
        .addFields({ name: "🔊 누적 음성 채널 시간", value: (0, stats_service_1.formatDuration)(voiceSeconds), inline: true }, { name: "💬 누적 메시지 수", value: `${(messageStat?.totalCount ?? 0).toLocaleString()}개`, inline: true }, { name: "📅 오늘 메시지 수", value: `${(messageStat?.todayCount ?? 0).toLocaleString()}개`, inline: true })
        .setFooter({
        text: messageStat?.lastMessageAt
            ? `마지막 메시지: ${messageStat.lastMessageAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
            : "메시지 기록 없음",
    })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
async function handleVoiceRanking(interaction) {
    await interaction.deferReply();
    const limit = interaction.options.getInteger("인원수") ?? DEFAULT_LIMIT;
    const entries = await (0, stats_service_1.getVoiceLeaderboard)(limit);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embed_1.VALO_RED)
        .setAuthor({ name: "📊 VALO LOUNGE STATS" })
        .setTitle("「 🔊 음성 채널 사용량 순위 」")
        .setDescription(leaderboardDescription(entries, stats_service_1.formatDuration))
        .setFooter({ text: `${entries.length}명 표시 · 접속 중인 세션은 지금 기준으로 반영됩니다` })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
async function handleMessageRanking(interaction) {
    await interaction.deferReply();
    const limit = interaction.options.getInteger("인원수") ?? DEFAULT_LIMIT;
    const entries = await (0, stats_service_1.getMessageLeaderboard)(limit);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embed_1.VALO_RED)
        .setAuthor({ name: "📊 VALO LOUNGE STATS" })
        .setTitle("「 💬 메시지 수 순위 」")
        .setDescription(leaderboardDescription(entries, (v) => `${v.toLocaleString()}개`))
        .setFooter({ text: `${entries.length}명 표시` })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
async function handleOverall(interaction) {
    await interaction.deferReply();
    const guild = interaction.guild;
    const stats = await (0, stats_service_1.getOverallStats)(guild);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(embed_1.VALO_RED)
        .setAuthor({ name: "📊 VALO LOUNGE STATS" })
        .setTitle("「 📊 서버 전체 통계 」")
        .addFields({ name: "👥 현재 인원", value: `${stats.currentMemberCount.toLocaleString()}명`, inline: true }, { name: "🔊 현재 음성 접속", value: `${stats.currentVoiceCount.toLocaleString()}명`, inline: true }, { name: "​", value: "​", inline: true }, { name: "💬 누적 메시지 수", value: `${stats.totalMessages.toLocaleString()}개`, inline: true }, { name: "💬 메시지 남긴 유저 수", value: `${stats.messageActiveUsers.toLocaleString()}명`, inline: true }, { name: "​", value: "​", inline: true }, { name: "🔊 누적 음성 채널 시간", value: (0, stats_service_1.formatDuration)(stats.totalVoiceSeconds), inline: true }, { name: "🔊 음성채널 사용 유저 수", value: `${stats.voiceActiveUsers.toLocaleString()}명`, inline: true }, { name: "​", value: "​", inline: true })
        .setFooter({ text: "실시간 스냅샷 — 접속 중인 음성 세션은 지금 기준으로 반영됩니다" })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
exports.statsCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("통계")
        .setDescription("서버 사용량 통계를 조회합니다. (관리자 전용)")
        .addSubcommand((sub) => sub
        .setName("유저")
        .setDescription("특정 유저의 음성/메시지 사용량을 조회합니다.")
        .addUserOption((opt) => opt.setName("대상").setDescription("조회할 유저").setRequired(true)))
        .addSubcommand((sub) => sub
        .setName("보이스순위")
        .setDescription("전체 유저 음성 채널 사용량 순위를 조회합니다.")
        .addIntegerOption((opt) => opt.setName("인원수").setDescription("표시할 인원 수 (기본 10)").setMinValue(1).setMaxValue(25)))
        .addSubcommand((sub) => sub
        .setName("메시지순위")
        .setDescription("전체 유저 메시지 수 순위를 조회합니다.")
        .addIntegerOption((opt) => opt.setName("인원수").setDescription("표시할 인원 수 (기본 10)").setMinValue(1).setMaxValue(25)))
        .addSubcommand((sub) => sub.setName("전체").setDescription("서버 전체 통계 요약을 조회합니다.")),
    async execute(interaction) {
        if (!(await checkPermission(interaction)))
            return;
        const sub = interaction.options.getSubcommand();
        if (sub === "유저")
            return handleUser(interaction);
        if (sub === "보이스순위")
            return handleVoiceRanking(interaction);
        if (sub === "메시지순위")
            return handleMessageRanking(interaction);
        if (sub === "전체")
            return handleOverall(interaction);
    },
};
//# sourceMappingURL=stats.js.map