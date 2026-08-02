import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { prisma } from "../config/prisma";
import { SEED_STOCKS } from "../config/stocks";
import { XP_MINIGAME } from "../config/levels";
import { ensureUser } from "../services/points.service";
import { tryUnlockAchievement, unlockBanner } from "../services/achievement.service";
import { addXp, levelUpBanner } from "../services/level.service";
import { Command } from "../types/command";
import { buildEmbed, CASINO_TEAL } from "../utils/embed";

const STOCK_CHOICES = SEED_STOCKS.map((s) => ({ name: `${s.symbol} · ${s.name}`, value: s.symbol }));

function pctChange(price: number, prevPrice: number): { pct: number; arrow: string; sign: string } {
  const pct = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;
  const arrow = pct > 0 ? "🔺" : pct < 0 ? "🔻" : "➖";
  const sign = pct > 0 ? "+" : "";
  return { pct, arrow, sign };
}

async function handleMarket(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const stocks = await prisma.stock.findMany({ orderBy: { symbol: "asc" } });

  const embed = new EmbedBuilder()
    .setColor(CASINO_TEAL)
    .setAuthor({ name: "💹 VALO LOUNGE STOCK EXCHANGE" })
    .setTitle("「 📈 실시간 시세 」")
    .addFields(
      stocks.map((s) => {
        const { pct, arrow, sign } = pctChange(s.price, s.prevPrice);
        return {
          name: `${arrow} ${s.symbol}`,
          value: `${s.name}\n**${s.price.toLocaleString()}CP** (${sign}${pct.toFixed(1)}%)`,
          inline: true,
        };
      })
    )
    .setFooter({ text: "5분마다 자동으로 시세가 갱신됩니다 · CP는 /낚시로 모을 수 있어요" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleBuy(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const symbol = interaction.options.getString("종목", true);
  const quantity = interaction.options.getInteger("수량", true);

  const user = await ensureUser(interaction.user.id, interaction.user.username);
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "📈 주식 매수",
          description: "존재하지 않는 종목입니다.",
          color: CASINO_TEAL,
          author: "💹 VALO LOUNGE STOCK EXCHANGE",
        }),
      ],
    });
    return;
  }

  const cost = stock.price * quantity;
  if (cost > user.casinoPoint.points) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "📈 주식 매수",
          description: `CP가 부족합니다. (필요 **${cost.toLocaleString()}CP**, 보유 **${user.casinoPoint.points.toLocaleString()}CP**)`,
          color: CASINO_TEAL,
          author: "💹 VALO LOUNGE STOCK EXCHANGE",
        }),
      ],
    });
    return;
  }

  const existing = await prisma.stockHolding.findUnique({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
  });
  const prevQty = existing?.quantity ?? 0;
  const prevAvg = existing?.avgBuyPrice ?? 0;
  const newQty = prevQty + quantity;
  const newAvg = Math.round((prevQty * prevAvg + quantity * stock.price) / newQty);

  const [, casinoPoint] = await prisma.$transaction([
    prisma.stockHolding.upsert({
      where: { userId_stockId: { userId: user.id, stockId: stock.id } },
      update: { quantity: newQty, avgBuyPrice: newAvg },
      create: { userId: user.id, stockId: stock.id, quantity, avgBuyPrice: stock.price },
    }),
    prisma.casinoPoint.update({ where: { userId: user.id }, data: { points: { decrement: cost } } }),
    prisma.statusLog.create({
      data: { userId: user.id, action: "STOCK_BUY", detail: `${stock.symbol} ${quantity}주 매수 -${cost}CP` },
    }),
  ]);

  const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);

  const embed = new EmbedBuilder()
    .setColor(CASINO_TEAL)
    .setAuthor({ name: "💹 VALO LOUNGE STOCK EXCHANGE" })
    .setTitle(`「 📈 ${stock.symbol} 매수 체결 」`)
    .setDescription(
      `┌ ${stock.name}\n│ ${quantity}주 × ${stock.price.toLocaleString()}CP = **-${cost.toLocaleString()}CP**\n└ 평단가 **${newAvg.toLocaleString()}CP** · 보유 **${newQty}주**${levelUpBanner(xpResult)}`
    )
    .setFooter({ text: `잔여 CP: ${casinoPoint.points.toLocaleString()}CP` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleSell(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const symbol = interaction.options.getString("종목", true);
  const quantity = interaction.options.getInteger("수량", true);

  const user = await ensureUser(interaction.user.id, interaction.user.username);
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "📉 주식 매도",
          description: "존재하지 않는 종목입니다.",
          color: CASINO_TEAL,
          author: "💹 VALO LOUNGE STOCK EXCHANGE",
        }),
      ],
    });
    return;
  }

  const holding = await prisma.stockHolding.findUnique({
    where: { userId_stockId: { userId: user.id, stockId: stock.id } },
  });
  if (!holding || holding.quantity < quantity) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "📉 주식 매도",
          description: `보유 수량이 부족합니다. (보유: **${holding?.quantity ?? 0}주**)`,
          color: CASINO_TEAL,
          author: "💹 VALO LOUNGE STOCK EXCHANGE",
        }),
      ],
    });
    return;
  }

  const proceeds = stock.price * quantity;
  const remainingQty = holding.quantity - quantity;
  const realizedPl = (stock.price - holding.avgBuyPrice) * quantity;
  const plSign = realizedPl >= 0 ? "+" : "";

  const [, casinoPoint] = await prisma.$transaction([
    remainingQty > 0
      ? prisma.stockHolding.update({ where: { id: holding.id }, data: { quantity: remainingQty } })
      : prisma.stockHolding.delete({ where: { id: holding.id } }),
    prisma.casinoPoint.update({
      where: { userId: user.id },
      data: { points: { increment: proceeds }, stockRealizedPl: { increment: realizedPl } },
    }),
    prisma.statusLog.create({
      data: {
        userId: user.id,
        action: "STOCK_SELL",
        detail: `${stock.symbol} ${quantity}주 매도 +${proceeds}CP (손익 ${plSign}${realizedPl}CP)`,
      },
    }),
  ]);

  const plIcon = realizedPl >= 0 ? "📈" : "📉";
  let description = `┌ ${stock.name}\n│ ${quantity}주 × ${stock.price.toLocaleString()}CP = **+${proceeds.toLocaleString()}CP**\n└ 실현 손익 ${plIcon} **${plSign}${realizedPl.toLocaleString()}CP**`;

  if (casinoPoint.stockRealizedPl >= 10000) {
    const unlocked = await tryUnlockAchievement(user.id, "STOCK_PROFIT_10000");
    if (unlocked) description += unlockBanner(unlocked);
  }

  const xpResult = await addXp(interaction.user.id, interaction.user.username, XP_MINIGAME);
  description += levelUpBanner(xpResult);

  const embed = new EmbedBuilder()
    .setColor(CASINO_TEAL)
    .setAuthor({ name: "💹 VALO LOUNGE STOCK EXCHANGE" })
    .setTitle(`「 📉 ${stock.symbol} 매도 체결 」`)
    .setDescription(description)
    .setFooter({ text: `현재 CP: ${casinoPoint.points.toLocaleString()}CP` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handlePortfolio(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const user = await ensureUser(interaction.user.id, interaction.user.username);
  const holdings = await prisma.stockHolding.findMany({
    where: { userId: user.id, quantity: { gt: 0 } },
    include: { stock: true },
  });

  if (holdings.length === 0) {
    await interaction.editReply({
      embeds: [
        buildEmbed({
          title: "📊 내 포트폴리오",
          description: `보유 중인 종목이 없습니다.\n현재 CP: **${user.casinoPoint.points.toLocaleString()}CP**`,
          color: CASINO_TEAL,
          author: "💹 VALO LOUNGE STOCK EXCHANGE",
        }),
      ],
    });
    return;
  }

  let totalValue = 0;
  let totalCost = 0;
  const fields = holdings.map((h) => {
    const value = h.stock.price * h.quantity;
    const cost = h.avgBuyPrice * h.quantity;
    totalValue += value;
    totalCost += cost;
    const pl = value - cost;
    const plPct = cost > 0 ? (pl / cost) * 100 : 0;
    const sign = pl >= 0 ? "+" : "";
    const icon = pl >= 0 ? "📈" : "📉";
    return {
      name: `${icon} ${h.stock.symbol} · ${h.quantity}주`,
      value: `평단 ${h.avgBuyPrice.toLocaleString()}CP → 현재 ${h.stock.price.toLocaleString()}CP\n손익 **${sign}${pl.toLocaleString()}CP** (${sign}${plPct.toFixed(1)}%)`,
      inline: true,
    };
  });

  const totalPl = totalValue - totalCost;
  const totalSign = totalPl >= 0 ? "+" : "";
  const totalIcon = totalPl >= 0 ? "📈" : "📉";

  const embed = new EmbedBuilder()
    .setColor(CASINO_TEAL)
    .setAuthor({ name: "💹 VALO LOUNGE STOCK EXCHANGE" })
    .setTitle("「 📊 내 포트폴리오 」")
    .addFields(fields)
    .addFields({
      name: `${totalIcon} 총 평가금액`,
      value: `**${totalValue.toLocaleString()}CP** (${totalSign}${totalPl.toLocaleString()}CP)`,
      inline: false,
    })
    .setFooter({ text: `보유 CP: ${user.casinoPoint.points.toLocaleString()}CP` })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export const stockCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("주식")
    .setDescription("CP로 가상 주식 시장에 투자합니다.")
    .addSubcommand((sub) => sub.setName("시장").setDescription("전체 종목 시세를 확인합니다."))
    .addSubcommand((sub) =>
      sub
        .setName("매수")
        .setDescription("종목을 CP로 매수합니다.")
        .addStringOption((opt) =>
          opt.setName("종목").setDescription("매수할 종목").setRequired(true).addChoices(...STOCK_CHOICES)
        )
        .addIntegerOption((opt) => opt.setName("수량").setDescription("매수 수량").setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub
        .setName("매도")
        .setDescription("보유 종목을 CP로 매도합니다.")
        .addStringOption((opt) =>
          opt.setName("종목").setDescription("매도할 종목").setRequired(true).addChoices(...STOCK_CHOICES)
        )
        .addIntegerOption((opt) => opt.setName("수량").setDescription("매도 수량").setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) => sub.setName("포트폴리오").setDescription("내가 보유한 종목과 손익을 확인합니다.")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "시장") return handleMarket(interaction);
    if (sub === "매수") return handleBuy(interaction);
    if (sub === "매도") return handleSell(interaction);
    if (sub === "포트폴리오") return handlePortfolio(interaction);
  },
};
