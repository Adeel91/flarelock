# FlareLock

## Private execution. Verifiable settlement.

Onchain markets usually make a trade visible before it is finished.

A limit price, position size, direction or stop condition can reveal exactly what a trader intends to do.

FlareLock asks a different question:

> **What if the intent could remain private, while the result stayed completely verifiable?**

That is the core idea behind FlareLock.

---

## The Product

FlareLock is a private FXRP execution protocol built on Flare.

A trader can create:

- Market intents
- Limit intents
- Stop Loss intents

All three are sealed as private orders.

Limit orders go further.

Compatible Buy and Sell Limit intents can privately match, fund an onchain escrow, pass through the FCC execution path and settle atomically on Coston2.

The final transfer is public.

The trading intent does not need to be.

---

## Why This Matters

Privacy and verifiability are often treated as opposites.

FlareLock deliberately separates them.

Before settlement, the protocol protects information that can reveal trading behaviour.

After settlement, the important facts remain auditable:

- who received the assets
- how much settled
- whether escrow was funded
- whether settlement completed
- which transaction finalized the trade

This creates a practical middle ground between a fully public order book and an opaque centralized execution system.

---

## Why FXRP?

FXRP makes the product more interesting than a private EVM swap.

It represents XRP liquidity inside Flare and gives FlareLock an interoperable asset that can move through several different products.

Inside one application, FXRP can be used for:

**private execution → atomic settlement → Firelight → FAssets redemption**

So the project is not only about confidentiality.

It is also about what happens to an interoperable asset before and after a trade.

---

## Why Flare?

Flare provides the primitives needed for the whole design.

**FTSOv2** gives FlareLock live market intelligence.

**FAssets** provides interoperable XRP liquidity as FXRP.

**Flare Confidential Compute** gives the matched execution path a confidential-compute layer.

**Flare smart contracts** make final settlement independently verifiable.

**Firelight** gives FXRP a productive lifecycle when it is not being traded.

FlareLock is useful because these pieces are composed together rather than shown as unrelated integrations.

---

## What Is Already Working

The prototype currently includes:

- encrypted Market, Limit and Stop Loss intents
- wallet-authenticated private activity
- private Limit matching
- protected market depth
- FTSOv2 pricing
- buyer and seller escrow funding
- FCC execution integration
- atomic FXRP / C2FLR settlement
- readable settlement receipts
- Firelight deposits and exit state
- FAssets redemption workflow
- production web and API deployments

A real matched Limit settlement has already completed on Coston2.

Transaction:

`0x109455da0ea4ba7c98639eec4f08f8653c4bb3eee61c81590767999d969cba24`

Result:

- 0.01 FXRP → buyer
- 1.6 C2FLR → seller

---

## Hackathon Fit

### Interoperable Asset Products

FlareLock gives FXRP a complete product lifecycle rather than using it only as a token balance.

Trading, settlement, Firelight and FAssets redemption all exist in the same application.

### Confidential Compute Apps

FCC is connected to the actual matched Limit execution flow.

It sits between completed escrow funding and final settlement authorization.

The current Coston2 deployment uses the hackathon simulated TEE environment and does not claim hardware-backed confidentiality.

---

## Where It Can Go Next

The immediate next step is to extend the same settlement architecture beyond Limit orders.

That includes:

- Market execution
- triggered Stop Loss execution
- additional FAsset markets
- durable encrypted persistence
- stronger session authentication
- richer cancellation and recovery
- production security review

The long-term idea is a reusable private execution layer for interoperable assets on Flare.

---

## Links

**Live app**

`https://flarelock.shaderift.com`

**API**

`https://api.shaderift.com`

**Network**

Flare Coston2

---

> **Hide the intent. Prove the settlement.**
