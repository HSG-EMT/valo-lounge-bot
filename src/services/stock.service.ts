import { prisma } from "../config/prisma";
import { SEED_STOCKS, STOCK_MIN_PRICE } from "../config/stocks";

export async function seedStocks(): Promise<void> {
  for (const s of SEED_STOCKS) {
    await prisma.stock.upsert({
      where: { symbol: s.symbol },
      update: {},
      create: {
        symbol: s.symbol,
        name: s.name,
        price: s.startPrice,
        prevPrice: s.startPrice,
        volatility: s.volatility,
      },
    });
  }
}

// Pure random walk bounded at STOCK_MIN_PRICE — each stock swings independently
// by up to its own volatility% per tick. No news events or mean reversion; this
// is a fun mini-market, not a simulation of real trading dynamics.
export async function tickStockPrices(): Promise<void> {
  const stocks = await prisma.stock.findMany();
  await prisma.$transaction(
    stocks.map((stock) => {
      const swingPct = (Math.random() * 2 - 1) * stock.volatility;
      const nextPrice = Math.max(STOCK_MIN_PRICE, Math.round(stock.price * (1 + swingPct / 100)));
      return prisma.stock.update({
        where: { id: stock.id },
        data: { prevPrice: stock.price, price: nextPrice },
      });
    })
  );
}
