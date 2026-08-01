import { EmbedBuilder } from "discord.js";

export const VALO_RED = 0xff4655;
export const CASINO_TEAL = 0x17c3a2; // CP economy (/카지노, /낚시, /낚시대상점, /주식) — CLAUDE.md's secondary accent

// Shared look for every command's embeds: a small "<emoji> NAME" author line above
// a 「 bracketed 」 title, consistent color per command family, and a footer that
// usually carries the one live stat (points/CP/streak) worth glancing at.
export function buildEmbed(opts: {
  title: string;
  description: string;
  color?: number;
  author?: string;
  footer?: string;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(opts.color ?? VALO_RED)
    .setAuthor({ name: opts.author ?? "VALO LOUNGE" })
    .setTitle(`「 ${opts.title} 」`)
    .setDescription(opts.description)
    .setFooter({ text: opts.footer ?? "VALO LOUNGE" })
    .setTimestamp();
}
