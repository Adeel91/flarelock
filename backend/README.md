# FlareLock Backend

The FlareLock backend handles private intent storage, matching, execution state, Flare integrations and settlement orchestration.

The active backend application is:

`backend/apps/api`

It is built with NestJS, Fastify, TypeScript and Viem.

Production API:

`https://api.shaderift.com`

## Current Responsibilities

The API handles:

- Coston2 chain state
- FTSOv2 pricing
- encrypted Market, Limit and Stop Loss intents
- wallet-authenticated private activity
- private Limit matching
- Stop Loss evaluation
- escrow funding plans
- onchain funding verification
- FCC orchestration
- execution and settlement state
- FAssets / FXRP state
- redemption state
- Firelight vault and withdrawal state

## Private Runtime State

Private intent data is encrypted before persistence.

The current prototype stores runtime data under:

`backend/apps/api/data`

Local development and production keep separate runtime stores.

Private encryption keys and runtime data are excluded from Git.

## Order Model

FlareLock currently supports:

- Market
- Limit
- Stop Loss

All three are private intents.

Only matched Limit orders currently enter the complete settlement path:

**Match → Escrow → Funding → FCC → Settlement → Receipt**

Market and Stop Loss remain private intent products in the current prototype.

## Future Backend Structure

These folders are intentionally reserved for future separation:

- `apps/worker`
- `packages/database`
- `packages/matching_engine`
- `packages/alert_engine`
- `packages/shared`

They are documentation-only today and are not active services.

For the complete system design, see:

- [Main README](../README.md)
- [Architecture](../docs/architecture.md)
