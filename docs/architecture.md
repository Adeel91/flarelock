# FlareLock Architecture

This document describes the technical design of FlareLock: runtime boundaries, private intent storage, execution state, FCC orchestration and onchain settlement.

It is intentionally implementation-focused and complements the higher-level project README.

---

## System Components

FlareLock runs across three independent layers.

### Web

`frontend/apps/web`

Responsibilities:

- wallet connection and Coston2 network handling
- Market, Limit and Stop Loss order creation
- private activity authentication
- Orders and Executions UI
- escrow funding transactions
- settlement receipts
- FXRP balances
- Firelight interaction
- FAssets redemption UI

Production:

`https://flarelock.shaderift.com`

### Application API

`backend/apps/api`

Built with NestJS, Fastify and Viem.

Responsibilities:

- Coston2 state
- FTSOv2 pricing
- encrypted intent persistence
- private activity authorization
- Limit matching
- Stop Loss evaluation
- escrow-plan generation
- deposit verification
- FCC orchestration
- execution-state assembly
- FAssets state
- Firelight state

Production:

`https://api.shaderift.com`

### Confidential Compute

`confidential/fcc_service`

The FCC environment runs separately from the application API.

Current services include:

- FCC proxy
- simulated TEE environment
- Redis

Production FCC endpoint:

`https://fcc.shaderift.com`

The Coston2 prototype uses the FCC protocol flow with the hackathon simulated TEE environment. It does not claim hardware-backed confidentiality.

---

## Private Intent Model

FlareLock separates public settlement from private order intent.

An order begins as a private payload containing fields such as:

- wallet
- side
- order type
- amount
- price or trigger condition
- market

The payload is sealed before persistence.

Current runtime files include:

- `sealed-intents.json`
- `matches.json`
- `stop-triggers.json`
- `.intent-key`

The encryption key and runtime order state are not committed to Git.

Production and local development maintain separate runtime stores.

---

## Order Type Boundaries

### Market

Market orders create sealed immediate-execution intents.

They remain visible under authenticated Orders.

They do not currently enter the matched FCC escrow path.

### Stop Loss

Stop Loss orders create sealed conditional intents.

The stop service evaluates trigger conditions separately from the settlement service.

They do not currently enter the matched FCC escrow path.

### Limit

Limit orders implement the full settlement lifecycle.

The settlement service requires both matched intents to be Limit orders before continuing into the escrow and FCC path.

---

## Limit Execution State

A successful Limit execution progresses through several distinct states.

1. Intent sealed
2. Compatible counterparty found
3. Match created
4. Escrow plan generated
5. Buyer deposit verified
6. Seller deposit verified
7. Execution fully funded
8. FCC settlement instruction produced
9. Escrow settlement submitted
10. Settlement transaction confirmed
11. Receipt assembled

The frontend separates general private Orders from matched Executions so only relevant orders expose funding and settlement controls.

---

## Escrow Funding

The deployed escrow coordinates both sides of the trade.

Buyer obligation:

`C2FLR → FlareLockEscrow`

Seller obligation:

`FXRP → FlareLockEscrow`

The API checks onchain deposit evidence before settlement is allowed.

The execution cannot proceed through the final settlement path until both funding requirements are satisfied.

---

## FCC Settlement Path

Once an execution is fully funded:

1. the API prepares the confidential settlement request
2. the request is sent to the FCC proxy
3. the FCC environment processes the instruction
4. the configured TEE identity participates in the FCC execution flow
5. the resulting settlement instruction reaches the FlareLock escrow flow
6. the escrow completes the atomic exchange

Current configured TEE identity:

`0x427AdD02E981D73146Aa16173ec1d44e003429Bf`

Instruction Sender:

`0xaeB8E980C87E58093E02d8d45698Fc9ECBb42cea`

---

## Atomic Settlement

FlareLockEscrow:

`0x71A27096640D3D24545D505B5F830ea3d94355d6`

FXRP:

`0x0b6A3645c240605887a5532109323A3E12273dc7`

The final exchange is atomic:

- seller FXRP is released to the buyer
- buyer C2FLR is released to the seller

A successful settlement emits `MatchSettled`.

Verified transaction:

`0x109455da0ea4ba7c98639eec4f08f8653c4bb3eee61c81590767999d969cba24`

Verified result:

- 0.01 FXRP → buyer
- 1.6 C2FLR → seller

---

## Wallet Authentication

Private activity is not exposed by wallet address alone.

The connected wallet signs an authentication message.

The signature is then used when requesting private Orders and Executions.

The frontend caches the signature for the wallet so ordinary navigation does not repeatedly trigger MetaMask.

Explicit disconnect clears FlareLock session state.

---

## Frontend Update Model

The final frontend avoids continuous private-activity polling.

Updates come from:

- initial authenticated fetch
- immediate local cache insertion after order creation
- scoped query invalidation
- funding / settlement actions
- explicit Check for updates

This keeps network traffic predictable while still allowing users to refresh execution state manually.

---

## FTSOv2

FTSOv2 provides the live market-reference layer.

It is used for:

- FXRP / C2FLR market pricing
- XRP / USD reference
- FLR / USD reference
- conversion quotes
- trade context
- risk and execution UI

---

## Firelight

Firelight is separate from trading settlement.

The application reads and manages:

- available FXRP
- vault shares
- position value
- vault assets
- current period
- exit requests
- pending exits
- claimable withdrawals

This gives FXRP a lifecycle outside active execution.

---

## FAssets Redemption

The redemption flow uses FXRP / FTestXRP state from the Coston2 FAssets environment.

The UI allows the user to:

- inspect redemption eligibility
- select an amount
- provide an XRP Ledger Testnet destination
- create the FAssets redemption request
- inspect redemption transaction state

This belongs to the interoperability layer rather than the private matching engine.

---

## Deployment Topology

| Component | Runtime |
| --- | --- |
| Frontend | Vercel |
| API | AWS EC2 |
| HTTPS | Caddy |
| FCC | Docker |
| Network | Flare Coston2 |
| Chain ID | 114 |

The frontend, normal API and FCC environment are intentionally separable deployment units.

---

## Prototype Limitations

The current implementation is a hackathon prototype.

Production hardening would include:

- durable encrypted database storage
- nonce-based server sessions
- formal contract auditing
- stronger execution cancellation / recovery
- additional FAsset markets
- settlement support beyond Limit orders
