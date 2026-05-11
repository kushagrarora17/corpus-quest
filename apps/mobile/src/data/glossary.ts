/**
 * All 10 glossary terms from GDD §10. Each screen can pass a `defaultTerm` to
 * open the bottom-sheet at the most relevant entry.
 */

export interface GlossaryEntry {
  term: string;
  shortDef: string;
  example: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  SIP: {
    term: 'SIP',
    shortDef: 'A fixed monthly auto-investment — like a gym membership for your money.',
    example: 'Set ₹5,000/month into a Large Cap fund and the engine deducts it every month.',
  },
  LUMPSUM: {
    term: 'Lumpsum',
    shortDef: 'A one-time big investment — all in at once.',
    example: 'Got a ₹50,000 bonus? Drop it into a fund manually for a single-shot deposit.',
  },
  NAV: {
    term: 'NAV',
    shortDef: 'The current price of one unit of a mutual fund.',
    example: 'A ₹10,000 investment at NAV ₹100 buys you 100 units.',
  },
  LOCK_IN: {
    term: 'Lock-in',
    shortDef: 'A period during which you cannot withdraw without paying a penalty.',
    example: 'In Corpus Quest, every investment is locked for 12 months from purchase.',
  },
  CORPUS: {
    term: 'Corpus',
    shortDef: 'Your total accumulated investment wealth.',
    example: 'Your corpus at age 60 plus your cash is your final net worth.',
  },
  COMPOUNDING: {
    term: 'Compounding',
    shortDef: 'Earning returns on your returns — the snowball effect of investing early.',
    example: '₹5,000/month from age 22 compounds far more than the same SIP started at age 35.',
  },
  ASSET_ALLOCATION: {
    term: 'Asset Allocation',
    shortDef: 'How you split your money between risky and safe investments.',
    example: '60% equity + 40% debt is one classic allocation.',
  },
  REBALANCING: {
    term: 'Rebalancing',
    shortDef: 'Adjusting your portfolio mix back to your target — especially before big life events.',
    example: 'After 35, shift gradually from Small Cap to Large Cap and Debt to protect gains.',
  },
  BEAR_MARKET: {
    term: 'Bear Market',
    shortDef: 'When markets are falling and everything looks scary.',
    example: 'The Great Freeze is a classic bear event — equity drops 40–55%.',
  },
  BULL_MARKET: {
    term: 'Bull Market',
    shortDef: 'When markets are rising and everyone feels like a genius.',
    example: 'Stay invested through Bull Euphoria — small/mid cap can double in three years.',
  },
};

/** Default glossary term per screen for the "Explain This" button. */
export const SCREEN_DEFAULT_TERM: Record<string, keyof typeof GLOSSARY> = {
  dashboard: 'COMPOUNDING',
  portfolio: 'NAV',
  invest: 'SIP',
  events: 'LOCK_IN',
  family: 'CORPUS',
  market: 'BULL_MARKET',
  stats: 'ASSET_ALLOCATION',
};
