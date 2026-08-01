"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUser = ensureUser;
const prisma_1 = require("../config/prisma");
async function ensureUser(discordId, username) {
    const user = await prisma_1.prisma.user.upsert({
        where: { discordId },
        update: { discordUsername: username },
        create: {
            discordId,
            discordUsername: username,
            serverPoint: { create: { points: 0 } },
        },
        include: { serverPoint: true },
    });
    // Separate upsert (rather than a nested create on the user upsert above) so
    // accounts created before CP existed still get a CasinoPoint row on their
    // next command, instead of only new signups getting one.
    const casinoPoint = await prisma_1.prisma.casinoPoint.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, points: 0, rodTier: 0 },
    });
    return { ...user, casinoPoint };
}
//# sourceMappingURL=points.service.js.map