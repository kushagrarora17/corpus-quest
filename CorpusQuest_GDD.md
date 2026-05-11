# CORPUS QUEST
## *Grow Rich. Live Well. Retire Legend.*

**Game Design Document — v1.0**
Genre: Simulation RPG | Platform: Mobile (iOS & Android) | Target: 18–35

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Narrative & Character](#2-narrative--character)
3. [Core Game Mechanics](#3-core-game-mechanics)
4. [Market Simulation Engine](#4-market-simulation-engine)
5. [Life Events & Emergency System](#5-life-events--emergency-system)
6. [Scoring & Win Conditions](#6-scoring--win-conditions)
7. [UI / UX Design Principles](#7-ui--ux-design-principles)
8. [Educational Framework](#8-educational-framework)
9. [Future Feature Roadmap](#9-future-feature-roadmap)
10. [In-Game Glossary](#10-in-game-glossary)

---

## 1. Game Overview

### 1.1 Elevator Pitch

Corpus Quest is a mobile Simulation-RPG that puts you in the shoes of a fresh college graduate navigating 38 years of financial life. You earn a salary, face real emergencies, fall in love, raise a family, buy a house, survive market crashes — and at the age of 60, your net worth tells the world how well you played the game of life.

It is not just a game. It is a financial literacy engine disguised as an addictive life simulator.

### 1.2 Core Design Philosophy

- **Learn by feeling — not by reading.** Every financial concept is experienced, not explained.
- **Real pain, real joy.** Bad decisions hurt. Smart decisions compound. Just like life.
- **No two runs are the same.** Randomised life events ensure every playthrough teaches something new.
- **Balance is the lesson.** Maximising net worth at the cost of happiness is a loss in its own way.

### 1.3 Genre & Platform

| Attribute | Detail |
|---|---|
| Genre | Simulation RPG with Roguelike event ordering |
| Platform | Mobile — iOS and Android |
| Target Audience | College students, young professionals (18–35) |
| Session Length | 20–40 mins per run (full game: ~60 mins) |
| Monetisation | Free to play, cosmetic purchases only |
| Setting | Modern India — relatable financial environment |

---

## 2. Narrative & Character

### 2.1 The Story

You are 22. Fresh out of college, armed with a degree, a tiny salary, and a whole life ahead of you. No trust fund. No safety net. Just your wits, your income, and the relentless march of time.

Over 38 in-game years — one month at a time — you will make thousands of financial decisions. Some will compound beautifully. Others will haunt you. At 60, you close your eyes, look at your net worth, and ask: did I play it right?

### 2.2 Life Stages

| Stage | Age Range | Key Events & Themes |
|---|---|---|
| The Hustle | 22–27 | First job, low salary, renting, building emergency fund, early SIP habits |
| The Leap | 28–33 | Marriage, dual income, wedding expenses, first major goals emerge |
| The Weight | 34–40 | Children, EMIs, education planning, promotion or career setback |
| The Grind | 41–49 | Peak earning years, lifestyle inflation risk, portfolio rebalancing |
| The Stretch | 50–59 | Protecting corpus, shifting to low-risk, retirement planning, health costs |
| The Verdict | 60 | Final net worth calculated. Score revealed. Legacy defined. |

### 2.3 Player Character

- Gender-neutral, customisable name and appearance
- Starts at age 22 with a first-job salary (randomised: ₹25,000 – ₹45,000/month)
- Salary grows over time based on performance events and player choices
- Has a happiness score that reflects personal and family wellbeing

---

## 3. Core Game Mechanics

### 3.1 The Monthly Turn

Time moves month by month. Each month, the game:

- Credits salary to available cash
- Deducts committed SIPs automatically
- Deducts planned EMIs (rent, home loan, car loan)
- Updates mutual fund NAVs based on market simulation
- Decays happiness scores for player and dependents
- May trigger a random life event or emergency
- Pauses and prompts the player when action is needed

The game only pauses for player input when: an emergency strikes, a lumpsum investment opportunity arises, a planned expense is due, or a major life event occurs. Routine months flow automatically — just like real life on autopilot.

### 3.2 Investment Mechanics

#### SIP — Systematic Investment Plan (Autopilot)

- Player sets a monthly SIP amount per fund at any time
- Amount is auto-deducted each month — player does not need to act
- Can be paused, increased, or stopped at any time
- Best tool for building long-term wealth with discipline

#### Lumpsum Investment (Manual)

- Player manually invests available cash into a chosen fund
- Used for one-time windfalls: bonuses, inheritances, tax refunds
- Player must decide timing — investing during a market crash is high-reward
- Teaches the risk of timing the market vs time in the market

#### Lock-in & Withdrawal Rules

- Every investment (SIP unit or lumpsum) is locked for **12 months** from date of investment
- Early withdrawal incurs a penalty of **2–5%** of the withdrawal amount (varies by fund type)
- Post lock-in: full or partial withdrawal available anytime
- This mechanic teaches liquidity planning — you cannot rely on locked funds during emergencies

### 3.3 The Mutual Fund Universe

Five fund categories model real-world mutual fund types:

| Fund Type | Risk | Expected Return | Lock-in Penalty | Best For |
|---|---|---|---|---|
| Liquid / Money Market | Very Low | 5–6% p.a. | 0.5% | Emergency buffer, parking cash |
| Debt Fund | Low | 7–8% p.a. | 1% | Short-term goals, stability |
| Hybrid / Balanced Fund | Medium | 10–12% p.a. | 2% | Medium-term goals, first-time investors |
| Large Cap Equity | Medium-High | 12–15% p.a. | 3% | Long-term wealth building |
| Small / Mid Cap Equity | High | 15–22% p.a. | 5% | Aggressive growth, high tolerance for pain |

> Returns are not fixed — they fluctuate every month based on the market simulation engine. The above are long-run average ranges.

### 3.4 The Happiness System

Every person in the player's life has a happiness score from **0 to 100**. Scores decay naturally over time:

| Person | Decay Rate | Mandatory Spend Trigger | Boosted By |
|---|---|---|---|
| Player (Self) | –1 per month | Below 20 | Vacations, hobbies, car upgrade |
| Spouse | –1.5 per month | Below 20 | Anniversary trips, gifts, dining out |
| Child 1 | –2 per month | Below 20 | Toys, school trips, birthday parties |
| Child 2 | –2 per month | Below 20 | Same as Child 1 |
| Ageing Parent (if applicable) | –1 per month | Below 20 | Medical care, visits, comforts |

- When any person's happiness drops **below 20**, the player is **forced** to make a happiness spend before proceeding
- Happiness boosts are temporary — they decay back over time
- Neglecting happiness for too long triggers secondary consequences (see Life Events)
- Maximum happiness is 100. Spends above 80 give diminishing returns

### 3.5 The HUD — Always On Screen

The following information is always visible regardless of what screen the player is on:

| HUD Element | Description |
|---|---|
| Net Worth | Total value: cash + mutual fund portfolio (mark-to-market) |
| Available Cash | Liquid money available to spend or invest right now |
| Current Age | Player's current age in Years and Months |
| Happiness Scores | Mini portrait icons with colour-coded happiness bars for each family member |
| Upcoming Expenses | Next 3 planned expenses with amounts and due dates |
| Market Pulse | Subtle indicator showing current market sentiment: Bull / Bear / Volatile |

---

## 4. Market Simulation Engine

### 4.1 Design Principle

The market is **inspired by real Indian equity market history** — capturing the emotional texture of major events — but is not historically accurate. This ensures the game is educational (players recognise patterns) without being predictable (veterans cannot game the system).

### 4.2 Market Event Archetypes

These events are drawn from a randomised pool and may occur once or multiple times per playthrough:

| Event Name | Inspired By | Market Impact | Duration | Teaching Moment |
|---|---|---|---|---|
| The Great Freeze | 2008 Global Crisis | Equity –40 to –55%, Debt mildly positive | 8–14 months | Asset allocation; panic selling vs holding |
| The Panic Drop & Bounce | COVID-19 2020 | Sharp –30% crash, then full recovery | 4–6 months down, 8–12 recovery | Stay invested; don't exit at the bottom |
| The Bull Euphoria | 2003–2007 Bull Run | Small/mid cap +60 to +120% over 3 years | 24–36 months | Staying in during a bull run compounds massively |
| The Sector Storm | IT crash 2000, infra crash 2008 | One fund type crashes –30%, others stable | 6–10 months | Diversification across fund types |
| The Banking Scare | IL&FS / Yes Bank crisis | Debt funds drop –5 to –15% | 3–6 months | Even 'safe' funds carry risk |
| Steady Growth Phase | 2014–2018 stable run | All funds give steady positive returns | 12–24 months | Compounding works silently in calm markets |

### 4.3 NAV Calculation

- Each fund has a current NAV that updates every in-game month
- NAV changes are driven by: **base trend + event modifier + random noise**
- Player's portfolio value = units held × current NAV
- Unrealised gains/losses are visible but only crystallised on withdrawal

---

## 5. Life Events & Emergency System

### 5.1 Planned Life Events

These events are scheduled roughly in order but with randomised timing within a window:

| Event | Typical Age Window | Financial Impact | Happiness Impact |
|---|---|---|---|
| First salary raise | 23–25 | +₹5,000–₹15,000/month | Player +15 |
| Marriage | 26–30 | Wedding: ₹3–10L one-time. Dual income begins | All +20 |
| First child | 28–33 | Hospital: ₹50K–₹1.5L. Ongoing: ₹8–15K/month | All +25, then child decay begins |
| Buying first home | 30–38 | Down payment 20%, EMI begins | Player +20, Spouse +20 |
| Children's schooling | 33–45 | Fees: ₹1–5L/year per child | Child happiness maintained |
| Parents need support | 40–50 | Medical/care: ₹5–20K/month additional | Player –5 if ignored |
| Children's college | 40–50 | ₹5–25L lump cost | Child +20 if funded well |
| Second child (optional) | 30–35 | Same as first child | All +20 |
| Job loss event | Any | Salary stops for 3–8 months | Player –20 |
| Salary stagnation | Any | No raise for 2–3 years | Player –5 |
| Big promotion | Any | +₹20,000–₹50,000/month | Player +25 |

### 5.2 Random Emergency Events

These events are drawn from a randomised deck each playthrough, ensuring different order and timing every run:

| Emergency | Cash Required | Consequence if Ignored |
|---|---|---|
| Medical emergency (self) | ₹50K – ₹3L | Player happiness –30, may affect job performance |
| Medical emergency (family) | ₹50K – ₹5L | Affected person happiness –40 |
| Car breakdown | ₹20K – ₹80K | Commute disruption, player happiness –10 |
| Home repair | ₹30K – ₹2L | Spouse happiness –20 |
| Job loss | Requires 6-month expense buffer | Forced to break investments with penalty |
| Legal dispute | ₹50K – ₹3L | Player happiness –15 per month unresolved |
| Theft or fraud | ₹20K – ₹1L loss | Cannot be recovered — teaches insurance importance |
| Business opportunity (positive) | Optional ₹1–5L invest | High-risk high-reward side income stream |

> Emergencies that are ignored or underfunded cascade — they worsen over subsequent months, draining happiness and potentially forcing worse financial decisions later.

---

## 6. Scoring & Win Conditions

### 6.1 Final Score

At age 60, the game calculates the player's Final Score based on two components:

| Component | Weight | Description |
|---|---|---|
| Net Worth at 60 | 70% | Total portfolio value + liquid cash at game end |
| Happiness Legacy | 30% | Average happiness score of all family members over the entire run |

> This dual scoring ensures the game cannot be 'won' by pure financial optimisation alone. A player who hoarded every rupee but had a miserable family scores significantly lower than one who balanced wealth and wellbeing.

### 6.2 Score Tiers

| Tier | Score Range | Title |
|---|---|---|
| S | 90–100 | **Corpus Legend** — You cracked the code of money and life. |
| A | 75–89 | **Wealthy & Wise** — Smart choices, rich life. |
| B | 60–74 | **Comfortable Achiever** — Solid run, a few missed opportunities. |
| C | 45–59 | **The Survivor** — You made it, but barely. |
| D | Below 45 | **The Hard Lesson** — Retire and try again. |

### 6.3 Replayability

- Each new run randomises: starting salary, order of emergencies, market event sequence, life event timing
- Players unlock deeper game modes: harder difficulty (lower salary, more emergencies), historical scenario mode
- Leaderboard: compare net worth with friends at age 60
- Run comparison: see your last 5 runs side by side

---

## 7. UI / UX Design Principles

### 7.1 Screen Architecture

- **Home Dashboard** — HUD + current month summary + action buttons
- **Portfolio Screen** — All mutual fund investments, NAV history chart, lock-in timers, SIP status
- **Invest Screen** — Choose fund, choose SIP or lumpsum, enter amount, confirm
- **Life Events Screen** — Upcoming events, pending decisions, emergency alerts
- **Family Screen** — Happiness scores, dependent details, relationship events
- **Market Screen** — Current market pulse, fund performance graph, event news ticker
- **Stats Screen** — Net worth chart over time, income vs expense breakdown, savings rate

### 7.2 Design Language

- Clean, modern mobile UI — inspired by fintech apps (Zerodha, Groww aesthetic)
- Colour coding: Green for growth, Red for loss, Blue for information, Orange for warnings
- Happiness displayed as expressive character portrait icons — not just numbers
- Market events shown as in-game news headlines — adds narrative texture
- Fund performance shown as a live line chart with event markers on the timeline

### 7.3 Onboarding

- First run includes a guided tutorial playthrough of ages 22–24
- Tutorial introduces each mechanic naturally as it first appears
- No mandatory reading — all concepts demonstrated through play
- 'Explain This' button available on every screen for curious players

---

## 8. Educational Framework

### 8.1 Concepts Taught Through Gameplay

| Financial Concept | How the Game Teaches It |
|---|---|
| Power of compounding | Early SIPs visibly dwarf late ones on the net worth chart by age 60 |
| Rupee cost averaging | SIPs during market crashes reduce average cost — player sees this in portfolio |
| Asset allocation | Players who go all-in on equity get crushed during The Great Freeze |
| Emergency fund | Players without liquid funds break locked investments with painful penalties |
| Liquidity vs returns | Liquid fund vs equity fund tradeoff is felt during every emergency |
| Inflation | Expense costs rise every year — idle cash loses purchasing power visibly |
| Goal-based investing | Upcoming expense panel forces players to plan investments around real goals |
| Rebalancing | Players who don't shift to safer funds before age 55 risk a late-game crash wipe |
| Lifestyle inflation | Happiness spending competes directly with investment capacity |
| Insurance value | Theft/fraud event and medical costs teach why insurance matters |

---

## 9. Future Feature Roadmap

| Feature | Phase | Description |
|---|---|---|
| Insurance Mechanic | v1.1 | Term life, health, and vehicle insurance as optional monthly expenses. No insurance = catastrophic loss events. |
| Tax Planning | v1.2 | ELSS tax saving, 80C limits, TDS on withdrawals — adds real-world Indian tax layer |
| Side Income Streams | v1.2 | Freelance gigs, rental income, dividend stocks as optional income diversification |
| Multiplayer Cohort Mode | v2.0 | Start with 4 friends at age 22, compare portfolios monthly, compete at 60 |
| Historical Scenario Mode | v2.0 | Play through actual 2000–2023 Indian market history with your own decisions |
| AI Financial Advisor | v2.1 | In-game advisor gives personalised tips based on your portfolio and life stage |
| Retirement Phase | v2.1 | Post-60 gameplay: managing withdrawal rate, healthcare, legacy planning |

---

## 10. In-Game Glossary

These terms are available to players via the in-game **'Explain This'** feature:

| Term | Plain English Definition |
|---|---|
| SIP | A fixed monthly auto-investment — like a gym membership for your money |
| Lumpsum | A one-time big investment — all in at once |
| NAV | The current price of one unit of a mutual fund |
| Lock-in | A period during which you cannot withdraw without paying a penalty |
| Corpus | Your total accumulated investment wealth |
| Compounding | Earning returns on your returns — the snowball effect of investing early |
| Asset Allocation | How you split your money between risky and safe investments |
| Rebalancing | Adjusting your portfolio mix back to your target — especially before big life events |
| Bear Market | When markets are falling and everything looks scary |
| Bull Market | When markets are rising and everyone feels like a genius |

---

*Your corpus. Your quest.*

**Corpus Quest — Game Design Document v1.0**
