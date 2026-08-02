"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMessage = recordMessage;
const prisma_1 = require("../config/prisma");
const date_1 = require("../utils/date");
const points_service_1 = require("./points.service");
async function recordMessage(discordId, username) {
    const user = await (0, points_service_1.ensureUser)(discordId, username);
    const today = (0, date_1.todayKstDateString)();
    const existing = await prisma_1.prisma.messageStat.findUnique({ where: { userId: user.id } });
    const todayCount = existing && existing.todayDate === today ? existing.todayCount + 1 : 1;
    await prisma_1.prisma.messageStat.upsert({
        where: { userId: user.id },
        update: { totalCount: { increment: 1 }, todayCount, todayDate: today, lastMessageAt: new Date() },
        create: { userId: user.id, totalCount: 1, todayCount: 1, todayDate: today, lastMessageAt: new Date() },
    });
}
//# sourceMappingURL=messageStat.service.js.map