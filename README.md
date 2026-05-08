# Corpus Quest

A personal-finance simulation game — play age 22 → 60 across a 456-month run.

## Repository layout

```
corpus-quest/
├── apps/
│   ├── mobile/          # Expo React Native app   (scaffolded in Step 3)
│   └── api/             # Fastify backend         (scaffolded in Step 4)
├── packages/
│   ├── game-engine/     # Pure-TS deterministic game engine (Step 2)
│   └── shared/          # Zod schemas, types, constants, money utils
├── turbo.json           # Turborepo task graph
├── pnpm-workspace.yaml  # pnpm workspace declaration
└── tsconfig.base.json   # strict TS settings inherited by all workspaces
```

## Getting started

```bash
pnpm install
pnpm turbo run typecheck
pnpm turbo run lint
pnpm turbo run test
```

`packages/shared` already ships with money helpers (`toINR`, `toPaise`,
`formatINR`) and the runtime Zod schemas for the API contract. Subsequent steps
add the game engine, the Expo app, and the Fastify backend on top of that
foundation.

## Build plan

See [`TODOs.md`](./TODOs.md) for the ordered, validated build plan derived from
[`SystemDesign.md`](./SystemDesign.md).
