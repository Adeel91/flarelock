"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { MatchEscrowFunding } from "@/components/intent/match-escrow-funding";
import { rememberActiveExecution } from "@/components/intent/private-execution-activity";
import { primaryActionClass } from "@/components/ui/action-styles";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  buildPrivateIntentMessage,
  type ConvertQuote,
  type IntentOrder,
  type MatchRunResult,
  runPrivateMatching,
  type SealedIntent,
  sealPrivateIntent,
} from "@/lib/api";

type Props = {
  quote: ConvertQuote;
  order: IntentOrder;
};

type ExecutionStage =
  | "idle"
  | "signing"
  | "submitting"
  | "sealed"
  | "matching"
  | "matched"
  | "searching"
  | "error";

function shorten(value: string, start = 10, end = 8) {
  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

type PendingIntentReference = {
  intentId: string;
  createdAt: string;
};

function pendingIntentStorageKey(side: "buy" | "sell"): string {
  return `flarelock:pending:C2FLR-FXRP:${side}`;
}

function rememberPendingIntent(side: "buy" | "sell", intent: SealedIntent) {
  window.localStorage.setItem(
    pendingIntentStorageKey(side),
    JSON.stringify({
      intentId: intent.intentId,
      createdAt: intent.createdAt,
    } satisfies PendingIntentReference),
  );
}

function readPendingCounterparty(side: "buy" | "sell"): PendingIntentReference | null {
  const counterpartySide = side === "buy" ? "sell" : "buy";

  const raw = window.localStorage.getItem(pendingIntentStorageKey(counterpartySide));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PendingIntentReference>;

    if (typeof parsed.intentId !== "string" || typeof parsed.createdAt !== "string") {
      return null;
    }

    return {
      intentId: parsed.intentId,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

function clearMatchedPendingIntents() {
  window.localStorage.removeItem(pendingIntentStorageKey("buy"));

  window.localStorage.removeItem(pendingIntentStorageKey("sell"));
}

function StatusDot({ active, complete }: { active?: boolean; complete?: boolean }) {
  return (
    <span
      className={
        complete
          ? "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700"
          : active
            ? "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#fff0f4] text-[11px] font-bold text-[#e62058]"
            : "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-400"
      }
    >
      {complete ? "✓" : active ? "•" : "·"}
    </span>
  );
}

export function SealIntentButton({ quote, order }: Props) {
  const wallet = useFlareWallet();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<ExecutionStage>("idle");
  const [sealedIntent, setSealedIntent] = useState<SealedIntent | null>(null);
  const [matchResult, setMatchResult] = useState<MatchRunResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const matchedEntry =
    sealedIntent && matchResult
      ? (matchResult.matches.find(
          (match) =>
            match.buyIntentId === sealedIntent.intentId ||
            match.sellIntentId === sealedIntent.intentId,
        ) ?? null)
      : null;

  async function handleSealIntent() {
    if (!wallet.address) {
      setStage("error");
      setErrorMessage("Connect your wallet before signing.");
      return;
    }

    setStage("signing");
    setErrorMessage(null);
    setMatchResult(null);

    try {
      const unsignedIntent = {
        address: wallet.address,
        quote: {
          quoteId: quote.quoteId,
          quoteHash: quote.quoteHash,
          side: quote.side,
          fromAsset: quote.fromAsset,
          toAsset: quote.toAsset,
          inputAmount: quote.inputAmount,
          receiveAmount: quote.receiveAmount,
          expiresAt: quote.expiresAt,
        },
        order,
      };

      const message = buildPrivateIntentMessage(unsignedIntent);
      const signature = await wallet.signMessage(message);

      setStage("submitting");

      const result = await sealPrivateIntent({
        ...unsignedIntent,
        signature,
      });

      setSealedIntent(result);

      queryClient.setQueryData(
        ["private-activity", wallet.address],
        (current: import("@/lib/api").WalletPrivateActivity | undefined) => {
          if (!current) {
            return current;
          }

          const exists = current.intents.some((intent) => intent.intentId === result.intentId);

          if (exists) {
            return current;
          }

          return {
            ...current,
            intents: [
              {
                intentId: result.intentId,
                intentHash: result.intentHash,
                market: result.market,
                orderType: result.orderType,
                status: result.status,
                matchStatus: result.matchStatus,
                settlementStatus: result.settlementStatus,
                createdAt: result.createdAt,
                expiresAt: result.expiresAt,
              },
              ...current.intents,
            ],
          };
        },
      );

      void queryClient.invalidateQueries({
        queryKey: ["private-order-book"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["private-activity"],
      });

      const counterparty = readPendingCounterparty(quote.side);

      rememberPendingIntent(quote.side, result);

      setStage("matching");

      const matchResult = counterparty
        ? await runPrivateMatching(result.intentId, counterparty.intentId)
        : await runPrivateMatching(result.intentId);

      setMatchResult(matchResult);

      const matchForIntent = matchResult.matches.find(
        (match) => match.buyIntentId === result.intentId || match.sellIntentId === result.intentId,
      );

      if (matchForIntent) {
        clearMatchedPendingIntents();
        rememberActiveExecution(matchForIntent.matchId);
        setStage("matched");
      } else {
        setStage("searching");
      }
    } catch (error) {
      setStage("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to seal private intent.");
    }
  }

  if (sealedIntent) {
    const matched = Boolean(matchedEntry);

    if (order.type !== "limit") {
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-[#fafbfc] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e62058]">
                  Private order
                </p>

                <p className="mt-1 text-[17px] font-semibold capitalize tracking-[-0.025em] text-[#0a0b0d]">
                  {order.type === "stop" ? "Stop loss order sealed" : "Market order sealed"}
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                Encrypted
              </span>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="flex gap-3">
              <StatusDot complete />

              <div>
                <p className="text-[12px] font-semibold text-[#0a0b0d]">Private intent submitted</p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  The order is signed and stored privately. FCC escrow settlement is currently
                  available for Limit orders only.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-500">
                {matched
                  ? "A compatible private order was found."
                  : order.type === "market"
                    ? "Market orders use IOC and expire if they cannot match immediately."
                    : "The stop loss intent remains private until its conditions are eligible."}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 px-3 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Intent ID
                </p>

                <p className="mt-1 font-mono text-[9px] text-slate-600">
                  {shorten(sealedIntent.intentId)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 px-3 py-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Order type
                </p>

                <p className="mt-1 text-[11px] font-semibold capitalize text-slate-700">
                  {order.type === "stop" ? "Stop loss" : order.type}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-[#fafbfc] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#e62058]">
                Private execution
              </p>

              <p className="mt-1 text-[17px] font-semibold tracking-[-0.025em] text-[#0a0b0d]">
                Intent sealed
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
              Encrypted
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          <div className="flex gap-3 px-5 py-4">
            <StatusDot complete />

            <div>
              <p className="text-[12px] font-semibold text-[#0a0b0d]">Wallet signature verified</p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                The execution intent was signed by the connected wallet.
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-5 py-4">
            <StatusDot complete />

            <div>
              <p className="text-[12px] font-semibold text-[#0a0b0d]">Private payload encrypted</p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Order conditions are stored encrypted instead of being exposed through the public
                intent response.
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-5 py-4">
            <StatusDot active={stage === "matching" || stage === "searching"} complete={matched} />

            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[#0a0b0d]">Confidential matching</p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {stage === "matching"
                  ? "Scanning encrypted FlareLock intents for a compatible counterparty."
                  : matched
                    ? "A compatible encrypted counterparty intent was matched."
                    : stage === "searching"
                      ? "No compatible counterparty is available yet. The sealed intent remains private and searchable."
                      : "Run the private matcher to look for a compatible encrypted intent."}
              </p>
            </div>
          </div>

          <div className="flex gap-3 px-5 py-4">
            <StatusDot active={matched} complete={false} />

            <div>
              <p className="text-[12px] font-semibold text-[#0a0b0d]">
                FCC verification and settlement
              </p>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {matched
                  ? "This match is ready for the FCC verification and onchain settlement stage."
                  : "FCC execution begins only after a compatible private match exists."}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f7f8fa] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Intent ID
              </p>

              <p
                className="mt-2 font-mono text-[10px] text-slate-700"
                title={sealedIntent.intentId}
              >
                {shorten(sealedIntent.intentId)}
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f8fa] p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Intent hash
              </p>

              <p
                className="mt-2 font-mono text-[10px] text-slate-700"
                title={sealedIntent.intentHash}
              >
                {shorten(sealedIntent.intentHash)}
              </p>
            </div>
          </div>

          {matchedEntry && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                    Private match created
                  </p>

                  <p
                    className="mt-2 font-mono text-[10px] text-emerald-900"
                    title={matchedEntry.matchCommitment}
                  >
                    {shorten(matchedEntry.matchCommitment)}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                  Matched
                </span>
              </div>
            </div>
          )}

          {!matched && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-[#f7f8fa] p-4">
              <p className="text-[11px] font-semibold text-[#0a0b0d]">
                {stage === "matching"
                  ? "Matching automatically…"
                  : "Waiting for the opposite private intent"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                FlareLock automatically matches the exact fresh buyer and seller pair when both
                sides are sealed.
              </p>
            </div>
          )}

          {matched && (
            <div className="mt-4 rounded-xl border border-[#e62058]/20 bg-[#fff6f8] p-4">
              <p className="text-[11px] font-semibold text-[#b71645]">FCC path available</p>

              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                The market page below independently verifies the deployed FCC InstructionSender,
                trusted TEE, signed result path and completed Coston2 settlement proof.
              </p>
            </div>
          )}

          {matchedEntry && <MatchEscrowFunding matchId={matchedEntry.matchId} />}

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-medium text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        className={`${primaryActionClass} w-full`}
        disabled={stage === "signing" || stage === "submitting"}
        onClick={() => void handleSealIntent()}
        type="button"
      >
        {stage === "signing"
          ? "Confirm in MetaMask"
          : stage === "submitting"
            ? "Encrypting intent…"
            : `Seal ${order.type} intent`}
      </button>

      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        Your wallet signs the order first. FlareLock then stores only the encrypted execution
        payload for private matching.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-medium text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
