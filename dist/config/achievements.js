"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACHIEVEMENT_MAP = exports.ACHIEVEMENTS = void 0;
// Code-defined catalog (mirrors the pattern used by FISH_GRADES/ROD_TIERS/SEED_STOCKS) —
// no admin UI to add new achievements yet. Unlock triggers live in each relevant
// command (fishing.ts, fishingShop.ts, casino.ts, stock.ts, attendance.ts, slot.ts).
exports.ACHIEVEMENTS = [
    { key: "FISH_LEGENDARY", name: "전설급 낚시꾼", emoji: "🌟", description: "전설 등급 물고기를 낚았습니다" },
    { key: "FISH_ABYSS", name: "심연의 지배자", emoji: "🐉", description: "심연의 괴물을 낚았습니다" },
    { key: "ROD_MAX", name: "낚시 마스터", emoji: "👑", description: "전설의 낚시대를 손에 넣었습니다" },
    { key: "CASINO_STREAK_5", name: "연승의 사나이", emoji: "🔥", description: "카지노에서 5연승을 달성했습니다" },
    { key: "SLOT_JACKPOT", name: "777 잭팟", emoji: "🎰", description: "슬롯머신에서 777을 맞췄습니다" },
    { key: "STOCK_PROFIT_10000", name: "투자의 신", emoji: "💹", description: "주식으로 누적 10,000CP 이상 수익을 실현했습니다" },
    { key: "ATTENDANCE_7", name: "일주일 개근", emoji: "📅", description: "7일 연속 출석했습니다" },
    { key: "ATTENDANCE_30", name: "한 달 개근", emoji: "📅", description: "30일 연속 출석했습니다" },
    { key: "ATTENDANCE_100", name: "백일 기도", emoji: "🏆", description: "100일 연속 출석했습니다" },
];
exports.ACHIEVEMENT_MAP = new Map(exports.ACHIEVEMENTS.map((a) => [a.key, a]));
//# sourceMappingURL=achievements.js.map