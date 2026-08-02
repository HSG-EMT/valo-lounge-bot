import { Client, Events } from "discord.js";
import { env } from "../config/env";
import { XP_PER_VOICE_MINUTE } from "../config/levels";
import { addXp } from "../services/level.service";
import { closeVoiceSession, openVoiceSession, reconcileVoiceSessions } from "../services/voiceSession.service";

export function registerVoiceTracking(client: Client): void {
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (newState.guild.id !== env.discordGuildId) return;

    const member = newState.member ?? oldState.member;
    if (!member || member.user.bot) return;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;
    if (oldChannelId === newChannelId) return; // mute/deafen/stream toggle — not a channel move

    try {
      if (oldChannelId) {
        const durationSeconds = await closeVoiceSession(member.id, oldChannelId);
        const xpGain = Math.floor((durationSeconds ?? 0) / 60) * XP_PER_VOICE_MINUTE;
        if (xpGain > 0) {
          await addXp(member.id, member.user.username, xpGain);
        }
      }
      if (newChannelId) {
        const channelName = newState.channel?.name ?? "알 수 없음";
        await openVoiceSession(member.id, member.user.username, newChannelId, channelName);
      }
    } catch (err) {
      console.error("Voice tracking failed:", err);
    }
  });

  client.once(Events.ClientReady, async () => {
    const guild = await client.guilds.fetch(env.discordGuildId).catch(() => null);
    if (!guild) return;
    await reconcileVoiceSessions(guild).catch((err) => console.error("Voice session reconcile failed:", err));
  });
}
