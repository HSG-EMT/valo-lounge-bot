"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedStocks = seedStocks;
exports.tickStockPrices = tickStockPrices;
const prisma_1 = require("../config/prisma");
const stocks_1 = require("../config/stocks");
async function seedStocks() {
    for (const s of stocks_1.SEED_STOCKS) {
        await prisma_1.prisma.stock.upsert({
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
async function tickStockPrices() {
    const stocks = await prisma_1.prisma.stock.findMany();
    await prisma_1.prisma.$transaction(stocks.map((stock) => {
        const swingPct = (Math.random() * 2 - 1) * stock.volatility;
        const nextPrice = Math.max(stocks_1.STOCK_MIN_PRICE, Math.round(stock.price * (1 + swingPct / 100)));
        return prisma_1.prisma.stock.update({
            where: { id: stock.id },
            data: { prevPrice: stock.price, price: nextPrice },
        });
    }));
}
//# sourceMappingURL=stock.service.js.map