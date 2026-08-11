# FlareLock FCC — Live Coston2 Proof

FlareLock has been exercised end-to-end on Coston2 through Flare Confidential Compute (FCC), including confidential matching and atomic on-chain settlement between real Coston2 escrow deposits.

## Current deployment

- Network: Coston2
- Chain ID: 114
- FCC mode: Simulated TEE
- FCC endpoint: https://fcc.shaderift.com
- Extension ID: `0x0000000000000000000000000000000000000000000000000000000000010239`
- InstructionSender: `0xaeB8E980C87E58093E02d8d45698Fc9ECBb42cea`
- Registered TEE: `0xea5699F5FFEF2855873b962eCCa65ec5aE235dA0`
- FlareLockEscrow: `0x71A27096640D3D24545D505B5F830ea3d94355d6`
- FTestXRP (FXRP): `0x0b6A3645c240605887a5532109323A3E12273dc7`
- Escrow deployment transaction: `0x0591d197c17cabf5e3e4e4a47a160d0cc207d1c2e01d72896037a2410eea52d3`
- Escrow deployment block: `33914200`

The escrow is configured to trust the registered FCC TEE above for signed FlareLock settlement results.

## Historical confidential matching proof

Before settlement integration, FlareLock successfully exercised the confidential matching path independently.

- Previous registered TEE: `0x4bD12e875446Aa32dA40C766C935030de74db80B`
- Instruction ID: `0xf35c609bfbd1e878cc325fcd96dbbc2b1fd6e7195ddf15a996fac6d0e2c65b06`
- Coston2 transaction: `0x5ce73edb300166340c6952de606ceaaab3af69ef85292ab969d9db757b02257f`
- Match commitment: `0xe6e6f2f6434917707b1961a5e62a9209740e11d429eaaba3b7305a21069e7f42`
- Base amount: 1 FXRP
- Quote amount: 175 C2FLR
- Execution price: 175 C2FLR / FXRP

That run demonstrated encrypted FCC execution and private matching. It did not perform escrow settlement.

## Live confidential settlement proof

The final settlement proof used two different Coston2 wallets and real escrowed assets.

### Participants

- Buyer: `0xd52275365c73431D4541d3b35209DA8DfaD0A48a`
- Seller: `0x84221990aCcb66abB70588cbdB0Cd45271ED3CcB`

### Wallet-signed intents

- Buyer intent hash: `0xde7ed97deb449df35ccd9d1c534cfa41bdc64d5ab266fbf41c634319e8685347`
- Seller intent hash: `0x30e0609651417a22912ad38d1e5e84d473a96de0939cd8b101d827b73b4e8efe`

### Escrow deposits

- Buyer deposit ID: `0x8fcf9acd43ed03ed2776c6634ffb7ebaac8fe9d28c0a67cdbcc1b8fe3ed7ab25`
- Buyer escrowed: 17.5 C2FLR
- Seller deposit ID: `0x06f5481f8485d248c9bff9bf9659effe29cd82ddd4c276b10c28b257d9dfac91`
- Seller escrowed: 0.1 FXRP

Both deposits were subsequently locked to the exact match commitment returned by FCC.

### FCC execution

The two private intents were encrypted for the registered TEE and submitted through the Coston2 InstructionSender.

- FCC instruction ID: `0xa55c839231d207d3b835c221a68d01b2238d154fc4c616cb00db7f92f1bce0e2`
- Coston2 instruction transaction: `0x8567f724951f9a3cf049db26f0e735e432b17d062881687b0d34afdac43561c1`
- Submission tag: `threshold`
- Result status: `1`
- Match commitment: `0x5b53b69a53ec85ad1fae12153a4435a1d7bf8a9e55f25c01532913bf8d4308ed`
- Base amount raw: `100000` = 0.1 FXRP
- Quote amount raw: `17500000000000000000` = 17.5 C2FLR
- Execution price E18: `175000000000000000000` = 175 C2FLR / FXRP

FCC returned a signed ABI-encoded settlement payload. The escrow reconstructed the FCC `ActionResult` signing hash and verified the TEE signature against its configured trusted TEE.

### Deposit locking

- Buyer lock transaction: `0x56830726105857b36b8420067c1f22147e54047452c18f5769f5c682425e071c`
- Seller lock transaction: `0xe8e2417f2af90f672c015821fcd964f4d6ac16200d5618c8980e3b6a3deba9e3`

Both deposits were locked to:

`0x5b53b69a53ec85ad1fae12153a4435a1d7bf8a9e55f25c01532913bf8d4308ed`

### Atomic settlement

Final settlement transaction:

`0x989805af6f3653d350ad1d4d8a121a021cda0cce6bf88257accc9b63f8fc7457`

The transaction completed successfully and atomically:

- 0.1 FXRP moved from escrow to the buyer.
- 17.5 C2FLR moved from escrow to the seller.
- The match commitment was marked consumed.
- Both deposits were marked `Settled`.
- Both deposit amounts were reduced to zero.

### Before settlement

- Buyer FXRP: 10 FXRP
- Seller C2FLR: 98.1279453125 C2FLR
- Escrow FXRP: 0.1 FXRP
- Escrow C2FLR: 17.5 C2FLR

### After settlement

- Buyer FXRP: 10.1 FXRP
- Seller C2FLR: 115.6279453125 C2FLR
- Escrow FXRP: 0
- Escrow C2FLR: 0
- Match commitment consumed: `true`
- Buyer deposit state: `4` (`Settled`), amount `0`
- Seller deposit state: `4` (`Settled`), amount `0`

Because settlement was relayed by the escrow operator, the seller did not pay settlement gas. The exact 17.5 C2FLR increase therefore appears in the seller balance.

## Confidential settlement flow

1. Buyer and seller construct and sign private intents locally.
2. Their assets are deposited into the FlareLock Coston2 escrow.
3. The private intent envelope is encrypted for the registered FCC TEE.
4. Ciphertext is submitted through `FlareLockInstructionSender`.
5. The TEE decrypts and validates both wallet-signed intents.
6. The TEE performs deterministic private matching.
7. The TEE returns an ABI-encoded settlement payload and signs the FCC action result.
8. The escrow deposits are locked to the returned match commitment.
9. `settleSignedMatch` reconstructs the FCC signing payload and recovers the TEE signer.
10. The escrow verifies the signed intent hashes, deposit IDs, assets, amounts, commitment, status, and FCC submission tag.
11. FXRP and C2FLR are transferred atomically.
12. The commitment is consumed and both deposits become `Settled`.

No plaintext private order payload is submitted as public Coston2 calldata.

## Security scope

This Coston2 deployment uses `SIMULATED_TEE=true`.

It demonstrates the real Flare Confidential Compute protocol path, registered TEE identity, encrypted request processing, signed FCC result verification, and Coston2 settlement integration. It must not be described as hardware-backed confidential isolation.

The settlement contract trusts an owner-configured registered TEE address. The relayer does not choose the settlement amounts, deposit IDs, intent hashes, price, or match commitment: those values are contained in the TEE-signed settlement payload.

The current settlement implementation intentionally requires whole-deposit settlement rather than partial fills.
