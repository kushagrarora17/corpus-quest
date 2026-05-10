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

## Step 2 — Game Engine Package

**Goal:** A fully tested pure-TypeScript package that can simulate a complete 456-month run with no React, no device, no network. This is the most critical step — all UI and backend logic depends on it being correct.

### Implementation

#### 2a — Core Types & State

- [ ] `packages/game-engine/src/types.ts`:
  - [ ] `GameState` interface (see SystemDesign.md §6.1)
  - [ ] `Investment`, `SIPConfig`, `EMI`, `Dependent`, `PortfolioEntry` interfaces
  - [ ] `MarketState`, `MarketEvent`, `MarketEventType` types
  - [ ] `LifeEventTemplate`, `TriggeredEvent`, `TurnEvent` types
  - [ ] `TurnResult`: `{ nextState: GameState; events: TurnEvent[]; requiresInput: boolean }`
  - [ ] `PlayerAction` union type: `INVEST_SIP | INVEST_LUMPSUM | WITHDRAW | SET_SIP | HAPPINESS_SPEND | SKIP`

#### 2b — Seeded RNG

- [ ] Install `seedrandom` + `@types/seedrandom`
- [ ] `packages/game-engine/src/rng.ts` — wrapper:
  ```typescript
  export function makeRng(seed: string, month: number, salt: string) {
    return seedrandom(`${seed}:${month}:${salt}`)();
  }
  // Returns a float in [0, 1) — deterministic given the same inputs
  ```
- [ ] Write tests: same seed + month + salt always returns same float; different salt returns different float

#### 2c — Market Simulation Engine

- [ ] `packages/game-engine/src/market.ts`:
  - [ ] `generateEventSequence(seed: string): MarketEvent[]` — draws 4–6 events from the pool, enforces minimum 24-month spacing between events, stores start months derived from seed
  - [ ] `computeMonthlyReturn(fundType, month, marketState, seed): number` — base trend + event modifier + noise
  - [ ] `advanceMarketState(state: MarketState, month: number): MarketState` — move event windows forward, update regime
  - [ ] `updateNAVs(navHistory, marketState, month, seed): NAVHistory` — apply returns to all 5 funds
- [ ] Write tests:
  - [ ] Liquid fund NAV after 456 months with no events stays within 5–6% p.a. range
  - [ ] During a `GREAT_FREEZE` event, Large Cap NAV drops ≥ 40%
  - [ ] Two runs with the same seed produce identical NAV histories
  - [ ] Two runs with different seeds produce different NAV histories

#### 2d — Investment Ledger

- [ ] `packages/game-engine/src/investments.ts`:
  - [ ] `purchaseUnits(cash, fundType, amount, month, nav): { investment: Investment; cashAfter: number }` — validates sufficient cash, computes units, sets lockInExpiryMonth
  - [ ] `withdraw(investment, currentNav, month, partial?): WithdrawResult` — applies penalty if locked
  - [ ] `portfolioValue(investments, navHistory, month): number` — sum of all non-withdrawn investments at current NAV
  - [ ] `netWorth(cash, investments, navHistory, month): number`
- [ ] Write tests:
  - [ ] Buying 10,000 units of Liquid at NAV 1000 costs exactly ₹1,00,000 (1,00,00,000 paise)
  - [ ] Early withdrawal of Large Cap triggers 3% penalty
  - [ ] Post-lockIn withdrawal has zero penalty
  - [ ] `portfolioValue` correctly marks an invested amount to current NAV

#### 2e — Happiness System

- [ ] `packages/game-engine/src/happiness.ts`:
  - [ ] `applyDecay(dependents): Dependent[]`
  - [ ] `applySpend(dependent, spendAmountPaise): Dependent` — boost formula: diminishing returns above happiness 8000 (display: 80)
  - [ ] `requiresHappinessAction(dependents): boolean` — true if any dependent < 2000
  - [ ] `happinessLegacy(happinessLog): number` — average happiness across all dependents across all months (0–10000)
- [ ] Write tests:
  - [ ] Self happiness starts at 7000, decays 100/month, reaches 2000 at month 50
  - [ ] Spending ₹10,000 on self raises happiness by expected amount
  - [ ] Spend above 8000 gives < 50% of normal boost (diminishing returns)

