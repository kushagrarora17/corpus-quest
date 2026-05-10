import { z } from 'zod';

import { MONTHS_PER_RUN } from './constants.js';

/**
 * Runtime validators for API payloads. Inferring the TS types from these
 * schemas keeps the wire contract and the type system in lock-step.
 */

// ---------- Enums ----------

export const DifficultySchema = z.enum(['NORMAL', 'HARD']);
export const ScoreTierSchema = z.enum(['S', 'A', 'B', 'C', 'D']);
export const FundTypeSchema = z.enum(['LIQUID', 'DEBT', 'HYBRID', 'LARGE_CAP', 'SMALL_MID_CAP']);
export const DependentTypeSchema = z.enum(['SELF', 'SPOUSE', 'CHILD', 'PARENT']);

// ---------- Helpers ----------

/** A non-negative decimal string used to carry BigInt monetary values over JSON. */
const PaiseString = z
  .string()
  .regex(/^\d+$/, 'Expected a non-negative decimal integer string (paise)');

const MonthIndex = z.number().int().min(0).max(MONTHS_PER_RUN);

// ---------- Run start ----------

export const StartRunResponseSchema = z.object({
  runId: z.string().min(1),
  seed: z.string().min(1),
  difficulty: DifficultySchema,
  createdAt: z.string().datetime(),
});
export type StartRunResponse = z.infer<typeof StartRunResponseSchema>;

// ---------- Snapshot upsert ----------

export const SnapshotPayloadSchema = z.object({
  month: MonthIndex,
  cash: PaiseString,
  portfolioValue: PaiseString,
  netWorth: PaiseString,
  salary: PaiseString,
  happinessAvg: z.number().int().min(0).max(10000),
  stateBlob: z.record(z.string(), z.unknown()),
});
export type SnapshotPayload = z.infer<typeof SnapshotPayloadSchema>;

// ---------- Run completion ----------

export const CompleteRunPayloadSchema = z.object({
  finalMonth: MonthIndex,
  finalNetWorth: PaiseString,
  happinessLegacy: z.number().int().min(0).max(10000),
  finalScore: z.number().int().min(0).max(100),
  scoreTier: ScoreTierSchema,
});
export type CompleteRunPayload = z.infer<typeof CompleteRunPayloadSchema>;

// ---------- Player profile ----------

export const PlayerProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).max(40),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;

export const UpdatePlayerProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
});
export type UpdatePlayerProfile = z.infer<typeof UpdatePlayerProfileSchema>;
