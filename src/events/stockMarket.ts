import { Client, Events } from "discord.js";
import { STOCK_TICK_INTERVAL_MS } from "../config/stocks";
import { seedStocks, tickStockPrices } from "../services/stock.service";

export function registerStockMarket(client: Client): void {
  client.once(Events.ClientReady, async () => {
    await seedStocks().catch((err) => console.error("Stock seed failed:", err));
    setInterval(() => {
      tickStockPrices().catch((err) => console.error("Stock price tick failed:", err));
    }, STOCK_TICK_INTERVAL_MS);
  });
}