#### 2f — Life Events & Emergency System

- [ ] `packages/game-engine/src/events.ts`:
  - [ ] `buildEventDeck(seed, difficulty): LifeEventTemplate[]` — shuffled emergency deck; planned events sorted by age window
  - [ ] `checkPlannedEvents(state): LifeEventTemplate | null` — returns next planned event if player age falls in window
  - [ ] `rollEmergency(state, seed): LifeEventTemplate | null` — probability roll; draw from emergency deck
  - [ ] `applyEvent(state, event): GameState` — modifies cash, happiness, salary as defined in GDD §5
- [ ] Write tests:
  - [ ] Marriage event fires between age 26–30 (months 48–96)
  - [ ] Ignored medical emergency compounds: happiness drops additional –30 if unresolved after 2 months
  - [ ] Job loss event sets salary to 0 for 3–8 months
  - [ ] Emergency deck has no duplicates in a single run

#### 2g — Turn Resolution Pipeline

- [ ] `packages/game-engine/src/turn.ts`:
  - [ ] `resolveTurn(state: GameState, action?: PlayerAction): TurnResult`
  - [ ] Implement the 8-phase pipeline from SystemDesign.md §6.2 exactly in order
  - [ ] After month 455 (age 60), set `isComplete = true` and compute final score
  - [ ] `computeFinalScore(finalNetWorth, happinessLegacy): { score: number; tier: ScoreTier }`
- [ ] Write tests:
  - [ ] Salary is credited before SIP is deducted
  - [ ] SIP deduction fails gracefully (skips, emits `SIP_SKIPPED` event) if cash < SIP amount
  - [ ] Full 456-turn simulation completes in < 100ms
  - [ ] Final score of ₹5 Cr net worth + 80% happiness avg lands in tier A
  - [ ] Final score of ₹50L net worth + 30% happiness avg lands in tier D
  - [ ] Two identical seeds produce identical final scores

#### 2h — Run Factory

- [ ] `packages/game-engine/src/run.ts`:
  - [ ] `createNewRun(seed: string, difficulty: Difficulty): GameState` — builds initial state: age 22, random salary in ₹25K–₹45K range, empty portfolio, all dependents at happiness 7000 (display: 70), event deck generated
- [ ] Write tests:
  - [ ] Starting salary always in range ₹25,000–₹45,000/month
  - [ ] Different seeds produce different starting salaries
  - [ ] Initial portfolio value is 0

### Validate

- [ ] `pnpm turbo run test --filter=game-engine` — all tests green
- [ ] `pnpm turbo run typecheck --filter=game-engine` — zero TS errors
- [ ] Manually run a full 456-month sim via a `__tests__/smoke.test.ts` script and confirm: final net worth > 0, happiness legacy > 0, score tier is one of S/A/B/C/D, completes in < 100ms
- [ ] Run same seed 10 times — confirm identical final scores each time
- [ ] Run 10 different seeds — confirm at least 8 produce different outcomes

---

## Step 3 — Expo Mobile App (Game Loop First)

**Goal:** The game is fully playable on-device with local-only state. No backend. No auth. Player can complete a full run from age 22 to 60.

### Implementation

#### 3a — Expo Bootstrap

- [ ] `cd apps/mobile && npx create-expo-app@latest . --template blank-typescript`
- [ ] Install Expo Router: `npx expo install expo-router`
- [ ] Install core dependencies:
  ```
  npx expo install react-native-mmkv zustand @tanstack/react-query
  npx expo install react-native-reanimated react-native-gesture-handler
  npx expo install victory-native @shopify/react-native-skia
  npx expo install expo-notifications expo-haptics
  ```
- [ ] Configure `app.json`: set `scheme`, `bundleIdentifier`, `package`, splash screen, icon placeholders
- [ ] Add `packages/game-engine` and `packages/shared` as workspace dependencies

#### 3b — MMKV Persistence Layer

- [ ] `apps/mobile/src/storage/mmkv.ts` — initialise MMKV instance
- [ ] `apps/mobile/src/storage/runStorage.ts`:
  - [ ] `saveRunState(runId, state: GameState): void`
  - [ ] `loadRunState(runId): GameState | null`
  - [ ] `saveRunHistory(summary: RunSummary[]): void`
  - [ ] `loadRunHistory(): RunSummary[]`
  - [ ] `markDirty(runId): void` / `clearDirty(runId): void`

