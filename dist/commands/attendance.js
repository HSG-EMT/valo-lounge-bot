"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceCommand = void 0;
const discord_js_1 = require("discord.js");
const prisma_1 = require("../config/prisma");
const points_service_1 = require("../services/points.service");
const achievement_service_1 = require("../services/achievement.service");
const date_1 = require("../utils/date");
const embed_1 = require("../utils/embed");
const BASE_REWARD = 20;
// streak length -> extra one-time bonus on top of BASE_REWARD
const MILESTONE_BONUS = { 7: 50, 30: 200, 100: 500 };
const STREAK_ACHIEVEMENTS = { 7: "ATTENDANCE_7", 30: "ATTENDANCE_30", 100: "ATTENDANCE_100" };
const ACTION = "ATTENDANCE";
exports.attendanceCommand = {
    data: new discord_js_1.SlashCommandBuilder().setName("출석").setDescription("오늘의 출석체크를 하고 서버 포인트를 받습니다."),
    async execute(interaction) {
        await interaction.deferReply();
        const user = await (0, points_service_1.ensureUser)(interaction.user.id, interaction.user.username);
        const now = new Date();
        const attendance = await prisma_1.prisma.attendance.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
        });
        if (attendance.lastCheckIn && (0, date_1.isSameDay)(attendance.lastCheckIn, now)) {
            await interaction.editReply({
                embeds: [
                    (0, embed_1.buildEmbed)({
                        title: "📅 출석체크",
                        description: `오늘은 이미 출석체크를 하셨습니다.\n연속 출석: **${attendance.currentStreak}일** · 총 출석: **${attendance.totalCount}일**`,
                        author: "📅 VALO LOUNGE",
                    }),
                ],
            });
            return;
        }
        const continuedStreak = attendance.lastCheckIn ? (0, date_1.isYesterday)(attendance.lastCheckIn, now) : false;
        const newStreak = continuedStreak ? attendance.currentStreak + 1 : 1;
        const newLongest = Math.max(attendance.longestStreak, newStreak);
        const newTotal = attendance.totalCount + 1;
        const milestoneBonus = MILESTONE_BONUS[newStreak] ?? 0;
        const reward = BASE_REWARD + milestoneBonus;
        const [updatedAttendance, serverPoint] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.attendance.update({
                where: { userId: user.id },
                data: { currentStreak: newStreak, longestStreak: newLongest, totalCount: newTotal, lastCheckIn: now },
            }),
            prisma_1.prisma.serverPoint.upsert({
                where: { userId: user.id },
                update: { points: { increment: reward } },
                create: { userId: user.id, points: reward },
            }),
            prisma_1.prisma.statusLog.create({
                data: { userId: user.id, action: ACTION, detail: `연속 ${newStreak}일 (+${reward}P)` },
            }),
        ]);
        const rewardLine = milestoneBonus > 0
            ? `│ **+${reward}P** (기본 ${BASE_REWARD}P + ${newStreak}일 연속 보너스 🎉 ${milestoneBonus}P)`
            : `│ **+${reward}P**`;
        let description = [
            `┌ 연속 출석 **${updatedAttendance.currentStreak}일** (최장 ${updatedAttendance.longestStreak}일) · 총 ${updatedAttendance.totalCount}일`,
            rewardLine,
            `└ ✅ 오늘도 출석 완료!`,
        ].join("\n");
        const achievementKey = STREAK_ACHIEVEMENTS[newStreak];
        if (achievementKey) {
            const unlocked = await (0, achievement_service_1.tryUnlockAchievement)(user.id, achievementKey);
            if (unlocked)
                description += (0, achievement_service_1.unlockBanner)(unlocked);
        }
        await interaction.editReply({
            embeds: [
                (0, embed_1.buildEmbed)({
                    title: continuedStreak ? "📅 출석체크 완료!" : "📅 출석체크 완료! (새로운 시작)",
                    description,
                    author: "📅 VALO LOUNGE",
                    footer: `현재 보유 포인트: ${serverPoint.points.toLocaleString()}P`,
                }),
            ],
        });
    },
};
//# sourceMappingURL=attendance.js.map