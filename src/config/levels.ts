export const MAX_LEVEL = 100;

// XP grant amounts — shared constants so every command awards a consistent amount.
export const XP_MESSAGE = 2;
export const XP_PER_VOICE_MINUTE = 1;
export const XP_MINIGAME = 5;
export const XP_ATTENDANCE_BASE = 30;
export const XP_ATTENDANCE_SILVER_BONUS = 20;

export interface Tier {
  key: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  emoji: string;
  benefits: string[];
}

// Each tier's `benefits` lists only what's newly unlocked at that tier —
// benefits stack (a Gold member keeps Silver's attendance bonus, etc.), see
// cumulativeBenefits() below for the full accumulated list. The mechanical
// checks (hasAttendanceBonus/hasDailyCpBonus) key off tier rank, not off
// re-listing the same string on every later tier.
export const TIERS: Tier[] = [
  { key: "BRONZE", name: "브론즈", minLevel: 1, maxLevel: 10, emoji: "🥉", benefits: ["일반 라운지 멤버"] },
  { key: "SILVER", name: "실버", minLevel: 11, maxLevel: 30, emoji: "🥈", benefits: ["출석체크 경험치 추가 획득"] },
  { key: "GOLD", name: "골드", minLevel: 31, maxLevel: 50, emoji: "🏅", benefits: ["등급 뱃지 표시"] },
  { key: "PLATINUM", name: "플래티넘", minLevel: 51, maxLevel: 75, emoji: "💠", benefits: ["하루 1회 CP 보너스 (/등급보너스)"] },
  {
    key: "DIAMOND",
    name: "다이아몬드",
    minLevel: 76,
    maxLevel: 95,
    emoji: "💎",
    benefits: ["고급 랜덤상자 선물 (준비 중)", "전용 칭호"],
  },
  {
    key: "MASTER",
    name: "마스터",
    minLevel: 96,
    maxLevel: 100,
    emoji: "👑",
    benefits: ["희귀 랜덤상자 선물 (준비 중)", "최상위 VIP 칭호"],
  },
];

export function getTier(level: number): Tier {
  return TIERS.find((t) => level >= t.minLevel && level <= t.maxLevel) ?? TIERS[TIERS.length - 1];
}

function tierRank(key: string): number {
  return TIERS.findIndex((t) => t.key === key);
}

/** All benefits unlocked at or below this tier, in unlock order. */
export function cumulativeBenefits(tier: Tier): string[] {
  return TIERS.filter((t) => tierRank(t.key) <= tierRank(tier.key)).flatMap((t) => t.benefits);
}

export function hasAttendanceBonus(level: number): boolean {
  return tierRank(getTier(level).key) >= tierRank("SILVER");
}

export function hasDailyCpBonus(level: number): boolean {
  return tierRank(getTier(level).key) >= tierRank("PLATINUM");
}

/** XP required to go from `level` to `level + 1`. Grows steadily so level 100 is a long-term goal. */
export function xpToNext(level: number): number {
  return 100 + level * 20;
}

/** Total lifetime XP needed to reach `targetLevel` from level 1. */
export function cumulativeXpForLevel(targetLevel: number): number {
  let sum = 0;
  for (let l = 1; l < targetLevel; l++) sum += xpToNext(l);
  return sum;
}

export const MAX_TOTAL_XP = cumulativeXpForLevel(MAX_LEVEL);

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpToNextLevel: number; // 0 at max level
}

export function levelFromTotalXp(totalXp: number): LevelInfo {
  let level = 1;
  let remaining = totalXp;
  while (level < MAX_LEVEL) {
    const need = xpToNext(level);
    if (remaining < need) break;
    remaining -= need;
    level++;
  }
  return { level, xpIntoLevel: remaining, xpToNextLevel: level < MAX_LEVEL ? xpToNext(level) : 0 };
}

export function progressBar(current: number, total: number, length = 12): string {
  if (total <= 0) return "▓".repeat(length);
  const filled = Math.max(0, Math.min(length, Math.round((current / total) * length)));
  return "▓".repeat(filled) + "░".repeat(length - filled);
}