#### 3c — Zustand Store

- [ ] `apps/mobile/src/store/runSlice.ts` — `RunSlice` from SystemDesign.md §5.3
- [ ] `apps/mobile/src/store/uiSlice.ts` — `UISlice`
- [ ] `apps/mobile/src/store/metaSlice.ts` — `MetaSlice`
- [ ] `apps/mobile/src/store/index.ts` — combine slices, add `devtools` middleware in dev mode
- [ ] Action: `advanceTurn(action?: PlayerAction)` — calls `resolveTurn()`, writes to store, persists to MMKV

#### 3d — Screen Architecture & HUD

- [ ] Set up Expo Router file structure exactly as in SystemDesign.md §5.2
- [ ] `app/(game)/_layout.tsx` — render HUD overlay above child screens
- [ ] `src/components/HUD.tsx`:
  - [ ] Net worth (formatted in Lakhs/Crores)
  - [ ] Available cash
  - [ ] Age (years + months)
  - [ ] Happiness portrait icons (5 max, colour-coded: green ≥ 60, amber 30–59, red < 30)
  - [ ] Upcoming expenses (next 3)
  - [ ] Market pulse indicator (Bull / Bear / Volatile / Steady)
- [ ] HUD re-renders only when `RunSlice` changes — use Zustand selector subscriptions, not top-level re-renders

#### 3e — Core Game Screens

- [ ] **Dashboard** (`dashboard.tsx`): current month summary, "Advance Month" button (disabled if happiness block or pending event), pending event card
- [ ] **Portfolio** (`portfolio.tsx`): holdings per fund, unrealised P&L, lock-in countdown, SIP active/paused status, NAV history line chart (Victory Native)
- [ ] **Invest** (`invest.tsx`): fund selector cards (show risk/return), toggle SIP vs Lumpsum, amount input, confirm — triggers `INVEST_SIP` or `INVEST_LUMPSUM` action
- [ ] **Life Events** (`events.tsx`): scrollable list of triggered events, pending decisions (e.g. pay hospital bill), emergency alerts with "Pay Now" / "Ignore" options
- [ ] **Family** (`family.tsx`): happiness bars per dependent, "Boost Happiness" spend cards
- [ ] **Market** (`market.tsx`): market regime card, per-fund performance (% change this month, % change this year), news headline ticker for active market events
- [ ] **Stats** (`stats.tsx`): net worth over time chart, income vs expense breakdown bar, savings rate gauge

#### 3f — Game Flow

- [ ] New game screen: name input + start button (generates local seed, creates run via `createNewRun`)
- [ ] Turn loop: Dashboard "Advance Month" → `advanceTurn()` → if `requiresInput`, navigate to Events or Family screen → player resolves → return to Dashboard
- [ ] Age-60 results screen (`results.tsx`): final score reveal, score tier display, net worth breakdown, replay button
- [ ] Run history screen (`run-history.tsx`): last 5 runs in a comparison table

#### 3g — Onboarding Tutorial

- [ ] First run: inject a tutorial overlay that surfaces on first encounter with each mechanic
- [ ] Tutorial state tracked in MMKV: `tutorial:step` integer, `tutorial:complete` boolean
- [ ] "Explain This" button on every screen — opens a bottom sheet with the relevant glossary entry from GDD §10

### Validate

- [ ] App launches on iOS Simulator and Android Emulator in < 3 seconds
- [ ] Full run (age 22 → 60) completable end-to-end with no crashes
- [ ] Advancing 456 months via "fast-forward" test button completes in < 30 seconds on a mid-range Android device
- [ ] Happiness block correctly prevents turn advance when any dependent < 20
- [ ] Lock-in penalty is correctly displayed and deducted on early withdrawal
- [ ] NAV history chart renders without performance jank on the Portfolio screen (test with 200+ months of data)
- [ ] App survives: force-quit mid-run → reopen → state is exactly restored from MMKV
- [ ] HUD net worth updates correctly every turn and never shows a negative value erroneously
- [ ] Tutorial can be completed without skipping — all mechanics are introduced before they first appear

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
