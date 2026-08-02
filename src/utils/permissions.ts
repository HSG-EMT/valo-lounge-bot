import { GuildMember } from "discord.js";
import { env } from "../config/env";

export function hasStatsRole(member: GuildMember | null | undefined): boolean {
  if (!member) return false;
  return env.statsRoleIds.some((roleId) => member.roles.cache.has(roleId));
}
