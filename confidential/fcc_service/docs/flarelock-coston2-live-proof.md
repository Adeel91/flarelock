# FlareLock FCC — Live Coston2 Proof

FlareLock's confidential matching engine has been deployed and exercised end-to-end through Flare Confidential Compute on Coston2.

## Deployment

- Network: Coston2
- Chain ID: 114
- FCC mode: Simulated TEE
- FCC endpoint: https://fcc.shaderift.com
- Extension ID: `0x0000000000000000000000000000000000000000000000000000000000010239`
- InstructionSender: `0xaeB8E980C87E58093E02d8d45698Fc9ECBb42cea`
- Registered TEE: `0x4bD12e875446Aa32dA40C766C935030de74db80B`
- TEE machine status: `2` (`PRODUCTION`)

The TEE was registered through the FCC `rRap` flow, including fresh attestation request, FTDC availability verification, and production promotion.

## Live confidential match

A Version 1 confidential-match envelope containing two wallet-signed FlareLock Version 2 private intents was encrypted specifically for the registered TEE and submitted through the Coston2 InstructionSender.

- Encrypted payload: 2437 bytes
- Instruction ID: `0xf35c609bfbd1e878cc325fcd96dbbc2b1fd6e7195ddf15a996fac6d0e2c65b06`
- Coston2 transaction: `0x5ce73edb300166340c6952de606ceaaab3af69ef85292ab969d9db757b02257f`
- Match commitment: `0xe6e6f2f6434917707b1961a5e62a9209740e11d429eaaba3b7305a21069e7f42`

Result:

- Base amount raw: `1000000` = 1 FXRP
- Quote amount raw: `175000000000000000000` = 175 C2FLR
- Execution price E18: `175000000000000000000` = 175 C2FLR / FXRP
- Market: `C2FLR/FXRP`

The live test completed with:

`FlareLock confidential match test passed.`

## Confidential flow

1. Client constructs wallet-signed private intents.
2. Client resolves the registered FCC TEE and its public encryption key.
3. Private order payload is encrypted for that TEE.
4. Ciphertext is submitted on Coston2 through `FlareLockInstructionSender`.
5. The FCC TEE decrypts the payload internally.
6. It reconstructs and verifies the signed intent messages.
7. It performs deterministic private matching.
8. Only the minimal match result and commitment are returned.

No plaintext private order payload is submitted as public Coston2 calldata.

## Security scope

This deployment uses `SIMULATED_TEE=true` on Coston2. It demonstrates the FCC protocol and confidential execution path but must not be described as hardware-backed TEE isolation.

Escrow deposit authorization and settlement of the resulting confidential match are separate concerns and are addressed by the following settlement patch.
