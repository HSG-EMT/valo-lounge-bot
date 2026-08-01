"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASINO_TEAL = exports.VALO_RED = void 0;
exports.buildEmbed = buildEmbed;
const discord_js_1 = require("discord.js");
exports.VALO_RED = 0xff4655;
exports.CASINO_TEAL = 0x17c3a2; // CP economy (/카지노, /낚시, /낚시대상점, /주식) — CLAUDE.md's secondary accent
// Shared look for every command's embeds: a small "<emoji> NAME" author line above
// a 「 bracketed 」 title, consistent color per command family, and a footer that
// usually carries the one live stat (points/CP/streak) worth glancing at.
function buildEmbed(opts) {
    return new discord_js_1.EmbedBuilder()
        .setColor(opts.color ?? exports.VALO_RED)
        .setAuthor({ name: opts.author ?? "VALO LOUNGE" })
        .setTitle(`「 ${opts.title} 」`)
        .setDescription(opts.description)
        .setFooter({ text: opts.footer ?? "VALO LOUNGE" })
        .setTimestamp();
}
//# sourceMappingURL=embed.js.map