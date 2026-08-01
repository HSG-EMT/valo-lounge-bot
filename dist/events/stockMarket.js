"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStockMarket = registerStockMarket;
const discord_js_1 = require("discord.js");
const stocks_1 = require("../config/stocks");
const stock_service_1 = require("../services/stock.service");
function registerStockMarket(client) {
    client.once(discord_js_1.Events.ClientReady, async () => {
        await (0, stock_service_1.seedStocks)().catch((err) => console.error("Stock seed failed:", err));
        setInterval(() => {
            (0, stock_service_1.tickStockPrices)().catch((err) => console.error("Stock price tick failed:", err));
        }, stocks_1.STOCK_TICK_INTERVAL_MS);
    });
}
//# sourceMappingURL=stockMarket.js.map