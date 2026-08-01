"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountByRiotId = getAccountByRiotId;
exports.getRecentMatchId = getRecentMatchId;
exports.getMatchDetails = getMatchDetails;
exports.getContent = getContent;
exports.resolveName = resolveName;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
// VALORANT platform shards (val-match-v1, val-content-v1) route to a Riot account-v1
// continent cluster. kr/ap both route through the "asia" cluster.
const PLATFORM_TO_CONTINENT = {
    kr: "asia",
    ap: "asia",
    na: "americas",
    latam: "americas",
    br: "americas",
    eu: "europe",
};
function authHeaders() {
    return { "X-Riot-Token": env_1.env.riotApiKey };
}
async function getAccountByRiotId(gameName, tagLine, platform) {
    const continent = PLATFORM_TO_CONTINENT[platform] ?? "asia";
    const { data } = await axios_1.default.get(`https://${continent}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { headers: authHeaders() });
    return data;
}
async function getRecentMatchId(puuid, platform) {
    const { data } = await axios_1.default.get(`https://${platform}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`, { headers: authHeaders() });
    return data.history[0]?.matchId ?? null;
}
async function getMatchDetails(matchId, platform) {
    const { data } = await axios_1.default.get(`https://${platform}.api.riotgames.com/val/match/v1/matches/${matchId}`, { headers: authHeaders() });
    return data;
}
let contentCache = null;
const CONTENT_TTL_MS = 60 * 60 * 1000;
async function getContent(platform) {
    if (contentCache && contentCache.platform === platform && Date.now() - contentCache.fetchedAt < CONTENT_TTL_MS) {
        return contentCache.data;
    }
    const { data } = await axios_1.default.get(`https://${platform}.api.riotgames.com/val/content/v1/contents`, {
        headers: authHeaders(),
    });
    contentCache = { platform, data, fetchedAt: Date.now() };
    return data;
}
function resolveName(items, id) {
    return items.find((item) => item.id.toLowerCase() === id.toLowerCase())?.name ?? id;
}
//# sourceMappingURL=riot.service.js.map