export interface StockSeed {
  symbol: string;
  name: string;
  startPrice: number;
  volatility: number; // max % swing per price tick
}

// A fixed set of fictional companies — no real-world tickers or brands, in
// keeping with CLAUDE.md's no-real-IP-art rule extended to no real companies.
export const SEED_STOCKS: StockSeed[] = [
  { symbol: "VLR", name: "발로라운지 주식회사", startPrice: 1000, volatility: 4 },
  { symbol: "NEON", name: "네온글로우 테크", startPrice: 600, volatility: 7 },
  { symbol: "SPK", name: "스파이크 로지스틱스", startPrice: 1500, volatility: 3 },
  { symbol: "DUEL", name: "듀얼리스트 엔터테인먼트", startPrice: 350, volatility: 9 },
  { symbol: "ACE", name: "에이스 캐피탈", startPrice: 2200, volatility: 2 },
  { symbol: "CLTCH", name: "클러치 모멘트 게임즈", startPrice: 800, volatility: 6 },
];

export const STOCK_MIN_PRICE = 10;
export const STOCK_TICK_INTERVAL_MS = 5 * 60 * 1000;
