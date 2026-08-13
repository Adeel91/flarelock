"use client";

import { useQuery } from "@tanstack/react-query";

import { getConfidentialComputeStatus } from "@/lib/api";

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="m5 12 4 4L19 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function shorten(value: string, start = 8, end = 6) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function ProofState({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4 border-b border-slate-100 px-4 last:border-b-0">
      <span className="text-[12px] font-medium text-slate-600">{label}</span>

      <span
        className={
          verified
            ? "flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"
            : "flex items-center gap-1.5 text-[11px] font-semibold text-amber-700"
        }
      >
        {verified && <CheckIcon />}
        {verified ? "Verified" : "Pending"}
      </span>
    </div>
  );
}

export function ConfidentialComputeProof() {
  const query = useQuery({
    queryKey: ["confidential-compute-status"],
    queryFn: getConfidentialComputeStatus,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  if (query.isLoading) {
    return (
      <section className="border-t border-slate-200">
        <div className="px-6 py-6">
          <p className="text-[13px] font-semibold">Confidential compute proof</p>

          <p className="mt-2 text-[12px] text-slate-500">
            Verifying FCC and Coston2 settlement state...
          </p>
        </div>
      </section>
    );
  }

  if (query.isError || !query.data) {
    return (
      <section className="border-t border-slate-200">
        <div className="px-6 py-6">
          <p className="text-[13px] font-semibold">Confidential compute proof</p>

          <p className="mt-2 text-[12px] text-rose-600">
            Live FCC verification is currently unavailable.
          </p>
        </div>
      </section>
    );
  }

  const data = query.data;

  const explorerBase = "https://coston2-explorer.flare.network/tx";

  return (
    <section className="border-t border-slate-200">
      <div className="flex flex-col gap-5 px-6 py-6 xl:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[13px] font-semibold">Confidential compute proof</p>

              <span
                className={
                  data.verified
                    ? "flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                    : "rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
                }
              >
                {data.verified && <CheckIcon />}
                {data.verified ? "Verified live" : "Verification incomplete"}
              </span>
            </div>

            <p className="mt-2 max-w-[680px] text-[12px] leading-5 text-slate-500">
              FlareLock sends encrypted execution data through the real FCC protocol path on
              Coston2. The result is signed by the configured TEE identity and verified by the
              deployed FlareLock escrow before settlement.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Environment
            </p>

            <p className="mt-1 text-[12px] font-semibold">Simulated TEE</p>

            <p className="mt-1 text-[10px] text-slate-500">Not hardware backed</p>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-[14px] border border-slate-200 lg:grid-cols-4">
          {[
            ["01", "Seal", "Encrypted TEE payload"],
            ["02", "FCC", "VERIFY_AND_MATCH"],
            ["03", "Verify", "TEE signed ABI result"],
            ["04", "Settle", "Consumed on Coston2"],
          ].map(([number, title, detail], index) => (
            <div
              className={
                index < 3
                  ? "relative border-b border-slate-200 bg-white px-4 py-5 lg:border-b-0 lg:border-r"
                  : "relative bg-white px-4 py-5"
              }
              key={number}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#c10f45]">{number}</span>

                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckIcon />
                </span>
              </div>

              <p className="mt-4 text-[13px] font-semibold">{title}</p>

              <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-[11px] font-semibold">Onchain verification</p>
            </div>

            <ProofState
              label="InstructionSender deployed"
              verified={data.contracts.instructionSender.hasCode}
            />

            <ProofState label="Escrow deployed" verified={data.contracts.escrow.hasCode} />

            <ProofState
              label="Trusted TEE matches escrow"
              verified={data.contracts.escrow.trustedTeeMatches}
            />

            <ProofState
              label="FXRP token matches escrow"
              verified={data.contracts.escrow.fxrpMatches}
            />

            <ProofState
              label="Match commitment consumed"
              verified={data.proof.onchainVerification.commitmentConsumed}
            />

            <ProofState
              label="Buyer deposit settled"
              verified={data.proof.onchainVerification.buyerDepositSettled}
            />

            <ProofState
              label="Seller deposit settled"
              verified={data.proof.onchainVerification.sellerDepositSettled}
            />
          </div>

          <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <p className="text-[11px] font-semibold">Execution evidence</p>
            </div>

            <div className="grid gap-0">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  FCC instruction
                </p>

                <p
                  className="mt-2 font-mono text-[11px] text-slate-700"
                  title={data.proof.instructionId}
                >
                  {shorten(data.proof.instructionId)}
                </p>
              </div>

              <div className="border-b border-slate-100 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      FCC transaction
                    </p>

                    <p
                      className="mt-2 font-mono text-[11px] text-slate-700"
                      title={data.proof.fccTransaction.hash}
                    >
                      {shorten(data.proof.fccTransaction.hash)}
                    </p>
                  </div>

                  <a
                    className="text-[11px] font-semibold text-[#c10f45] hover:underline"
                    href={`${explorerBase}/${data.proof.fccTransaction.hash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>

              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Match commitment
                </p>

                <p
                  className="mt-2 font-mono text-[11px] text-slate-700"
                  title={data.proof.result.matchCommitment}
                >
                  {shorten(data.proof.result.matchCommitment)}
                </p>
              </div>

              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Settlement transaction
                    </p>

                    <p
                      className="mt-2 font-mono text-[11px] text-slate-700"
                      title={data.proof.settlementTransaction.hash}
                    >
                      {shorten(data.proof.settlementTransaction.hash)}
                    </p>
                  </div>

                  <a
                    className="text-[11px] font-semibold text-[#c10f45] hover:underline"
                    href={`${explorerBase}/${data.proof.settlementTransaction.hash}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11px] leading-5 text-amber-900">
            <span className="font-semibold">Confidential compute mode:</span> this Coston2
            deployment uses the real FCC protocol flow with a simulated TEE. It does not claim
            hardware backed confidentiality.
          </p>
        </div>
      </div>
    </section>
  );
}
