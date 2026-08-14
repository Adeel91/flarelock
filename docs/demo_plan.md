# FlareLock Demo Walkthrough

This walkthrough shows how FlareLock moves from private order creation to verifiable settlement, and how the same FXRP asset can continue into Firelight or FAssets redemption.

The demo focuses on the live Coston2 deployment and the protocol components that are already integrated end to end.

---

## 1. Account and Market Context

The demo begins from the FlareLock account workspace.

The connected wallet can inspect:

- FXRP balance
- the live FXRP / C2FLR market
- Firelight access
- FAssets redemption
- current Coston2 network state

The FXRP / C2FLR market uses FTSOv2-based reference data rather than locally fabricated market values.

---

## 2. Private Order Creation

FlareLock supports three private order types:

### Market

Creates a sealed private intent using current market context.

### Stop Loss

Creates a sealed conditional intent evaluated by the backend stop service.

### Limit

Creates a sealed price-constrained intent that can continue into private matching and settlement.

All order types appear under authenticated private activity rather than as public plaintext orders.

---

## 3. Private Limit Matching

Compatible Buy and Sell Limit intents can be matched privately by the backend.

Once matched, the order moves from the general **Orders** view into **Executions**.

An Execution exposes the settlement lifecycle without exposing unrelated private order data.

The matched trade then proceeds through:

**Match → Escrow Plan → Funding → FCC → Settlement → Receipt**

---

## 4. Escrow Funding

Both counterparties fund the deployed FlareLock escrow.

- buyer deposits C2FLR
- seller deposits FXRP

FlareLock verifies both deposits onchain before the settlement path can continue.

This prevents an execution from moving forward before both sides have actually funded their obligations.

---

## 5. Confidential Execution

After funding is complete, the matched Limit execution is processed through the FCC integration.

The current Coston2 deployment uses:

- FCC proxy
- configured TEE identity
- hackathon simulated TEE environment
- settlement instruction flow

The FCC step sits between completed funding and final settlement.

The project does not claim hardware-backed confidentiality for the current testnet environment.

---

## 6. Atomic Settlement

The FlareLock escrow completes both sides of the trade atomically:

- seller FXRP is transferred to the buyer
- buyer C2FLR is transferred to the seller

The final transaction remains publicly verifiable on Coston2.

A previously completed live settlement is available at:

`0x109455da0ea4ba7c98639eec4f08f8653c4bb3eee61c81590767999d969cba24`

That transaction settled:

- 0.01 FXRP to the buyer
- 1.6 C2FLR to the seller

and emitted the final `MatchSettled` event.

---

## 7. Settlement Receipt

FlareLock turns the settlement result into a readable execution receipt.

The receipt exposes:

- execution status
- buyer and seller
- settled FXRP amount
- settled C2FLR amount
- transaction hash
- onchain verification link

This is the core design principle of FlareLock:

> **execution intent can remain private while settlement proof remains public.**

---

## 8. Firelight Lifecycle

The demo also shows what can happen to FXRP after execution.

Through the Firelight integration, the application exposes:

- available FXRP
- deposits
- vault shares
- position value
- current period
- exit requests
- pending withdrawals
- claimable state

This gives FXRP a productive lifecycle inside the same application instead of treating trading as the end of the user journey.

---

## 9. FAssets Redemption

FlareLock also exposes the FXRP redemption path.

The application lets the user inspect:

- FXRP / FTestXRP balance
- redemption minimum
- eligibility
- AssetManager route
- FAsset token
- XRP Ledger Testnet destination

This demonstrates the interoperable side of the product: FXRP can move into private execution on Flare and later continue through the FAssets redemption lifecycle toward XRP Ledger Testnet.

---

## What the Demo Proves

The live prototype demonstrates that FlareLock can combine:

- FTSOv2 market data
- encrypted private intents
- wallet-authenticated private activity
- private Limit matching
- escrow funding
- FCC execution
- atomic FXRP / C2FLR settlement
- settlement receipts
- Firelight FXRP lifecycle
- FAssets redemption

inside one Coston2 application.

The result is not just a trading UI. It is a complete private execution and interoperable asset lifecycle built around FXRP.
