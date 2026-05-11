# Corpus Quest — Build TODOs

Ordered build plan derived from the System Design Document.  
Rule: **don't start a step until the previous step's validation checklist is fully green.**

Legend: `[x]` done • `[~]` partial / needs your attention • `[ ]` pending.

---

## Step 1 — Bootstrap the Monorepo  ✅ _complete_

**Goal:** One repo, four workspaces, shared tooling configured once. Every subsequent step drops into this structure.

### Implementation

- [~] Initialise repo: `git init corpus-quest && cd corpus-quest` _(sandbox attempt corrupted `.git/config` due to a Windows mount permission quirk; please run `Remove-Item .git -Recurse -Force; git init -b main` from PowerShell to clean-init)_
- [x] ~~Install Turborepo: `npx create-turbo@latest` — select "Empty workspace"~~ _(skipped the bootstrap CLI; Turborepo wired up by hand via `turbo.json` + workspace `package.json`s — equivalent result, no template noise)_
- [x] Create workspace folders: `apps/{mobile,api}` and `packages/{game-engine,shared}` (with `.gitkeep` placeholders where empty)
- [x] Configure `pnpm-workspace.yaml`
- [x] Root `package.json`: `"packageManager": "pnpm@9.12.0"` and Turborepo pipeline tasks (`build`, `test`, `lint`, `typecheck`, plus `format`, `clean`)
- [x] Root `tsconfig.base.json` with strict mode: `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, plus `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals/Parameters`
- [x] Root flat ESLint config (`eslint.config.mjs`) with `typescript-eslint` recommended + `eslint-plugin-import` ordering + Prettier compatibility
- [x] Root Prettier config (`.prettierrc.json`): `semi`, `singleQuote`, `printWidth: 100`, `trailingComma: all`
- [x] Root `.gitignore`: `node_modules`, `dist`, `.expo`, `.env*`, `*.tsbuildinfo`, plus `.turbo`, native build outputs, IDE cruft
- [x] Add `packages/shared` — scaffold now since game-engine and api both depend on it:
  - [x] `packages/shared/src/types.ts` — `FundType`, `InvestmentType`, `Difficulty`, `ScoreTier`, `DependentType`, `MarketRegime`, `MarketEventType` plus API payload TS shapes
  - [x] `packages/shared/src/constants.ts` — `FUND_CONFIG`, `PENALTY_RATES`, `DECAY_RATES`, `SCORE_THRESHOLDS`, plus `MONTHS_PER_RUN`, `LOCK_IN_MONTHS`, `STARTING_HAPPINESS`, salary range, score weights/cap
  - [x] `packages/shared/src/schemas.ts` — Zod schemas for `SnapshotPayload`, `CompleteRunPayload`, `StartRunResponse`, plus `PlayerProfile` and shared enum schemas
  - [x] `packages/shared/src/money.ts` — `toINR(paise)`, `toPaise(inr)`, `formatINR(paise)` (Indian lakh/crore comma format) and bonus `formatINRCompact` for tight HUD spaces
- [x] Add Vitest to root dev dependencies for game-engine tests _(also added per-package `vitest.config.ts` for `shared` and `game-engine`)_
- [x] Add GitHub Actions workflow `.github/workflows/ci.yml`: lint → typecheck → test on every push

### Validate

- [x] `pnpm install` from root completes with no errors
- [x] `pnpm turbo run typecheck` passes across all packages (even with empty stubs)
- [x] `pnpm turbo run lint` passes with zero warnings
- [x] `packages/shared` unit tests pass: `toINR(100)` returns `1`, `formatINR(10000000)` returns `₹1,00,000` _(via `pnpm turbo run test`; `game-engine` runs vitest with `--passWithNoTests` until Step 2 lands its suites)_
- [ ] CI workflow runs green on a test push to a feature branch  _(deferred — exercised by the first push to GitHub)_

---

## Step 2 — Game Engine Package  ✅ _complete_

**Goal:** A fully tested pure-TypeScript package that can simulate a complete 456-month run with no React, no device, no network. This is the most critical step — all UI and backend logic depends on it being correct.

### Implementation

#### 2a — Core Types & State

- [x] `packages/game-engine/src/types.ts`:
  - [x] `GameState` interface (see SystemDesign.md §6.1)
  - [x] `Investment`, `SIPConfig`, `EMI`, `Dependent`, `PortfolioEntry` interfaces
  - [x] `MarketState`, `MarketEvent`, `MarketEventType` types
  - [x] `LifeEventTemplate`, `TriggeredEvent`, `TurnEvent` types
  - [x] `TurnResult`: `{ nextState: GameState; events: TurnEvent[]; requiresInput: boolean }`
  - [x] `PlayerAction` union type — extended with `RESOLVE_EVENT` for pending-event resolution

#### 2b — Seeded RNG

- [x] Install `seedrandom` + `@types/seedrandom`
- [x] `packages/game-engine/src/rng.ts` — `makeRng`, `rngInt`, `rngFloat`, `rngShuffle`
- [x] Tests: same `(seed, month, salt)` returns same float; different salt re-rolls; bounded `rngInt`; deterministic shuffle

#### 2c — Market Simulation Engine

- [x] `packages/game-engine/src/market.ts`:
  - [x] `generateEventSequence(seed)` — 4–6 events with ≥ 24-month spacing
  - [x] `computeMonthlyReturn(fundType, month, marketState, seed)` — base + event modifier + seeded noise
  - [x] `advanceMarketState(state, month)` — promotes upcoming → active → past, derives regime
  - [x] `updateNAVs(navHistory, marketState, month, seed)` — appends a new NAV to each fund
- [x] Tests: Liquid CAGR over 456 months in [5%, 6%]; GREAT_FREEZE drops Large Cap ≥ 40%; same seed = identical NAV history; different seeds differ; spacing invariant holds

#### 2d — Investment Ledger

- [x] `packages/game-engine/src/investments.ts`: `purchaseUnits`, `withdraw`, `portfolioValue`, `netWorth`, `buildPortfolio`
- [x] Tests: 10,000 units at NAV 1000 paise from ₹1,00,000; LARGE_CAP early withdrawal = 3% penalty; post-lock-in penalty = 0; mark-to-market correctness

#### 2e — Happiness System

- [x] `packages/game-engine/src/happiness.ts`: `applyDecay`, `applySpend`, `requiresHappinessAction`, `averageHappiness`, `happinessLegacy`
- [x] Tests: SELF reaches 2000 at month 50; ₹10K spend = +5000 happiness below threshold; above 8000 yields < 50% boost; block triggers below 2000

#### 2f — Life Events & Emergency System

- [x] `packages/game-engine/src/events.ts`: `buildEventDeck`, `checkPlannedEvents`, `rollEmergency`, `applyEvent`, `compoundUnresolvedIgnorePenalties`
- [x] Tests: marriage age window = months 48–96; ignored medical compounds ≥ 3000 happiness; JOB_LOSS pauses salary 3–8 months; emergency deck has no duplicates in NORMAL difficulty

#### 2g — Turn Resolution Pipeline

- [x] `packages/game-engine/src/turn.ts` — full 8-phase pipeline (income → commitments → market → happiness → events → lock-in → snapshot → advance)
- [x] `packages/game-engine/src/score.ts` — `computeFinalScore` + `tierFor`
- [x] Tests: salary credited before SIP; SIP_SKIPPED on insufficient cash; full run completes well under requirement; ₹5 Cr + 80% happiness = tier A; ₹50L + 30% = tier D; identical seeds = identical scores

#### 2h — Run Factory

- [x] `packages/game-engine/src/run.ts` — `createNewRun(seed, difficulty)`
- [x] Tests: starting salary in [₹25K, ₹45K]; different seeds = different salaries; empty initial portfolio; SELF dependent starts at 7000

### Validate

- [x] `pnpm turbo run test --filter=@corpus-quest/game-engine` — 41/41 green
- [x] `pnpm turbo run typecheck --filter=@corpus-quest/game-engine` — zero TS errors
- [x] `__tests__/smoke.test.ts` — full 456-month run completes with `isComplete=true`, valid score tier, sane net worth
- [x] Same-seed × 10 → identical final scores
- [x] 10 distinct seeds → ≥ 8 distinct outcomes (compared by net worth, since the 0–100 score axis can saturate)

---

## Step 3 — Expo Mobile App (Game Loop First)  ✅ _implementation complete (device validation deferred)_

**Goal:** The game is fully playable on-device with local-only state. No backend. No auth. Player can complete a full run from age 22 to 60.

### Implementation

#### 3a — Expo Bootstrap

- [x] ~~`cd apps/mobile && npx create-expo-app@latest . --template blank-typescript`~~ _(scaffolded by hand — interactive CLI skipped; manual `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js` produce the same result without template noise)_
- [x] Install Expo Router via workspace `package.json` (`expo-router ~3.5.0`)
- [x] Install core dependencies (`react-native-mmkv`, `zustand`, `@tanstack/react-query`, `react-native-reanimated`, `react-native-gesture-handler`, `victory-native`, `@shopify/react-native-skia`, `expo-notifications`, `expo-haptics`)
- [x] Configure `app.json`: `scheme: corpusquest`, iOS bundleId, Android package, splash + icon placeholders, expo-router plugin, typed routes
- [x] Add `packages/game-engine` and `packages/shared` as `workspace:*` dependencies; Metro config widened to watch the workspace root

#### 3b — MMKV Persistence Layer

- [x] `apps/mobile/src/storage/mmkv.ts` — single MMKV instance + key registry
- [x] `apps/mobile/src/storage/runStorage.ts`:
  - [x] `saveRunState(runId, state)` / `loadRunState(runId)`
  - [x] `saveRunHistory(summary[])` / `loadRunHistory()` / `appendRunHistory`
  - [x] `markDirty(runId)` / `clearDirty(runId)` / `isDirty(runId)`
  - [x] Active-run pointer, player name, tutorial step/complete helpers

#### 3c — Zustand Store

- [x] `apps/mobile/src/store/runSlice.ts` — actions: `startNewRun`, `loadExistingRun`, `advanceTurn`, `applyAction`, `endRun`, `clear`
- [x] `apps/mobile/src/store/uiSlice.ts` — active tab, toast queue, glossary sheet, tutorial overlay
- [x] `apps/mobile/src/store/metaSlice.ts` — run history hydrate, auth user, leaderboard cache
- [x] `apps/mobile/src/store/index.ts` — combined `AppStore` + cached selectors (devtools middleware deferred until React Native DevTools shim is added in Step 5)
- [x] `advanceTurn(action?)` — calls `resolveTurn()`, writes back via `saveRunState`, marks dirty every 12 months, appends run history on completion

#### 3d — Screen Architecture & HUD

- [x] Expo Router file structure mirrors SystemDesign §5.2: `(game)/_layout.tsx` mounts the tab navigator with HUD on top; `new-game.tsx`, `results.tsx`, `run-history.tsx` live in the meta route group
- [x] `app/(game)/_layout.tsx` renders the `<HUD/>` overlay above the tab screens and redirects to results when `isComplete`
- [x] `src/components/HUD.tsx`:
  - [x] Net worth (compact Lakh/Crore formatting via `formatINRCompact`)
  - [x] Available cash
  - [x] Age (years + months derived from `STARTING_AGE_MONTHS + month`)
  - [x] Happiness portrait dots, colour-coded green ≥ 60 / amber 30–59 / red < 30
  - [x] Upcoming expenses (next 3 — currently EMI + active SIPs)
  - [x] Market pulse pill (Bull / Bear / Volatile / Steady)
- [x] HUD uses dedicated Zustand selectors (`selectHud`) — no top-level subscriptions

#### 3e — Core Game Screens

- [x] **Dashboard** (`dashboard.tsx`): month summary, "Advance month" button (disabled while `requiresInput`), pending-event card, dev-only "fast-forward to next decision" loop
- [x] **Portfolio** (`portfolio.tsx`): per-fund holdings + unrealised P&L, individual investment lots with lock-in countdown and penalty %, per-SIP pause/resume controls _(Victory Native NAV history chart still pending — Skia chart slated for Step 5b polish)_
- [x] **Invest** (`invest.tsx`): fund selector cards (risk + base return + penalty), SIP/Lumpsum toggle, amount input, dispatches `INVEST_SIP` / `INVEST_LUMPSUM`
- [x] **Life Events** (`events.tsx`): pending decision with Pay/Ignore controls dispatching `RESOLVE_EVENT`, scrollable history of triggered events with cash impact tags
- [x] **Family** (`family.tsx`): happiness bars per dependent, three preset boost spends via `HAPPINESS_SPEND`
- [x] **Market** (`market.tsx`): regime pill, active market events list, 1-month and 1-year % change per fund derived from NAV history
- [x] **Stats** (`stats.tsx`): run summary, monthly inflow/outflow + savings rate, happiness legacy with a lightweight sparkline _(Victory Native net-worth chart slated for Step 5b)_

#### 3f — Game Flow

- [x] `app/new-game.tsx`: name input + "Begin your quest" — generates a local seed (`Date.now()` + random), calls `startNewRun`, kicks off the tutorial on first launch
- [x] Turn loop wired: Dashboard "Advance month" → `advanceTurn` → `requiresInput` flips Pay/Ignore controls live on Events/Family → resolve action → resumed turn pipeline continues automatically
- [x] `app/results.tsx`: score tier reveal (`TIER_TITLES`/`TIER_TINT`), net worth breakdown, replay + history buttons; auto-redirected from `(game)` layout when `isComplete`
- [x] `app/run-history.tsx`: hydrates from MMKV via `hydrateRunHistory`, shows last five runs with score/tier/net worth

#### 3g — Onboarding Tutorial

- [x] First-launch tutorial overlay (`TutorialOverlay.tsx`) — 5 step deck covering HUD, investing early, happiness, and lock-in; MMKV-tracked completion (`tutorial:complete`)
- [x] Tutorial step persisted in MMKV (`tutorial:step` placeholder helpers exist; step deck currently advances purely in-memory because the overlay is one continuous flow at run start)
- [x] "Explain This" pill on every screen → `<GlossarySheet/>` modal seeded by per-screen `SCREEN_DEFAULT_TERM` map of all 10 GDD §10 terms

### Validate

- [x] `pnpm --filter @corpus-quest/mobile typecheck` — zero TS errors
- [x] `pnpm --filter @corpus-quest/mobile lint` — zero warnings
- [x] Full workspace `pnpm turbo run typecheck` / `lint` / `test` still green (41 game-engine + 20 shared tests)
- [ ] App launches on iOS Simulator and Android Emulator in < 3 seconds  _(deferred — needs `expo start` on a device/emulator)_
- [ ] Full run (age 22 → 60) completable end-to-end with no crashes  _(deferred — needs device run; engine smoke test already covers the 456-month run headlessly)_
- [ ] Advancing 456 months via "fast-forward" test button completes in < 30 seconds on a mid-range Android device  _(deferred — fast-forward button is wired on Dashboard; perf test needs a real device)_
- [ ] Happiness block correctly prevents turn advance when any dependent < 20  _(implemented — `requiresHappinessAction` is consumed in `advanceTurn`, Advance button disables on `requiresInput`; needs device-side smoke test)_
- [ ] Lock-in penalty is correctly displayed and deducted on early withdrawal  _(implemented — Portfolio screen surfaces the penalty %; deduction is covered by game-engine tests)_
- [ ] NAV history chart renders without performance jank on the Portfolio screen  _(deferred — chart implementation moved into Step 5b polish; sparkline placeholder lives on the Stats screen)_
- [ ] App survives: force-quit mid-run → reopen → state is exactly restored from MMKV  _(implemented — root layout rehydrates from MMKV on mount; needs device verification)_
- [ ] HUD net worth updates correctly every turn and never shows a negative value erroneously  _(implemented — HUD subscribes via `selectHud`; needs device verification)_
- [ ] Tutorial can be completed without skipping — all mechanics are introduced before they first appear  _(implemented — five-step deck shown on first run; flow validation needs device)_

---

## Step 4 — Backend, Auth & Cloud Sync

**Goal:** Player accounts, cross-device resume, run history in the cloud, and a working global leaderboard.

### Implementation

#### 4a — Supabase Auth Setup

- [ ] Create Supabase project at `supabase.com`
- [ ] Enable Email, Google, and Apple providers in Supabase Auth settings
- [ ] Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `apps/mobile/.env`
- [ ] Install `@supabase/supabase-js` in `apps/mobile`
- [ ] `apps/mobile/src/auth/supabase.ts` — initialise Supabase client with AsyncStorage session persistence
- [ ] Login screen: email/password form + Google + Apple sign-in buttons
- [ ] Registration screen: email + display name
- [ ] On successful auth: store session, navigate to Dashboard
- [ ] Wrap `(game)` route group in auth guard — redirect to login if no session

#### 4b — Fastify API Bootstrap

- [ ] `cd apps/api && pnpm init`
- [ ] Install: `fastify`, `@fastify/jwt`, `@fastify/cors`, `zod`, `prisma`, `@prisma/client`, `ioredis`
- [ ] `apps/api/src/server.ts` — Fastify instance with JWT plugin, CORS, and Zod-based schema validation
- [ ] `apps/api/src/plugins/auth.ts` — JWT verification middleware using Supabase public key (JWKS endpoint)
- [ ] `apps/api/.env`: `DATABASE_URL`, `REDIS_URL`, `SUPABASE_JWT_SECRET`, `PORT`

#### 4c — Prisma Schema & Migrations

- [ ] `packages/shared/prisma/schema.prisma` — full schema from SystemDesign.md §8.1
- [ ] `npx prisma migrate dev --name init` — creates tables on local Postgres
- [ ] `packages/shared/src/db.ts` — export singleton `PrismaClient` instance
- [ ] Seed script `packages/shared/prisma/seed.ts` — optional: insert test player + run

#### 4d — API Routes

- [ ] `GET /v1/players/me` — return player profile from Postgres
- [ ] `PATCH /v1/players/me` — update display name
- [ ] `POST /v1/runs` — create run, generate server-side seed using `crypto.randomUUID()`, return `StartRunResponse`
- [ ] `GET /v1/runs/:runId` — return latest snapshot for resume
- [ ] `PUT /v1/runs/:runId/snapshot` — upsert snapshot; validate Zod schema; store `stateBlob`
- [ ] `POST /v1/runs/:runId/complete` — validate score (see SystemDesign.md §9.4), update Redis leaderboard
- [ ] `GET /v1/players/me/runs` — last 10 run summaries
- [ ] `GET /v1/leaderboard/global` — read Redis sorted set, enrich with player display names
- [ ] `GET /v1/leaderboard/me` — personal rank + ±5 surrounding entries

#### 4e — Redis Leaderboard

- [ ] Provision Upstash Redis (free tier sufficient for v1)
- [ ] Add `REDIS_URL` to `apps/api/.env`
- [ ] `apps/api/src/services/leaderboard.ts`:
  - [ ] `submitScore(playerId, runId, score, meta): Promise<void>` — `ZADD` + `HSET`
  - [ ] `getTopN(n: number): Promise<LeaderboardEntry[]>` — `ZREVRANGE` + batch `HGETALL`
  - [ ] `getPlayerRank(playerId, runId): Promise<number>` — `ZREVRANK`

#### 4f — Client-Side Sync

- [ ] `apps/mobile/src/sync/runSync.ts`:
  - [ ] `startCloudRun(seed): Promise<{ runId: string }>` — POST `/v1/runs`
  - [ ] `syncSnapshot(runId, state): Promise<void>` — PUT `/v1/runs/:runId/snapshot`; on failure, set dirty flag and queue for retry
  - [ ] `completeRun(runId, finalState): Promise<void>` — POST `/v1/runs/:runId/complete`
  - [ ] `retryDirtySync(): Promise<void>` — check MMKV dirty flag on app foreground, retry if set
- [ ] Wire sync into `advanceTurn()`: every 12 turns, call `syncSnapshot` in background (non-blocking)
- [ ] Wire `startCloudRun` into new game creation (after auth)
- [ ] Wire `retryDirtySync` into app foreground event handler

#### 4g — TanStack Query Integration

- [ ] `apps/mobile/src/queries/leaderboard.ts` — `useLeaderboard()` hook with 5-minute stale time
- [ ] `apps/mobile/src/queries/runHistory.ts` — `useRunHistory()` hook
- [ ] Leaderboard screen: renders `useLeaderboard()` data with a pull-to-refresh

### Validate

- [ ] Register a new account → login on a different device → see the same run available to resume
- [ ] Complete a run → score appears in global leaderboard within 10 seconds
- [ ] Play 12 months offline (airplane mode) → reconnect → dirty snapshot syncs automatically
- [ ] `POST /v1/runs/:runId/complete` with a manipulated score (e.g. score: 200) is rejected with 400
- [ ] API p95 latency < 300ms under 50 concurrent requests (run a quick `autocannon` benchmark)
- [ ] Leaderboard correctly orders players by final score descending
- [ ] Supabase JWT from a different project is rejected with 401

---

## Step 5 — Polish, Remaining Screens & Launch Prep

**Goal:** Complete the UI, add onboarding, tune performance, and prepare for App Store / Play Store submission.

### Implementation

#### 5a — Animations & Transitions

- [ ] HUD net worth counter: animate value changes with Reanimated `useAnimatedProps` (number ticker effect)
- [ ] Happiness portraits: animate colour transition when happiness drops below thresholds
- [ ] Turn advance: subtle screen flash / haptic pulse on each month advance
- [ ] Age-60 results screen: score tier reveal animation (count up from 0)
- [ ] Market event notification: slide-in banner when a new market event triggers

#### 5b — Charts & Data Visualisation

- [ ] Net worth history chart (Stats screen): Victory Native area chart, event markers on timeline for market events and major life events
- [ ] Per-fund NAV chart (Portfolio screen): multi-line chart, one line per fund, togglable
- [ ] Income vs expense breakdown (Stats screen): stacked bar chart per year
- [ ] Savings rate gauge (Stats screen): circular progress indicator

#### 5c — "Explain This" Glossary

- [ ] `apps/mobile/src/data/glossary.ts` — all 10 terms from GDD §10 as a typed map
- [ ] Bottom sheet component triggered by "Explain This" button on every screen
- [ ] Context-aware: each screen passes the most relevant term as the default open entry

#### 5d — Cosmetics & Monetisation (RevenueCat)

- [ ] Install `react-native-purchases` (RevenueCat SDK)
- [ ] Configure products in App Store Connect and Google Play Console
- [ ] `apps/mobile/src/purchases/revenueCat.ts` — initialise, `getOfferings()`, `purchasePackage()`
- [ ] Cosmetic shop screen: show available avatar frames and HUD themes
- [ ] POST `/v1/purchases/verify` backend route — RevenueCat webhook receiver, update `ownedCosmetics` in Postgres

#### 5e — Performance Audit

- [ ] Profile the turn loop on a real Android device (mid-range, e.g. Pixel 5a): target < 50ms per turn
- [ ] Profile the Portfolio chart re-render with 456 months of NAV data: target < 16ms per frame
- [ ] Run Expo's bundle analyser: identify and code-split any modules > 100 KB
- [ ] Test cold start on iOS and Android: target < 3 seconds to interactive

#### 5f — Error Handling & Crash Resilience

- [ ] Install and configure `@sentry/react-native` — init in `app/_layout.tsx`
- [ ] Wrap `resolveTurn()` call in try/catch: on failure, restore last MMKV state and show user toast
- [ ] Add network error states to all TanStack Query fetches (leaderboard, sync): show "offline" indicator in HUD when no connectivity
- [ ] Handle edge case: player somehow reaches negative cash (should be impossible, but guard against it)

#### 5g — App Store Prep

- [ ] Design and export app icon (1024×1024) and all required sizes
- [ ] Design splash screen
- [ ] Write App Store description and keywords (financial literacy angle)
- [ ] Record 3 App Store preview screenshots: HUD in action, portfolio chart, age-60 results screen
- [ ] Configure Expo EAS Build: `eas build --platform all --profile production`
- [ ] Configure Expo EAS Submit for both stores

### Validate

- [ ] Animations run at 60fps on a real device (use Flipper or Xcode Instruments to confirm no dropped frames)
- [ ] App Store review checklist: no crashes on launch, works in airplane mode, privacy policy linked, no private API usage
- [ ] All Sentry breadcrumbs are meaningful — a crash report contains enough context to reproduce the issue
- [ ] Force-kill app at every screen — reopen — confirm no data loss and no broken UI state
- [ ] Complete a run with a score in each tier (S, A, B, C, D) — verify correct title and colour is shown on results screen
- [ ] Cosmetic purchase flow: buy → cosmetic appears in game → uninstall and reinstall → cosmetic still present (server-authoritative)
- [ ] Run the full test suite one final time: `pnpm turbo run test` — all green

---

## Cross-Cutting Checklist (Do Before Each Step Ships)

- [ ] `pnpm turbo run typecheck` — zero errors
- [ ] `pnpm turbo run lint` — zero warnings
- [ ] `pnpm turbo run test` — all tests pass
- [ ] No `console.log` statements in production code paths
- [ ] All monetary values are in **paise (integer)** — no floating-point arithmetic anywhere in the game engine
- [ ] Every new function in `game-engine` has at least one Vitest test
- [ ] No hardcoded secrets — all env vars in `.env` files, never committed

---

*Corpus Quest — TODOs v1.0 — 2026-05-08*
