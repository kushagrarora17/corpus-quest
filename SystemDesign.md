# Corpus Quest — System Design Document

**Version:** 1.0  
**Date:** 2026-05-08  
**Stack Constraint:** JavaScript / TypeScript only  
**Platform:** React Native (iOS & Android)

---

## Table of Contents

1. [Assumptions & Constraints](#1-assumptions--constraints)
2. [Requirements](#2-requirements)
3. [Tech Stack](#3-tech-stack)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Client Architecture](#5-client-architecture)
6. [Game Engine](#6-game-engine)
7. [Market Simulation Engine](#7-market-simulation-engine)
8. [Data Models](#8-data-models)
9. [Backend API Design](#9-backend-api-design)
10. [Offline-First & Sync Strategy](#10-offline-first--sync-strategy)
11. [Leaderboard System](#11-leaderboard-system)
12. [Monetisation Architecture](#12-monetisation-architecture)
13. [Scale & Reliability](#13-scale--reliability)
14. [Trade-off Analysis](#14-trade-off-analysis)
15. [Future Systems (v2.0)](#15-future-systems-v20)
16. [What to Revisit](#16-what-to-revisit)

---

## 1. Assumptions & Constraints

- Solo developer or very small team (1–3 engineers) — design must minimise operational burden.
- Launch target is India; backend must handle Indian traffic patterns and support INR denomination.
- Game logic is deterministic and turn-based — no real-time server authority needed for v1.
- Monetisation is cosmetic-only; no financial transactions inside gameplay, no real money movement.
- Leaderboard does not need to be cheat-proof at launch — social comparison is the goal, not competitive integrity.
- A full playthrough is ~60 minutes and covers 456 in-game months (38 years × 12). All 456 turns must resolve in under 30 seconds of wall-clock time on a mid-range Android device.

---

## 2. Requirements

### 2.1 Functional Requirements

| # | Requirement |
|---|-------------|
| F1 | Player registers with email/Google/Apple and can resume a run across devices |
| F2 | A monthly turn engine processes salary credit, SIP deductions, EMI deductions, NAV updates, happiness decay, and optional event triggers |
| F3 | Five mutual fund types with distinct risk/return profiles; each fund tracks NAV monthly |
| F4 | SIP can be created, paused, increased, or stopped at any time |
| F5 | Lumpsum investments are possible at any time from available cash |
| F6 | Every investment unit has a 12-month lock-in; early withdrawal incurs a fund-specific penalty |
| F7 | Happiness scores for up to 5 dependents decay each month; a score below 20 blocks turn progression |
| F8 | Planned life events (marriage, children, home purchase, etc.) trigger within defined age windows |
| F9 | Random emergency events are drawn from a shuffled deck per run |
| F10 | At age 60, a Final Score is computed from net worth (70%) and average happiness legacy (30%) |
| F11 | Players can view their last 5 run results side-by-side |
| F12 | A global leaderboard ranks players by Final Score at age 60 |
| F13 | In-game glossary and "Explain This" contextual help is available on every screen |

### 2.2 Non-Functional Requirements

| # | Requirement | Target |
|---|-------------|--------|
| N1 | Monthly turn resolution (all 456 turns) | < 30 s on mid-range Android |
| N2 | App cold-start to playable state | < 3 s |
| N3 | API p95 latency | < 300 ms |
| N4 | Offline gameplay | Full run playable with no internet; sync on reconnect |
| N5 | Data durability | Run state auto-saved locally every turn; synced to cloud on completion |
| N6 | Availability | 99.5% uptime for API (leaderboard/sync); game itself must function offline |
| N7 | Bundle size | < 25 MB initial download |

### 2.3 Out of Scope (v1)

- Insurance mechanic, tax planning, side income (v1.1/v1.2)
- Multiplayer cohort mode (v2.0)
- Historical scenario mode (v2.0)
- AI financial advisor (v2.1)

---

## 3. Tech Stack

### 3.1 Client

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | **React Native 0.74** (Expo managed workflow) | JS/TS constraint; Expo reduces native config overhead for a small team |
| Language | **TypeScript 5.x** | Type safety across game engine, state, and API client |
| Navigation | **Expo Router** (file-based, React Navigation underneath) | Familiar web-like routing; deep-link support for notifications |
| UI Animation | **React Native Reanimated 3** | 60/120fps animations on the JS thread; native driver for HUD transitions |
| Charts | **Victory Native XL** | Recharts-compatible API, runs on Skia, performant NAV history charts |
| State (game) | **Zustand** | Minimal boilerplate; slice pattern maps cleanly to game domains |
| State (server) | **TanStack Query v5** | Cache + background refetch for leaderboard and run sync |
| Local storage | **MMKV** (via `react-native-mmkv`) | 10× faster than AsyncStorage; critical for turn-by-turn autosave |
| RNG | **seedrandom** (npm) | Seeded, reproducible random for market simulation and event ordering |

### 3.2 Backend

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Runtime | **Node.js 20 LTS** | JS/TS constraint; excellent ecosystem |
| Framework | **Fastify 4** | ~2× faster than Express; TypeScript-native; schema validation via Zod |
| ORM | **Prisma 5** | TypeScript-first; migrations; strong PostgreSQL support |
| Database | **PostgreSQL 16** | Relational model fits player/run/event data; JSONB for flexible snapshots |
| Cache / Leaderboard | **Redis 7** (Upstash serverless) | Sorted sets for leaderboard; session caching; minimal ops with Upstash |
| Auth | **Supabase Auth** | Email + Google + Apple sign-in; issues JWTs; zero infra to manage |
| Push notifications | **Expo Push Notification Service** | Unified APNs + FCM delivery from a single API |
| Hosting | **Railway** (API + Postgres) | Git-deploy Node.js; managed Postgres; cheap for early scale |
| Validation | **Zod** | Shared schema between client and server via a `@corpusquest/shared` workspace package |

### 3.3 Tooling

| Tool | Purpose |
|------|---------|
| Turborepo | Monorepo for `apps/mobile`, `packages/game-engine`, `packages/shared`, `apps/api` |
| Vitest | Unit tests for game engine (pure TS, no React dependency) |
| Jest + RNTL | Component and integration tests for React Native screens |
| ESLint + Prettier | Consistent code style |
| GitHub Actions | CI: lint → type-check → unit tests → build |

---

## 4. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Mobile Client                           │
│                    (React Native / Expo)                     │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   UI Screens    │  │  Zustand Store  │                   │
│  │  (Expo Router)  │◄─┤  (game state,   │                   │
│  │                 │  │   ui state)     │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────▼────────────────────▼────────┐                   │
│  │            Game Engine               │                   │
│  │   (packages/game-engine, pure TS)    │                   │
│  │                                      │                   │
│  │  TurnEngine │ MarketSim │ EventDeck  │                   │
│  │  HappinessSys │ InvestmentLedger     │                   │
│  └────────────────────┬─────────────────┘                   │
│                        │                                     │
│  ┌─────────────────────▼───────────────┐                    │
│  │          MMKV Local Store           │                    │
│  │  (run state, snapshots, run history)│                    │
│  └─────────────────────────────────────┘                    │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │         TanStack Query Client        │                   │
│  │    (leaderboard, sync, auth)         │                   │
│  └──────────────┬───────────────────────┘                   │
└─────────────────┼────────────────────────────────────────────┘
                  │ HTTPS REST
┌─────────────────▼────────────────────────────────────────────┐
│                  Fastify API Server                           │
│                                                              │
│  /v1/auth  /v1/players  /v1/runs  /v1/leaderboard           │
│                                                              │
│  Auth middleware (Supabase JWT verification)                 │
└──────┬──────────────────────────────────────────┬────────────┘
       │                                          │
┌──────▼──────┐                         ┌─────────▼──────────┐
│  PostgreSQL │                         │   Redis (Upstash)  │
│  (Prisma)   │                         │   Leaderboard      │
│  - players  │                         │   Sorted Sets      │
│  - runs     │                         │   Session cache    │
│  - events   │                         └────────────────────┘
│  - snapshots│
└─────────────┘
```

**Key principle:** The game engine is a pure TypeScript package with zero React or React Native dependencies. It is the single source of truth for game rules and can be unit-tested in Node.js without a device or simulator.

---

## 5. Client Architecture

### 5.1 Monorepo Structure

```
corpus-quest/
├── apps/
│   ├── mobile/               # Expo React Native app
│   └── api/                  # Fastify backend
├── packages/
│   ├── game-engine/          # Pure TS game logic
│   └── shared/               # Zod schemas, types, constants shared between client & server
└── turbo.json
```

### 5.2 Screen Map

```
(Expo Router file-based routing)

app/
├── (auth)/
│   ├── login.tsx
│   └── register.tsx
├── (game)/
│   ├── _layout.tsx           # HUD wrapper — always renders over child screens
│   ├── dashboard.tsx         # Home: current month summary + action buttons
│   ├── portfolio.tsx         # Fund holdings, NAV chart, lock-in timers
│   ├── invest.tsx            # Fund selector + SIP/lumpsum form
│   ├── events.tsx            # Life events + emergency alerts
│   ├── family.tsx            # Happiness scores per dependent
│   ├── market.tsx            # Market pulse + fund performance
│   └── stats.tsx             # Net worth chart, income vs expense
├── (meta)/
│   ├── results.tsx           # Age-60 score reveal
│   ├── run-history.tsx       # Last 5 runs comparison
│   └── leaderboard.tsx       # Global top scores
└── index.tsx                 # Entry: redirect to auth or dashboard
```

### 5.3 Zustand Store Slices

```typescript
// Slice 1: Active run
interface RunSlice {
  runId: string | null;
  seed: string;
  currentMonth: number;          // 0-455 (month since age 22)
  playerAge: { years: number; months: number };
  cash: number;                  // Available cash in INR paise (integer arithmetic)
  salary: number;                // Monthly salary in paise
  investments: Investment[];
  sips: SIPConfig[];
  dependents: Dependent[];
  pendingEvent: LifeEvent | null;
  marketState: MarketState;
  runStatus: 'active' | 'paused' | 'complete';
}

// Slice 2: UI state
interface UISlice {
  activeTab: TabName;
  toastQueue: Toast[];
  tutorialStep: number | null;
}

// Slice 3: Meta
interface MetaSlice {
  runHistory: RunSummary[];
  leaderboardCache: LeaderboardEntry[];
  authUser: AuthUser | null;
}
```

All monetary values are stored as **integer paise** (1 INR = 100 paise) to avoid floating-point rounding errors across 456 months of compounding.

### 5.4 HUD Component

The HUD is rendered by the `(game)/_layout.tsx` and floats above all game screens using an absolute-positioned overlay. It re-renders only when the Zustand `RunSlice` changes, which happens at most once per turn. It displays: net worth, available cash, age, happiness portraits, upcoming expenses (next 3), and market pulse.

---

## 6. Game Engine

The game engine lives entirely in `packages/game-engine` and is a pure TypeScript state machine. The React Native app calls engine functions and writes the returned state to Zustand. There is no React inside the engine.

### 6.1 Core Types

```typescript
// packages/game-engine/src/types.ts

export type FundType = 'LIQUID' | 'DEBT' | 'HYBRID' | 'LARGE_CAP' | 'SMALL_MID_CAP';
export type InvestmentType = 'SIP' | 'LUMPSUM';
export type MarketRegime = 'BULL' | 'BEAR' | 'VOLATILE' | 'STEADY';

export interface GameState {
  runId: string;
  seed: string;
  month: number;                    // 0-indexed; month 0 = age 22y 0m
  cash: number;                     // paise
  salary: number;                   // paise/month
  portfolio: PortfolioEntry[];      // one entry per fund with units held
  navHistory: NAVHistory;           // fundType -> NAV[] indexed by month
  sips: SIPConfig[];
  dependents: Dependent[];
  committedEMIs: EMI[];
  eventDeck: LifeEventTemplate[];   // shuffled at run start
  triggeredEvents: TriggeredEvent[];
  marketState: MarketState;
  happinessLog: HappinessLog[];     // one entry per month per dependent
  isComplete: boolean;
}
```

### 6.2 Turn Resolution Pipeline

Each call to `resolveTurn(state: GameState): TurnResult` follows this deterministic pipeline:

```
1. INCOME PHASE
   └── credit salary to cash

2. COMMITMENT PHASE
   ├── deduct all active SIPs → purchase units at current NAV
   └── deduct all active EMIs (rent, home loan, car loan)

3. MARKET PHASE
   ├── advance market state machine (check for event triggers)
   └── recompute NAV for each fund using: base_return + event_modifier + noise(seed, month)

4. HAPPINESS PHASE
   ├── apply monthly decay to each dependent
   └── check: any dependent below 20? → set pendingHappinessAlert

5. EVENT PHASE
   ├── check planned event queue for age-window matches
   └── check probability roll for emergency event draw

6. LOCK-IN PHASE
   └── for each investment: if age >= lockInExpiry, mark as withdrawable

7. SNAPSHOT PHASE
   └── compute monthly snapshot (netWorth, portfolioValue, happinessAvg)

8. TURN ADVANCE
   └── increment month; if month == 456, set isComplete = true
```

The function is pure: `(GameState, PlayerAction?) => { nextState: GameState, events: TurnEvent[] }`. All randomness is derived from `seedrandom(seed + month)` so a run can be replayed deterministically.

### 6.3 Investment Ledger

```typescript
interface Investment {
  id: string;
  fundType: FundType;
  type: InvestmentType;
  unitsPurchased: number;         // fixed at time of purchase
  navAtPurchase: number;          // paise per unit
  investedMonth: number;
  lockInExpiryMonth: number;      // investedMonth + 12
  isWithdrawn: boolean;
}

// Current value = unitsPurchased * currentNAV[fundType]
// Unrealised gain = currentValue - (unitsPurchased * navAtPurchase)
```

Withdrawal logic:

```typescript
function withdraw(investment: Investment, state: GameState, partial?: number): WithdrawResult {
  const isLocked = state.month < investment.lockInExpiryMonth;
  const penaltyRate = PENALTY_RATES[investment.fundType];
  const gross = isLocked
    ? (partial ?? investment.unitsPurchased) * currentNAV(state, investment.fundType)
    : (partial ?? investment.unitsPurchased) * currentNAV(state, investment.fundType);
  const penalty = isLocked ? Math.floor(gross * penaltyRate) : 0;
  return { net: gross - penalty, penaltyPaid: penalty };
}
```

### 6.4 Happiness System

```typescript
const DECAY_RATES: Record<DependentType, number> = {
  SELF:    100,   // –1 per month (in paise-units: –100/10000 scale)
  SPOUSE:  150,
  CHILD:   200,
  PARENT:  100,
};

function applyHappinessDecay(dependents: Dependent[]): Dependent[] {
  return dependents.map(d => ({
    ...d,
    happiness: Math.max(0, d.happiness - DECAY_RATES[d.type]),
  }));
}

// Happiness is stored as integer 0–10000 (representing 0.00–100.00)
// Display divides by 100
```

When any dependent falls below `happiness < 2000` (display: 20), the engine sets `pendingHappinessAlert = true`. The UI must present spending options before allowing turn advance.

---

## 7. Market Simulation Engine

### 7.1 NAV Calculation

Each month, NAV for fund `f` is updated:

```
NAV[f][month] = NAV[f][month-1] * (1 + monthlyReturn[f])

monthlyReturn[f] = baseTrend[f] + eventModifier[f] + noise[f]

where:
  baseTrend[f]      = annualBaseReturn[f] / 12   (e.g. Large Cap = 13.5% p.a. / 12)
  eventModifier[f]  = activeMarketEvent.modifier[f] (can be strongly negative)
  noise[f]          = seededRandom(seed, month, f) * noiseAmplitude[f]
```

### 7.2 Market Event State Machine

```typescript
type MarketEventType =
  | 'GREAT_FREEZE'      // –40 to –55% equity, inspired by 2008
  | 'PANIC_BOUNCE'      // –30% crash → full recovery, inspired by COVID
  | 'BULL_EUPHORIA'     // +60–120% small/mid cap over 3 years
  | 'SECTOR_STORM'      // One fund type –30%, others stable
  | 'BANKING_SCARE'     // Debt funds –5 to –15%
  | 'STEADY_GROWTH';    // All funds steady positive

interface MarketEvent {
  type: MarketEventType;
  startMonth: number;
  durationMonths: number;
  modifiers: Record<FundType, number>;  // monthly return modifier
}
```

At run start, a sequence of 4–6 market events is generated from a seeded pool, with minimum spacing between events to ensure not all crises cluster at the start. The sequence is stored in `GameState.marketState.upcomingEvents` and is not visible to the player.

The current regime (BULL / BEAR / VOLATILE / STEADY) is derived from the active event and shown in the HUD Market Pulse indicator.

### 7.3 Fund Profiles

```typescript
const FUND_CONFIG: Record<FundType, FundConfig> = {
  LIQUID:      { baseAnnualReturn: 0.055, noiseAmp: 0.002, penaltyRate: 0.005 },
  DEBT:        { baseAnnualReturn: 0.075, noiseAmp: 0.005, penaltyRate: 0.010 },
  HYBRID:      { baseAnnualReturn: 0.110, noiseAmp: 0.015, penaltyRate: 0.020 },
  LARGE_CAP:   { baseAnnualReturn: 0.135, noiseAmp: 0.025, penaltyRate: 0.030 },
  SMALL_MID_CAP: { baseAnnualReturn: 0.175, noiseAmp: 0.050, penaltyRate: 0.050 },
};
```

---

## 8. Data Models

### 8.1 PostgreSQL Schema (Prisma)

```prisma
// packages/shared/prisma/schema.prisma

model Player {
  id          String   @id @default(cuid())
  supabaseId  String   @unique
  displayName String
  email       String   @unique
  createdAt   DateTime @default(now())
  runs        Run[]
}

model Run {
  id            String      @id @default(cuid())
  playerId      String
  player        Player      @relation(fields: [playerId], references: [id])
  seed          String
  difficulty    Difficulty  @default(NORMAL)
  startedAt     DateTime    @default(now())
  completedAt   DateTime?
  finalMonth    Int?        // 0-455; null if abandoned
  finalNetWorth BigInt?     // paise
  finalScore    Int?        // 0-100
  scoreTier     ScoreTier?
  isComplete    Boolean     @default(false)
  snapshots     Snapshot[]
  events        RunEvent[]
}

model Snapshot {
  id             String   @id @default(cuid())
  runId          String
  run            Run      @relation(fields: [runId], references: [id])
  month          Int
  cash           BigInt   // paise
  portfolioValue BigInt   // paise
  netWorth       BigInt   // paise
  salary         BigInt   // paise/month
  happinessAvg   Int      // 0-10000
  stateBlob      Json     // full GameState serialised — for run resume across devices
  createdAt      DateTime @default(now())

  @@index([runId, month])
  @@unique([runId, month])
}

model RunEvent {
  id          String        @id @default(cuid())
  runId       String
  run         Run           @relation(fields: [runId], references: [id])
  month       Int
  eventType   String        // e.g. "MARRIAGE", "MEDICAL_EMERGENCY"
  impact      Json          // { cash: -500000, happiness: { SPOUSE: +2000 } }
  resolved    Boolean       @default(false)
}

enum Difficulty {
  NORMAL
  HARD
}

enum ScoreTier {
  S A B C D
}
```

**Design note:** `stateBlob` stores the full serialised `GameState` JSON on each snapshot. This is the resume payload. It trades storage for simplicity — no complex state reconstruction from event log. For a mobile game, run state is small (< 50 KB) and 456 snapshots per run ≈ 23 MB worst case per player. In practice most runs won't snapshot every turn — see sync strategy below.

### 8.2 Redis Data Structures

```
# Global leaderboard (sorted by final score descending)
ZADD leaderboard:global {finalScore} "{playerId}:{runId}"

# Friends leaderboard (per player)
ZADD leaderboard:friends:{playerId} {finalScore} "{friendId}:{runId}"

# Leaderboard entry detail (hash)
HSET lb:entry:{playerId}:{runId}
  displayName  "Kush"
  netWorth     "45000000"     # paise
  scoreTier    "A"
  completedAt  "2026-05-08T..."
```

---

## 9. Backend API Design

All endpoints require a `Bearer {supabase_jwt}` Authorization header. Validation via Zod schemas in `packages/shared`.

### 9.1 Auth

Supabase Auth handles registration, login, and token refresh entirely on the client. The API server only verifies the JWT.

### 9.2 REST Endpoints

#### Players

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/players/me` | Return authenticated player profile |
| PATCH | `/v1/players/me` | Update display name / avatar cosmetic |

#### Runs

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/runs` | Start a new run; server returns `runId` and `seed` |
| GET | `/v1/runs/:runId` | Fetch latest snapshot for run resume |
| PUT | `/v1/runs/:runId/snapshot` | Upsert a monthly snapshot (auto-sync) |
| POST | `/v1/runs/:runId/complete` | Mark run complete; submit final score for leaderboard |
| GET | `/v1/players/me/runs` | List last 10 runs with summaries |

#### Leaderboard

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/leaderboard/global?limit=50&offset=0` | Top global scores |
| GET | `/v1/leaderboard/me` | Authenticated player's rank + surrounding entries |

### 9.3 Key Request/Response Shapes

```typescript
// POST /v1/runs — response
interface StartRunResponse {
  runId: string;
  seed: string;            // server-generated; client uses this to init RNG
  difficulty: 'NORMAL' | 'HARD';
  createdAt: string;
}

// PUT /v1/runs/:runId/snapshot — request body
interface SnapshotPayload {
  month: number;
  cash: string;            // BigInt sent as string
  portfolioValue: string;
  netWorth: string;
  salary: string;
  happinessAvg: number;
  stateBlob: object;       // Full GameState — used for cross-device resume
}

// POST /v1/runs/:runId/complete — request body
interface CompleteRunPayload {
  finalMonth: number;
  finalNetWorth: string;
  happinessLegacy: number;  // 0–10000 average over all months
  finalScore: number;       // computed client-side; server cross-checks
  scoreTier: 'S' | 'A' | 'B' | 'C' | 'D';
}
```

### 9.4 Score Validation

On run completion, the server performs a lightweight sanity check:

1. `finalScore` must be within ±2 points of server-computed score using `finalNetWorth` and `happinessLegacy`.
2. `finalNetWorth` must be ≥ 0 and ≤ `MAX_PLAUSIBLE_NET_WORTH` (₹50 Cr = 5,000,000,000 paise).
3. Run duration (`completedAt - startedAt`) must be ≥ 10 minutes (catches instant-complete exploits).

Failed validation rejects the leaderboard submission but still saves the run as complete.

---

## 10. Offline-First & Sync Strategy

Corpus Quest must be fully playable with no internet connection. The sync strategy follows a **local-first, cloud-backup** model.

### 10.1 Local State (MMKV)

```
mmkv:
  active_run_id          → string
  run:{runId}:state      → JSON serialised GameState (updated every turn)
  run:{runId}:dirty      → boolean (needs sync)
  run_history            → RunSummary[] (last 10)
  auth_session           → Supabase session JSON
```

Every call to `resolveTurn()` immediately persists the new `GameState` to MMKV before returning. This gives crash recovery at zero latency — the game never loses more than one turn.

### 10.2 Cloud Sync Schedule

| Trigger | Action |
|---------|--------|
| Run start | POST `/v1/runs` to register run and get server `runId` + `seed` |
| Every 12 turns (1 in-game year) | PUT `/v1/runs/:runId/snapshot` in background |
| App backgrounded | PUT snapshot if dirty |
| Run completed | POST `/v1/runs/:runId/complete` |
| App foregrounded (if dirty flag set) | Retry any failed sync |

If the device is offline, sync attempts are queued in MMKV and retried with exponential back-off when connectivity is restored.

### 10.3 Cross-Device Resume

When a player logs in on a new device:

1. Client calls GET `/v1/players/me/runs` — finds the in-progress `runId`.
2. Client calls GET `/v1/runs/:runId` — receives the latest `stateBlob`.
3. Client deserialises `stateBlob` into `GameState` and writes to MMKV.
4. Game resumes from the last synced month. Worst case: 12 months of turns are lost (one sync window), which the player must replay.

---

## 11. Leaderboard System

### 11.1 Write Path

```
Client
  └─ POST /v1/runs/:runId/complete
       └─ API validates score
            └─ Prisma: UPDATE run SET isComplete=true, finalScore=...
            └─ Redis: ZADD leaderboard:global {score} "{playerId}:{runId}"
                      HSET lb:entry:{playerId}:{runId} {...}
```

### 11.2 Read Path

```
Client (TanStack Query, staleTime: 5 minutes)
  └─ GET /v1/leaderboard/global?limit=50
       └─ API: Redis ZREVRANGE leaderboard:global 0 49 WITHSCORES
            └─ Enrich with HGETALL lb:entry:{} for display data
            └─ Return sorted list
```

Leaderboard reads are served entirely from Redis — no PostgreSQL hit. The leaderboard is eventually consistent; a player's run appears within seconds of completion.

### 11.3 Personal Rank

```
GET /v1/leaderboard/me
  └─ Redis ZREVRANK leaderboard:global "{playerId}:{runId}"
  └─ ZREVRANGE around that rank ±5 for context entries
```

---

## 12. Monetisation Architecture

v1 monetisation is cosmetics-only (avatar frames, HUD themes, character outfits). No gameplay impact.

### 12.1 Purchase Flow

```
Player selects cosmetic
  └─ App opens platform payment sheet (StoreKit 2 / Google Play Billing)
       └─ On success: receipt sent to POST /v1/purchases/verify
            └─ API validates receipt with Apple/Google server-to-server
            └─ Prisma: INSERT purchase; UPDATE player.ownedCosmetics
            └─ Client: TanStack Query invalidates player profile cache
```

### 12.2 Implementation

Use **React Native Purchases (RevenueCat SDK)** — TypeScript bindings, handles receipt validation and entitlement management across both platforms. RevenueCat webhooks update the database asynchronously for durability.

### 12.3 Non-Consumable Rules

All cosmetics are non-consumable; they persist across devices and run resets. Cosmetic ownership is server-authoritative (stored in PostgreSQL), not device-local.

---

## 13. Scale & Reliability

### 13.1 Load Estimation

Assumptions for Year 1:

| Metric | Estimate |
|--------|----------|
| DAU | 10,000 |
| Run completions/day | 2,000 |
| Snapshot writes/day | 2,000 × 38 = 76,000 |
| Leaderboard reads/day | 50,000 |
| Peak RPS | ~30 |

This is well within a single Railway instance (Node.js handles ~1,000 RPS at low complexity). Scale becomes relevant only after 100K DAU.

### 13.2 Scaling Strategy

| Tier | DAU | Action |
|------|-----|--------|
| v1 | < 50K | Single Railway instance + managed Postgres + Upstash Redis |
| v1.5 | 50K–200K | Add read replica for Postgres; increase Railway instance size |
| v2 | 200K+ | Horizontally scale API behind a load balancer; partition leaderboard by cohort |

The game engine runs entirely on-device — the server is not in the gameplay critical path. This means even if the API is down, players can continue playing uninterrupted.

### 13.3 Error Handling

```typescript
// All API calls are wrapped with TanStack Query
// Retry logic:
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 3, retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000) },
  },
});

// Game engine errors are caught at the turn resolution boundary:
try {
  const result = resolveTurn(state, action);
  persistState(result.nextState);
  dispatch(result);
} catch (err) {
  // Log to error tracker (Sentry RN)
  // Restore last known good state from MMKV
  // Show user a "Something went wrong — your progress is safe" toast
}
```

### 13.4 Monitoring & Alerting

| Tool | Purpose |
|------|---------|
| **Sentry** (React Native + Node.js) | Crash reporting, error tracking on both client and server |
| **Railway Metrics** | CPU, memory, request volume for API |
| **Upstash Redis Console** | Leaderboard key sizes, command counts |
| **Expo Insights** | App store ratings, crash-free sessions |

Alert thresholds: API error rate > 1% for 5 minutes → PagerDuty / email alert.

---

## 14. Trade-off Analysis

| Decision | Alternative Considered | Why This Choice | Risk |
|----------|------------------------|-----------------|------|
| **Client-side game engine** | Server-authoritative engine | No round-trips during play; offline support; simpler infra | Leaderboard scores are self-reported; mitigated by server sanity check |
| **Zustand over Redux** | Redux Toolkit | Lower boilerplate; fine for single-player game state; easier onboarding for small team | Less ecosystem tooling (Redux DevTools); acceptable for this complexity level |
| **MMKV over AsyncStorage** | AsyncStorage (default Expo) | 10× faster reads/writes critical for 456 turn autosave; synchronous API simplifies turn loop | Requires native module; Expo managed workflow handles this via config plugin |
| **PostgreSQL over DynamoDB** | DynamoDB / MongoDB | Relational model fits run/player/event structure; Prisma DX is superior for TS team; free tier on Railway | Less horizontal write scale; not a concern at target DAU |
| **Snapshot + stateBlob over event sourcing** | Event sourcing (store every action, replay state) | Far simpler to implement and debug; snapshot is self-contained | Storage is larger; no ability to replay exact run from scratch server-side — acceptable since run seed + client-side replay achieves same result |
| **Expo managed workflow** | Bare React Native | Faster CI/CD; no Xcode/Android Studio config for small team; Expo EAS handles store builds | Occasional delay when new React Native features land; acceptable |
| **Monorepo (Turborepo)** | Separate repos | Shared types between game engine, client, and API are a forcing function for consistency; single CI pipeline | More complex initial setup; pays off quickly |

---

## 15. Future Systems (v2.0)

### 15.1 Multiplayer Cohort Mode

Four players start simultaneously at age 22. They see each other's net worth monthly on a shared leaderboard.

**Design approach:**
- Server creates a `Cohort` record with 4 player slots and a shared `seed` for deterministic market events.
- Each player plays locally on their own device; monthly snapshots are pushed to the server.
- A WebSocket channel (Socket.io room, one per cohort) broadcasts net worth updates to all members after each player's turn.
- No turn synchronisation required — players advance independently; the cohort comparison is purely informational.

```typescript
// packages/api/src/ws/cohort.ts
io.on('connection', (socket) => {
  socket.on('join_cohort', ({ cohortId, playerId }) => {
    socket.join(`cohort:${cohortId}`);
  });
  socket.on('snapshot_update', ({ cohortId, playerId, netWorth, month }) => {
    io.to(`cohort:${cohortId}`).emit('peer_update', { playerId, netWorth, month });
  });
});
```

### 15.2 Historical Scenario Mode

Replace the seeded random market engine with a pre-recorded NAV dataset (2000–2023 Indian equity history). The `MarketSimEngine` is swapped out via a strategy pattern:

```typescript
interface MarketStrategy {
  getMonthlyReturn(fundType: FundType, month: number): number;
}

class SeededRandomMarket implements MarketStrategy { ... }    // v1
class HistoricalDataMarket implements MarketStrategy { ... }  // v2
```

---

## 16. What to Revisit

| Item | When | Why |
|------|------|-----|
| Score validation strictness | After leaderboard manipulation reports emerge | Current sanity check is lightweight; tighten as player counts grow |
| Snapshot storage costs | When DAU > 50K | stateBlob JSON per month per player grows; evaluate compression (msgpack) or pruning to yearly snapshots |
| Market event seeding | Before multiplayer launch | Cohort mode requires all 4 players to share the same market events; seed distribution logic needs to change |
| Redis leaderboard sharding | When global entries > 1M | Single sorted set becomes a hot key; shard by score range or use a leaderboard service |
| Push notification strategy | v1.1 | Re-engagement notifications ("Your SIP just crossed ₹10L!") require server-side event tracking; not built yet |
| Tax and insurance mechanics | v1.1–v1.2 | These GDD features add new transaction types to the Investment Ledger and new event types to the EventDeck; plan for schema migration |
| Accessibility | Before launch | Colour-coded HUD (green/red/orange) needs accessible alternatives for colour-blind players |

---

*Corpus Quest — System Design Document v1.0 — Generated 2026-05-08*
