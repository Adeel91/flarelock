"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { buildEscrowPlanMessage, type MatchExecution, settlePrivateExecution } from "@/lib/api";

type SettlementStep = "idle" | "authorizing" | "submitting" | "complete";

type Props = {
  execution: MatchExecution;
  onSettled: () => Promise<void> | void;
};

function stepLabel(step: SettlementStep) {
  if (step === "authorizing") {
    return "Authorizing settlement…";
  }

  if (step === "submitting") {
    return "Submitting to FCC and settling escrow…";
  }

  if (step === "complete") {
    return "Settled";
  }

  return "Run confidential settlement";
}

export function ConfidentialSettlementAction({ execution, onSettled }: Props) {
  const wallet = useFlareWallet();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<SettlementStep>("idle");

  const [error, setError] = useState<string | null>(null);

  if (execution.stage !== "funded") {
    return null;
  }

  const busy = step === "authorizing" || step === "submitting";

  async function runSettlement() {
    if (!wallet.address) {
      setError("Connect the wallet that participated in this execution.");
      return;
    }

    if (!wallet.signMessage) {
      setError("This wallet cannot sign the settlement authorization.");
      return;
    }

    setError(null);

    try {
      setStep("authorizing");

      const message = buildEscrowPlanMessage(execution.matchId, wallet.address);

      const signature = await wallet.signMessage(message);

      setStep("submitting");

      await settlePrivateExecution(execution.matchId, wallet.address, signature);

      setStep("complete");

      await onSettled();
      await queryClient.invalidateQueries({
        queryKey: ["private-activity"],
      });
    } catch (cause) {
      setStep("idle");

      setError(
        cause instanceof Error ? cause.message : "Unable to complete confidential settlement.",
      );
    }
  }

  return (
    <section className="mt-4 border-t border-slate-200 pt-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <div className="text-[12px] font-semibold text-slate-900">
            Both escrow deposits confirmed
          </div>

          <div className="mt-1 text-[11px] leading-5 text-slate-500">
            This execution is ready for confidential FCC verification and atomic settlement. The
            buyer receives FXRP and the seller receives C2FLR automatically if settlement succeeds.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
              Buyer escrow
            </div>

            <div className="mt-1 text-[11px] font-semibold text-emerald-700">Confirmed ✓</div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-400">
              Seller escrow
            </div>

            <div className="mt-1 text-[11px] font-semibold text-emerald-700">Confirmed ✓</div>
          </div>
        </div>

        <button
          type="button"
          disabled={busy || step === "complete"}
          onClick={() => {
            void runSettlement();
          }}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#e62058] px-4 text-[12px] font-semibold text-white transition hover:bg-[#cf184d] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {stepLabel(step)}
        </button>

        {busy ? (
          <div className="text-[10px] leading-5 text-slate-500">
            FCC encrypts and verifies the signed private intents, then the operator locks both
            deposits and performs the atomic onchain settlement. This can take a little while.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-5 text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
