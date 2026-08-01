import axios from "axios";
import { env } from "../config/env";

// VALORANT platform shards (val-match-v1, val-content-v1) route to a Riot account-v1
// continent cluster. kr/ap both route through the "asia" cluster.
const PLATFORM_TO_CONTINENT: Record<string, string> = {
  kr: "asia",
  ap: "asia",
  na: "americas",
  latam: "americas",
  br: "americas",
  eu: "europe",
};

function authHeaders() {
  return { "X-Riot-Token": env.riotApiKey };
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export async function getAccountByRiotId(gameName: string, tagLine: string, platform: string): Promise<RiotAccount> {
  const continent = PLATFORM_TO_CONTINENT[platform] ?? "asia";
  const { data } = await axios.get<RiotAccount>(
    `https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      gameName
    )}/${encodeURIComponent(tagLine)}`,
    { headers: authHeaders() }
  );
  return data;
}

interface MatchListEntry {
  matchId: string;
}

export async function getRecentMatchId(puuid: string, platform: string): Promise<string | null> {
  const { data } = await axios.get<{ history: MatchListEntry[] }>(
    `https://${platform}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
    { headers: authHeaders() }
  );
  return data.history[0]?.matchId ?? null;
}

export interface MatchPlayer {
  puuid: string;
  teamId: string;
  characterId: string;
  stats: { score: number; kills: number; deaths: number; assists: number };
}

export interface MatchDetails {
  matchInfo: { mapId: string };
  players: MatchPlayer[];
  teams: { teamId: string; won: boolean }[];
}

export async function getMatchDetails(matchId: string, platform: string): Promise<MatchDetails> {
  const { data } = await axios.get<MatchDetails>(
    `https://${platform}.api.riotgames.com/val/match/v1/matches/${matchId}`,
    { headers: authHeaders() }
  );
  return data;
}

interface ContentItem {
  id: string;
  name: string;
}

interface ContentResponse {
  characters: ContentItem[];
  maps: ContentItem[];
}

let contentCache: { platform: string; data: ContentResponse; fetchedAt: number } | null = null;
const CONTENT_TTL_MS = 60 * 60 * 1000;

export async function getContent(platform: string): Promise<ContentResponse> {
  if (contentCache && contentCache.platform === platform && Date.now() - contentCache.fetchedAt < CONTENT_TTL_MS) {
    return contentCache.data;
  }

  const { data } = await axios.get<ContentResponse>(`https://${platform}.api.riotgames.com/val/content/v1/contents`, {
    headers: authHeaders(),
  });

  contentCache = { platform, data, fetchedAt: Date.now() };
  return data;
}

export function resolveName(items: ContentItem[], id: string): string {
  return items.find((item) => item.id.toLowerCase() === id.toLowerCase())?.name ?? id;
}
