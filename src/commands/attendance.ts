import { SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { ensureUser } from "../services/points.service";
import { Command } from "../types/command";
import { isSameDay, isYesterday } from "../utils/date";
import { buildEmbed } from "../utils/embed";

const BASE_REWARD = 20;
// streak length -> extra one-time bonus on top of BASE_REWARD
const MILESTONE_BONUS: Record<number, number> = { 7: 50, 30: 200, 100: 500 };
const ACTION = "ATTENDANCE";

export const attendanceCommand: Command = {
  data: new SlashCommandBuilder().setName("출석").setDescription("오늘의 출석체크를 하고 서버 포인트를 받습니다."),

  async execute(interaction) {
    await interaction.deferReply();

    const user = await ensureUser(interaction.user.id, interaction.user.username);
    const now = new Date();

    const attendance = await prisma.attendance.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    if (attendance.lastCheckIn && isSameDay(attendance.lastCheckIn, now)) {
      await interaction.editReply({
        embeds: [
          buildEmbed({
            title: "📅 출석체크",
            description: `오늘은 이미 출석체크를 하셨습니다.\n연속 출석: **${attendance.currentStreak}일** · 총 출석: **${attendance.totalCount}일**`,
            author: "📅 VALO LOUNGE",
          }),
        ],
      });
      return;
    }

    const continuedStreak = attendance.lastCheckIn ? isYesterday(attendance.lastCheckIn, now) : false;
    const newStreak = continuedStreak ? attendance.currentStreak + 1 : 1;
    const newLongest = Math.max(attendance.longestStreak, newStreak);
    const newTotal = attendance.totalCount + 1;

    const milestoneBonus = MILESTONE_BONUS[newStreak] ?? 0;
    const reward = BASE_REWARD + milestoneBonus;

    const [updatedAttendance, serverPoint] = await prisma.$transaction([
      prisma.attendance.update({
        where: { userId: user.id },
        data: { currentStreak: newStreak, longestStreak: newLongest, totalCount: newTotal, lastCheckIn: now },
      }),
      prisma.serverPoint.upsert({
        where: { userId: user.id },
        update: { points: { increment: reward } },
        create: { userId: user.id, points: reward },
      }),
      prisma.statusLog.create({
        data: { userId: user.id, action: ACTION, detail: `연속 ${newStreak}일 (+${reward}P)` },
      }),
    ]);

    const rewardLine =
      milestoneBonus > 0
        ? `│ **+${reward}P** (기본 ${BASE_REWARD}P + ${newStreak}일 연속 보너스 🎉 ${milestoneBonus}P)`
        : `│ **+${reward}P**`;

    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: continuedStreak ? "📅 출석체크 완료!" : "📅 출석체크 완료! (새로운 시작)",
          description: [
            `┌ 연속 출석 **${updatedAttendance.currentStreak}일** (최장 ${updatedAttendance.longestStreak}일) · 총 ${updatedAttendance.totalCount}일`,
            rewardLine,
            `└ ✅ 오늘도 출석 완료!`,
          ].join("\n"),
          author: "📅 VALO LOUNGE",
          footer: `현재 보유 포인트: ${serverPoint.points.toLocaleString()}P`,
        }),
      ],
    });
  },
};
