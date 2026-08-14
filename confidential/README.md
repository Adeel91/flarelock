# FlareLock Confidential Compute

This directory contains the confidential execution integration used by matched FlareLock Limit orders.

The active implementation is:

`confidential/fcc_service`

Production FCC endpoint:

`https://fcc.shaderift.com`

## Role in the Protocol

FCC sits between completed escrow funding and final onchain settlement.

The current flow is:

**Encrypted intents → Private match → Escrow funding → FCC → Settlement instruction → FlareLock escrow → Atomic settlement**

Both counterparties must fund the escrow before the FCC stage can continue.

## Current Coston2 Environment

The hackathon deployment uses the FCC protocol path with the simulated TEE environment provided for Coston2 development.

It demonstrates the confidential-compute integration and settlement flow, but does not claim hardware-backed confidentiality.

The running FCC stack includes:

- extension TEE service
- external proxy
- Redis

These services run separately from the normal FlareLock API.

## Onchain Proof

The final settlement remains publicly verifiable on Coston2.

Verified settlement transaction:

`0x109455da0ea4ba7c98639eec4f08f8653c4bb3eee61c81590767999d969cba24`

Result:

- 0.01 FXRP to the buyer
- 1.6 C2FLR to the seller

The transaction emitted the final `MatchSettled` event.

## Scope

The current FCC-backed settlement path applies to matched Limit orders.

Market and Stop Loss are private intent products but do not currently enter this settlement pipeline.

For the full execution design, see:

[FlareLock Architecture](../docs/architecture.md)
