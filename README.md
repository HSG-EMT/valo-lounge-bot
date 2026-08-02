# VALO LOUNGE PROJECT — Discord Bot

discord.js + TypeScript + Prisma(MySQL) 디스코드 봇. `valo-lounge-server`가 쓰는 것과 **같은 MySQL DB**를 공유합니다. MySQL은 네트워크로 접속하는 DB라서, 이 봇을 서버와 다른 곳(예: [디스호스트](https://dishost.kr) 같은 Discord 봇 전용 호스팅)에 따로 배포해도 정상 동작합니다.

## 1. 준비물

- `valo-lounge-server`가 먼저 마이그레이션을 실행해 DB 스키마를 만들어둔 상태여야 합니다 (이 프로젝트는 마이그레이션을 실행하지 않습니다).
- Discord Developer Portal에서 애플리케이션 생성: https://discord.com/developers/applications
  - Bot 탭에서 봇 생성 후 Token 발급
  - OAuth2 URL Generator에서 `bot` + `applications.commands` 스코프 선택, 필요한 권한(메시지 보내기 등) 체크 후 서버에 초대
  - Application ID(Client ID)와 개발용 서버(Guild) ID 확인

## 2. 설치

```bash
npm install
copy .env.example .env   # PowerShell: Copy-Item .env.example .env
```

`.env`에 아래 값을 채워주세요.

- `DATABASE_URL` — `valo-lounge-server`의 `.env`에 있는 것과 **정확히 같은** MySQL 접속 문자열 (`mysql://user:password@host:3306/dbname`)
- `DISCORD_BOT_TOKEN` — 봇 토큰
- `DISCORD_CLIENT_ID` — 애플리케이션(Client) ID
- `DISCORD_GUILD_ID` — 슬래시 명령어를 등록할 개발용 서버 ID
- `RIOT_API_KEY` — `/전적` 명령어에만 필요 (선택). [Riot Developer Portal](https://developer.riotgames.com)에서 발급받은 **개인(Personal) 키는 24시간마다 만료**되니, 실제 서비스에는 Production 키 신청이 필요합니다. 비워두면 `/전적`만 비활성화되고 나머지 명령어는 정상 동작합니다.
- `ANNOUNCEMENT_CHANNEL_ID` — 웹사이트 커뮤니티 페이지에 동기화할 공지 채널 ID (선택). 비워두면 공지 동기화가 꺼진 채로 나머지는 정상 동작합니다.
- `LOG_CHANNEL_*` (8개, 전부 선택) — 서버 활동 로그를 보낼 채널 ID들. 아래 "서버 활동 로그" 참고. 비워두면 해당 로그 타입만 개별적으로 꺼지고 나머지는 정상 동작합니다.

### Discord Developer Portal — Privileged Gateway Intents

Developer Portal → 해당 애플리케이션 → **Bot** 탭 → *Privileged Gateway Intents* 에서 아래 두 개를 켜야 합니다. 안 켜면 봇이 로그인 단계에서 바로 오류를 내며 종료됩니다.

- **SERVER MEMBERS INTENT** — `/팀짜기`가 음성 채널의 전체 멤버 목록을 가져오는 데 필요
- **MESSAGE CONTENT INTENT** — 공지 동기화가 메시지/포스트 본문을 읽는 데 필요

## 3. Prisma 클라이언트 생성

```bash
npm run prisma:generate
```

## 4. 슬래시 명령어 등록 (최초 1회, 명령어 추가/변경 시 다시 실행)

```bash
npm run deploy-commands
```

## 5. 봇 실행

```bash
npm run dev
```

## 배포 시 주의사항 — `dist/`를 git에 커밋합니다

이 저장소는 보통 관례와 다르게 **`dist/`(빌드 결과물)를 `.gitignore`에서 빼고 git에 커밋**합니다. 이유는 디스호스트 무료 티어(RAM 128MB)에서 `npm install` 중 `postinstall`로 `tsc` 빌드를 돌리면 리소스 부족으로 자주 실패해서, 새 코드가 배포됐는데도 오래된 `dist/`로 계속 실행되는 문제가 있었기 때문입니다. 그래서 `postinstall`은 `prisma generate`만 실행하고, **빌드는 로컬(또는 CI)에서 미리 해서 커밋**하는 방식으로 바꿨습니다.

**코드를 수정한 뒤 push하기 전에 반드시:**
```bash
npm run build
git add -A
git commit -m "..."
git push
```
빌드를 깜빡하면 디스호스트에는 여전히 예전 `dist/`가 배포되어, Discord에는 새 명령어가 등록되어 있는데 봇이 응답하지 않는(`The application did not respond`) 증상이 나타납니다.

## 현재 명령어

| 명령어 | 설명 | DB 연동 |
|---|---|---|
| `/주사위` | 1~100 사이 랜덤 숫자 | 없음 |
| `/코인` | 하루 한 번 랜덤 서버 포인트 획득 (`ServerPoint`, `StatusLog`에 기록 — 웹사이트 대시보드의 서버 포인트와 동일한 값) | 있음 |
| `/카지노 베팅:<CP>` | CP를 걸고 동전 던지기 (승률 47%, 승리 시 베팅액만큼 획득) | 있음 |
| `/행운` | 하루 한 번 오늘의 운세 확인 (대길~대흉, 코스메틱) | 있음 (`StatusLog`만) |
| `/팀짜기 [팀수]` | 명령어를 사용한 사람이 속한 음성 채널 인원을 랜덤으로 N개 팀으로 분배 | 없음 |
| `/전적 닉네임:<이름> 태그:<태그> [지역]` | Riot 계정 최근 매치 1건 요약(맵/결과/에이전트/KDA) 조회 | 없음 (Riot API 직접 호출) |
| `/출석` | 하루 한 번 출석체크. 연속 출석(KST 자정 기준) 추적, 7·30·100일 연속 시 추가 포인트 보너스 | 있음 (`Attendance`, `ServerPoint`, `StatusLog`) |
| `/낚시` | 25초 쿨타임마다 낚시해서 물고기 등급에 따라 CP 획득 (꽝도 있음) | 있음 (`CasinoPoint`, `StatusLog`) |
| `/낚시대상점 [구매:true]` | 낚시대 목록 확인, `구매:true`로 다음 등급 낚시대를 CP로 구매 | 있음 (`CasinoPoint`, `StatusLog`) |
| `/주식 시장` | 전체 종목의 현재가와 직전 시세 대비 등락률 확인 | 있음 (`Stock`) |
| `/주식 매수 종목:<심볼> 수량:<개수>` | 선택한 종목을 현재가로 CP 매수 (평단가 자동 계산) | 있음 (`Stock`, `StockHolding`, `CasinoPoint`, `StatusLog`) |
| `/주식 매도 종목:<심볼> 수량:<개수>` | 보유 종목을 현재가로 CP 매도 (실현 손익 표시) | 있음 (`Stock`, `StockHolding`, `CasinoPoint`, `StatusLog`) |
| `/주식 포트폴리오` | 내가 보유한 전 종목의 평가금액·평가손익 확인 | 있음 (`StockHolding`) |
| `/슬롯 베팅:<CP>` | CP를 걸고 슬롯머신(릴 3개) — 트리플/페어/꽝, 심볼별 배당 다름 | 있음 (`CasinoPoint`, `StatusLog`) |
| `/업적` | 낚시·카지노·슬롯·주식·출석에 걸친 업적/뱃지 9종 달성 현황 확인 | 있음 (`Achievement`) |

`/전적`은 아직 실제 Riot API 응답으로 테스트하지 못했습니다 (이 환경에서 외부 API 호출 불가 + 위 개인 키 만료 이슈). `val-match-v1`/`val-content-v1`의 공개 문서 스펙대로 작성했으니, 유효한 키로 실행해보고 필드명이 다르면 `src/services/riot.service.ts`만 고치면 됩니다.

## CP (Casino Point) 경제

`/코인`·`/출석`·랜덤박스가 쓰는 `ServerPoint`와는 완전히 분리된 별도 잔액입니다. **오직 `/낚시`로만 벌 수 있고, `/카지노`·`/낚시대상점`·`/주식`에서만 쓸 수 있습니다** — 그래서 사이트 활동으로 모은 포인트가 도박성 콘텐츠로 새어나가지 않습니다.

- 물고기 등급(`src/config/fishing.ts`의 `FISH_GRADES`)은 꽝/일반/고급/희귀/전설/심연의 괴물 6단계이며, 등급이 높을수록 CP 보상도 크고 확률은 낮습니다.
- 낚시대(`ROD_TIERS`, 총 5단계)를 업그레이드할수록 고급 등급 이상이 나올 확률이 올라갑니다(가중치 보정 — 낮은 등급의 비중을 줄이고 등급이 높을수록 비중을 더 크게 늘리는 방식). 낚시대는 순서대로만 구매 가능합니다(중간 단계 스킵 불가).
- `CasinoPoint.rodTier`는 유저마다 하나만 존재하는 "장착 중인 낚시대" — 별도 인벤토리 없이 가장 단순한 형태로 구현했습니다.
- 기존에 이미 만들어진 유저 계정도 `/낚시`·`/카지노`·`/낚시대상점`·`/주식`을 처음 쓰는 순간 `CasinoPoint` 행이 자동으로 생성됩니다 (`ensureUser`가 매번 upsert).

## 주식 시장 (`/주식`)

CP로 투자하는 가상 주식 시장입니다. 실제 회사가 아닌 6개의 가상 종목(`src/config/stocks.ts`의 `SEED_STOCKS`)만 거래할 수 있고, 신규 상장/폐지 기능은 없습니다.

- 봇이 켜질 때 `Stock` 테이블에 6개 종목을 없으면 생성(`seedStocks`)하고, 이후 **5분마다** 종목별로 자체 변동성(`volatility`, 예: NEON ±7%, ACE ±2%) 범위 안에서 랜덤하게 시세를 갱신합니다(`tickStockPrices`) — 서버 전체가 동일한 시세를 보는 실시간 시장입니다.
- 가격은 순수 랜덤워크(직전 가격 기준 ±변동성%)로만 움직입니다. 평균회귀나 이벤트 기반 급등락은 없고, 최저가는 10CP로 바닥을 둡니다.
- `/주식 매수`·`/주식 매도`는 `StockHolding.avgBuyPrice`(가중평균 매입가)를 자동으로 갱신/계산해서 매도 시 실현 손익을, `/주식 포트폴리오`에서는 평가손익을 보여줍니다.
- 종목 선택은 자유 입력이 아니라 슬래시 명령어 자동완성 선택지(`addChoices`)로 제공해서 오타로 인한 실패를 막았습니다.

## 슬롯머신 (`/슬롯`)

릴 3개짜리 CP 슬롯머신입니다 (`src/config/slot.ts`). 심볼 6종(🍒🍋🍇🔔💎7️⃣)이 등급별 가중치·배당을 가지며, 트리플(3개 일치)은 심볼별 배당(2~50배), 페어(2개 일치)는 고정 1.5배, 그 외는 베팅액 전액 손실입니다. 기대 수익률은 베팅액의 약 92%로 설계되어 있습니다(`/카지노`의 승률 47%보다 하우스 엣지가 살짝 큼 — 실제 슬롯머신 성격에 맞춤).

## 업적/뱃지 시스템 (`/업적`)

낚시·카지노·슬롯·주식·출석 전반에 걸친 마일스톤 달성 시 뱃지가 자동으로 잠금 해제됩니다 (`src/config/achievements.ts`에 9종 정의, `Achievement` 테이블에 `(userId, key)` 단위로 기록). 달성 즉시 해당 명령어의 결과 임베드에 "🏅 업적 달성!" 배너가 함께 표시되고, `/업적`으로 전체 현황(🔒 잠김 / ✅ 달성)을 확인할 수 있습니다.

- 낚시: 전설 등급/심연의 괴물 낚기, 낚시대 최고 등급 도달
- 카지노: 5연승 달성 (`CasinoPoint.casinoWinStreak`, 패배 시 0으로 리셋)
- 슬롯: 777 트리플(잭팟) 적중
- 주식: 누적 실현 손익 10,000CP 이상 (`CasinoPoint.stockRealizedPl`, 손실도 반영되는 순손익 기준)
- 출석: 7일/30일/100일 연속 출석 (기존 포인트 마일스톤 보너스와 별개로 뱃지도 지급)

새 업적을 추가하려면 `ACHIEVEMENTS` 배열에 항목을 추가하고, 해당 조건이 발생하는 명령어에서 `tryUnlockAchievement(user.id, key)`를 호출하면 됩니다.

## 서버 활동 로그 (StatBot류)

`src/events/serverLogging.ts`가 8가지 서버 활동을 각각 지정된 채널에 실시간으로 기록합니다. DB에는 저장하지 않고 바로 해당 Discord 채널에 임베드로 전송하는 방식입니다 (음성 채널 접속 기록은 이것과 별개로 `VoiceSession` 테이블에도 저장되어 관리자 페이지에서 조회 가능 — 위 "음성 채널 활동 기록" 참고).

| 환경변수 | 로그 내용 |
|---|---|
| `LOG_CHANNEL_MEMBER_JOIN` | 서버 입장 (유저, 계정 생성일, 현재 인원수) |
| `LOG_CHANNEL_MEMBER_LEAVE` | 서버 퇴장 (유저, 마지막 보유 역할) |
| `LOG_CHANNEL_NICKNAME_CHANGE` | 닉네임 변경 (이전 → 이후) |
| `LOG_CHANNEL_BAN` | 차단 (대상, 사유) |
| `LOG_CHANNEL_VOICE_JOIN` | 음성채널 입장 |
| `LOG_CHANNEL_VOICE_LEAVE` | 음성채널 퇴장 |
| `LOG_CHANNEL_MESSAGE_EDIT` | 메시지 수정 (이전 내용 → 이후 내용) |
| `LOG_CHANNEL_MESSAGE_DELETE` | 메시지 삭제 (삭제된 내용) |

- 각 로그는 완전히 독립적으로 켜고 끌 수 있습니다 — 해당 환경변수를 비워두면 그 로그 타입만 조용히 꺼지고 나머지는 그대로 동작합니다 (`sendLog` 헬퍼가 빈 채널 ID를 그냥 무시).
- 채널을 못 찾거나 전송 권한이 없는 경우에도 에러를 콘솔에만 남기고 봇 자체는 계속 동작합니다.
- 메시지 수정/삭제 로그는 discord.js 캐시에 있는 메시지에 한해 "이전 내용"을 보여줄 수 있습니다 — 봇 재시작 전에 보낸 메시지처럼 캐시에 없는 경우 "(캐시에 없어서 이전 내용 확인 불가)"로 표시됩니다. 이건 Discord API 자체의 한계입니다 (Discord가 옛 메시지 원문을 봇에게 다시 안 줌).
- 봇 메시지가 보낸 메시지는 수정/삭제 로그에서 제외됩니다.
- 차단 로그는 `GatewayIntentBits.GuildModeration` 인텐트가 필요합니다 — 이건 Privileged가 아니라서 Developer Portal에서 별도로 켤 필요는 없습니다.

## 공지 동기화

`ANNOUNCEMENT_CHANNEL_ID`로 지정한 채널을 `Notice` 테이블에 동기화해서, 웹사이트 `/community` 페이지가 실제 Discord 공지를 그대로 보여줍니다.

- **텍스트/공지 채널**과 **포럼(Forum) 채널** 둘 다 지원합니다 — 포럼이면 각 포스트(스레드)가 공지 하나, 텍스트 채널이면 메시지 하나가 공지 하나입니다. 채널 타입은 자동 감지됩니다.
- 봇이 켜질 때 최근 내역을 한 번에 백필(포럼은 전체 스레드, 텍스트 채널은 최근 50개)하고, 이후에는 새 글/수정/삭제를 실시간으로 반영합니다.
- 본문에 있는 `<@&역할ID>`, `<#채널ID>`, `<@유저ID>` 같은 Discord 멘션 문법은 실제 역할/채널/닉네임 이름으로 바꿔서 저장합니다 (그때그때 길드 캐시/API로 조회).
- 실제 채널로 테스트해서 13개 포럼 포스트가 정확히 동기화되고 멘션도 잘 풀리는 것까지 확인했습니다.

## 서버 통계 (홈페이지 "현재 온라인 / 음성채널 / 오늘 가입")

봇이 60초마다(+ 멤버 입장 시 즉시) `GuildStats` 테이블에 실제 값을 기록하고, 웹사이트는 이걸 읽기만 합니다.

- **현재 온라인**: `client.guilds.fetch({ withCounts: true, force: true })`로 Discord가 계산한 근사치(`approximate_presence_count`)를 그대로 사용 — Presence 인텐트 없이도 동작합니다. (`force: true`가 중요합니다 — 이미 캐시된 길드는 이거 없이는 REST 재조회를 안 해서 `withCounts`가 무시됩니다.)
- **음성채널**: 봇의 실시간 게이트웨이 캐시(`guild.voiceStates.cache.size`)로 계산 — 이미 `/팀짜기`용으로 켜둔 Voice States 인텐트를 재사용합니다.
- **오늘 가입**: `GuildMemberAdd` 이벤트가 올 때마다 KST 기준 날짜별로 카운트 (자정 지나면 자동 리셋).
- 실제 서버로 테스트해서 온라인 61명 / 음성채널 7명이 홈페이지에 정확히 그대로 뜨는 것까지 확인했습니다.

## 음성 채널 활동 기록 (관리자 페이지 "음성 채널 활동")

`VoiceStateUpdate` 이벤트로 모든 멤버의 음성 채널 입장/퇴장을 `VoiceSession` 테이블에 기록합니다 (Statbot류 봇의 음성 체류시간 추적과 동일한 방식). 관리자 페이지(`/admin`)에서 전체 멤버의 세션을 실시간으로 확인할 수 있습니다.

- 채널 이동(A→B)은 A 세션 종료 + B 세션 시작으로 처리, 음소거/카메라 on-off 같은 채널 변경이 없는 상태 변화는 무시합니다.
- 봇이 재시작되는 동안의 입장/퇴장은 놓칠 수밖에 없어서, `ClientReady` 시점에 **현재 음성 채널에 실제로 있는 사람**과 **DB상 "아직 접속 중"으로 남아있는 세션**을 비교해서 어긋난 것들을 정리합니다(안 맞는 건 그 시점에 닫고, 빠진 건 그 시점부터 새로 엽니다). 재시작 전후의 정확한 시각까지는 보장 못 하지만 세션이 영구히 "접속 중"으로 남거나 중복 생성되는 건 막아줍니다.
- 아직 접속 중인 세션은 `leftAt`/`durationSeconds`가 `null`이고, 관리자 페이지에는 "🎙️ 접속 중"으로 표시됩니다.
- 실제 서버로 테스트해서 6명의 실제 접속 상태(채널명·닉네임 포함)가 정확히 기록되고 관리자 페이지에 뜨는 것까지 확인했습니다.

## 다음 단계 (미구현)

CLAUDE.md에 명시된 기능 중 아직 구현하지 않은 것들:

- 랜덤 에이전트
- User Stat, Riot Login 연동, 서버 레벨 시스템, 업적 시스템, 시즌 시스템, 이벤트 자동화
- 랜덤박스: 웹(`valo-lounge-server`)의 `POST /events/boxes/:id/draw`는 실제 추첨 로직이 구현되어 있지만, 봇에서 같은 기능을 슬래시 명령어로 트리거하는 것은 아직 없음

## 스키마 동기화 주의사항

`prisma/schema.prisma`는 `valo-lounge-server/prisma/schema.prisma`를 그대로 복사한 것입니다. 두 저장소가 완전히 분리되어 있어 공유 패키지 없이 스키마 파일을 각자 유지합니다. **모델을 변경하면 두 파일을 모두 수정하고, 마이그레이션은 항상 `valo-lounge-server`에서만 실행하세요.**
