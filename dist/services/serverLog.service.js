"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLog = sendLog;
exports.logEmbed = logEmbed;
exports.truncate = truncate;
const discord_js_1 = require("discord.js");
const embed_1 = require("../utils/embed");
// Every log type is independently optional (blank channel id = skip) and
// failures (missing channel, no send permission, channel deleted) are
// swallowed with a console warning rather than crashing the bot — a broken
// log channel shouldn't take down the rest of the bot's features.
async function sendLog(client, channelId, embed) {
    if (!channelId)
        return;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
            console.warn(`Log channel ${channelId} is not a text channel or was not found.`);
            return;
        }
        await channel.send({ embeds: [embed] });
    }
    catch (err) {
        console.error(`Failed to send log to channel ${channelId}:`, err);
    }
}
function logEmbed(opts) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(opts.color ?? embed_1.VALO_RED)
        .setAuthor({ name: opts.author ?? "📋 VALO LOUNGE SERVER LOG" })
        .setTitle(`「 ${opts.title} 」`)
        .setDescription(opts.description)
        .setTimestamp();
    if (opts.footer)
        embed.setFooter({ text: opts.footer });
    if (opts.thumbnail)
        embed.setThumbnail(opts.thumbnail);
    return embed;
}
// Discord doesn't send old message content for messages the client hasn't
// cached (e.g. sent before this process started) — MessageUpdate/MessageDelete
// fire with a partial in that case, so callers must handle a possibly-missing value.
function truncate(text, max = 500) {
    if (text.length <= max)
        return text;
    return `${text.slice(0, max)}…`;
}
//# sourceMappingURL=serverLog.service.js.map