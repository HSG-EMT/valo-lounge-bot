import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import {
  formatDuration,
  getMessageLeaderboard,
  getOverallStats,
  getUserVoiceSeconds,
  getVoiceLeaderboard,
  LeaderboardEntry,
} from "../services/stats.service";
import { Command } from "../types/command";
import { hasStatsRole } from "../utils/permissions";
import { VALO_RED } from "../utils/embed";

const DEFAULT_LIMIT = 10;

function medal(rank: number): string {
  return rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`;
}

function leaderboardDescription(entries: LeaderboardEntry[], formatValue: (v: number) => string): string {
  if (entries.length === 0) return "아직 데이터가 없습니다.";
  return entries.map((e, i) => `${medal(i)} <@${e.discordId}> — **${formatValue(e.value)}**`).join("\n");
}

async function checkPermission(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: "서버 안에서만 사용할 수 있는 명령어입니다.", flags: MessageFlags.Ephemeral });
    return false;
  }
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!hasStatsRole(member)) {
    await interaction.reply({ content: "이 명령어를 사용할 권한이 없습니다.", flags: MessageFlags.Ephemeral });
    return false;
  }
  return true;
}

async function handleUser(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const target = interaction.options.getUser("대상", true);
  const dbUser = await prisma.user.findUnique({ where: { discordId: target.id } });
  const messageStat = dbUser ? await prisma.messageStat.findUnique({ where: { userId: dbUser.id } }) : null;
  const voiceSeconds = dbUser ? await getUserVoiceSeconds(dbUser.id) : 0;

  const embed = new EmbedBuilder()
    .setColor(VALO_RED)
    .setAuthor({ name: "📊 VALO LOUNGE STATS" })
    .setTitle(`「 ${target.username} 사용량 조사 」`)
    .addFields(
      { name: "🔊 누적 음성 채널 시간", value: formatDuration(voiceSeconds), inline: true },
      { name: "💬 누적 메시지 수", value: `${(messageStat?.totalCount ?? 0).toLocaleString()}개`, inline: true },
      { name: "📅 오늘 메시지 수", value: `${(messageStat?.todayCount ?? 0).toLocaleString()}개`, inline: true }
    )
    .setFooter({
      text: messageStat?.lastMessageAt
        ? `마지막 메시지: ${messageStat.lastMessageAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`
        : "메시지 기록 없음",
    })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleVoiceRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const limit = interaction.options.getInteger("인원수") ?? DEFAULT_LIMIT;
  const entries = await getVoiceLeaderboard(limit);

  const embed = new EmbedBuilder()
    .setColor(VALO_RED)
    .setAuthor({ name: "📊 VALO LOUNGE STATS" })
    .setTitle("「 🔊 음성 채널 사용량 순위 」")
    .setDescription(leaderboardDescription(entries, formatDuration))
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleMessageRanking(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const limit = interaction.options.getInteger("인원수") ?? DEFAULT_LIMIT;
  const entries = await getMessageLeaderboard(limit);

  const embed = new EmbedBuilder()
    .setColor(VALO_RED)
    .setAuthor({ name: "📊 VALO LOUNGE STATS" })
    .setTitle("「 💬 메시지 수 순위 」")
    .setDescription(leaderboardDescription(entries, (v) => `${v.toLocaleString()}개`))
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleOverall(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const guild = interaction.guild!;
  const stats = await getOverallStats(guild);

  const embed = new EmbedBuilder()
    .setColor(VALO_RED)
    .setAuthor({ name: "📊 VALO LOUNGE STATS" })
    .setTitle("「 📊 서버 전체 통계 」")
    .addFields(
      { name: "👥 현재 인원", value: `${stats.currentMemberCount.toLocaleString()}명`, inline: true },
      { name: "🔊 현재 음성 접속", value: `${stats.currentVoiceCount.toLocaleString()}명`, inline: true },
      { name: "​", value: "​", inline: true },
      { name: "💬 누적 메시지 수", value: `${stats.totalMessages.toLocaleString()}개`, inline: true },
      { name: "💬 메시지 남긴 유저 수", value: `${stats.messageActiveUsers.toLocaleString()}명`, inline: true },
      { name: "​", value: "​", inline: true },
      { name: "🔊 누적 음성 채널 시간", value: formatDuration(stats.totalVoiceSeconds), inline: true },
      { name: "🔊 음성채널 사용 유저 수", value: `${stats.voiceActiveUsers.toLocaleString()}명`, inline: true },
      { name: "​", value: "​", inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export const statsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("통계")
    .setDescription("서버 사용량 통계를 조회합니다. (관리자 전용)")
    .addSubcommand((sub) =>
      sub
        .setName("유저")
        .setDescription("특정 유저의 음성/메시지 사용량을 조회합니다.")
        .addUserOption((opt) => opt.setName("대상").setDescription("조회할 유저").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("보이스순위")
        .setDescription("전체 유저 음성 채널 사용량 순위를 조회합니다.")
        .addIntegerOption((opt) => opt.setName("인원수").setDescription("표시할 인원 수 (기본 10)").setMinValue(1).setMaxValue(25))
    )
    .addSubcommand((sub) =>
      sub
        .setName("메시지순위")
        .setDescription("전체 유저 메시지 수 순위를 조회합니다.")
        .addIntegerOption((opt) => opt.setName("인원수").setDescription("표시할 인원 수 (기본 10)").setMinValue(1).setMaxValue(25))
    )
    .addSubcommand((sub) => sub.setName("전체").setDescription("서버 전체 통계 요약을 조회합니다.")),

  async execute(interaction) {
    if (!(await checkPermission(interaction))) return;

    const sub = interaction.options.getSubcommand();
    if (sub === "유저") return handleUser(interaction);
    if (sub === "보이스순위") return handleVoiceRanking(interaction);
    if (sub === "메시지순위") return handleMessageRanking(interaction);
    if (sub === "전체") return handleOverall(interaction);
  },
};
