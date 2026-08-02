import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/command";
import { VALO_RED } from "../utils/embed";
import { hasStatsRole } from "../utils/permissions";

interface HelpEntry {
  usage: string;
  description: string;
}

interface HelpCategory {
  title: string;
  entries: HelpEntry[];
}

// Kept as a static list (rather than deriving from index.ts's command map) to
// avoid a circular import — index.ts already imports every command module,
// including this one, to build that map.
const CATEGORIES: HelpCategory[] = [
  {
    title: "🎰 카지노 · 미니게임",
    entries: [
      { usage: "/카지노 <베팅>", description: "CP를 걸고 동전 던지기에 도전합니다." },
      { usage: "/슬롯 <베팅>", description: "CP를 걸고 슬롯머신을 돌립니다." },
      { usage: "/주사위", description: "1~100 사이의 숫자를 굴립니다." },
      { usage: "/낚시", description: "낚시를 해서 CP(Casino Point)를 얻습니다." },
      { usage: "/낚시대상점 [구매]", description: "낚시대 목록을 보거나 다음 등급 낚시대를 CP로 구매합니다." },
      { usage: "/주식 <시장|매수|매도|포트폴리오>", description: "CP로 가상 주식 시장에 투자합니다." },
    ],
  },
  {
    title: "✨ 데일리 활동",
    entries: [
      { usage: "/출석", description: "오늘의 출석체크를 하고 서버 포인트를 받습니다." },
      { usage: "/코인", description: "하루 한 번, 랜덤 서버 포인트를 받습니다." },
      { usage: "/행운", description: "오늘의 운세를 확인합니다." },
      { usage: "/등급보너스", description: "플래티넘 등급 이상, 하루 한 번 CP 보너스를 받습니다." },
    ],
  },
  {
    title: "📊 내 정보",
    entries: [
      { usage: "/레벨 [대상]", description: "나 또는 다른 유저의 레벨/등급을 확인합니다." },
      { usage: "/업적", description: "내가 달성한 업적/뱃지를 확인합니다." },
      { usage: "/전적 <닉네임> <태그> [지역]", description: "발로란트 최근 전적을 조회합니다." },
    ],
  },
  {
    title: "👥 유틸리티",
    entries: [{ usage: "/팀짜기 [팀수]", description: "현재 음성 채널 참여자를 랜덤으로 팀 나눕니다." }],
  },
];

// hasStatsRole 역할을 가진 관리자에게만 /도움말에서 노출된다 — /통계 명령어 자체의
// 권한 체크(stats.ts)와 동일한 기준.
const ADMIN_CATEGORY: HelpCategory = {
  title: "🛠 관리자 전용",
  entries: [{ usage: "/통계 <유저|보이스순위|메시지순위|전체>", description: "서버 사용량 통계를 조회합니다." }],
};

function formatCategory(category: HelpCategory): string {
  return category.entries.map((e) => `\`${e.usage}\`\n${e.description}`).join("\n\n");
}

export const helpCommand: Command = {
  data: new SlashCommandBuilder().setName("도움말").setDescription("VALO LOUNGE 봇에서 사용할 수 있는 명령어 목록을 확인합니다."),

  async execute(interaction) {
    const member = interaction.guild
      ? await interaction.guild.members.fetch(interaction.user.id).catch(() => null)
      : null;
    const isAdmin = hasStatsRole(member);

    const categories = isAdmin ? [...CATEGORIES, ADMIN_CATEGORY] : CATEGORIES;

    const embed = new EmbedBuilder()
      .setColor(VALO_RED)
      .setAuthor({ name: "📖 VALO LOUNGE HELP" })
      .setTitle("「 📖 명령어 도움말 」")
      .setDescription("VALO LOUNGE에서 사용할 수 있는 명령어예요. `<>`는 필수, `[]`는 선택 입력입니다.")
      .addFields(categories.map((category) => ({ name: category.title, value: formatCategory(category) })))
      .setFooter({ text: "더 궁금한 점은 운영진에게 문의해주세요" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
