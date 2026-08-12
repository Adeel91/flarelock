"use client";

import { useState } from "react";

import { MatchEscrowFunding } from "@/components/intent/match-escrow-funding";
import { rememberActiveExecution } from "@/components/intent/private-execution-activity";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  buildRecoverMatchMessage,
  type RecoveredPrivateMatch,
  recoverLatestPrivateMatch,
} from "@/lib/api";

function shorten(value: string, start = 10, end = 8) {
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

export function ResumePrivateExecution() {
  const wallet = useFlareWallet();

  const [match, setMatch] = useState<RecoveredPrivateMatch | null>(null);

  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    if (!wallet.address) {
      setError("Connect your wallet first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (wallet.chainId !== 114) {
        await wallet.switchToCoston2();
      }

      const message = buildRecoverMatchMessage(wallet.address);

      const signature = await wallet.signMessage(message);

      const recovered = await recoverLatestPrivateMatch(wallet.address, signature);

      setMatch(recovered);

      if (recovered) {
        rememberActiveExecution(recovered.matchId);
      }

      setChecked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to resume private execution.");
    } finally {
      setLoading(false);
    }
  }

  if (match) {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-200 bg-white">
        <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                Private execution recovered
              </p>

              <p className="mt-1 text-[16px] font-semibold text-[#0a0b0d]">
                Matched {match.role} intent
              </p>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700">
              Matched
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="rounded-xl bg-[#f7f8fa] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Match</p>

            <p className="mt-2 font-mono text-[10px] text-slate-700" title={match.matchId}>
              {shorten(match.matchId)}
            </p>
          </div>

          <div className="rounded-xl bg-[#f7f8fa] p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Commitment
            </p>

            <p className="mt-2 font-mono text-[10px] text-slate-700" title={match.matchCommitment}>
              {shorten(match.matchCommitment)}
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] leading-5 text-slate-500">
            This execution was recovered from encrypted backend state after the page reload.
          </p>

          <MatchEscrowFunding matchId={match.matchId} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7f8fa] p-5">
      <p className="text-[12px] font-semibold text-[#0a0b0d]">Have an active private execution?</p>

      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        Resume your latest matched intent after a browser refresh.
      </p>

      <button
        className="mt-4 h-11 w-full rounded-[10px] border border-slate-300 bg-white text-[12px] font-semibold text-[#0a0b0d] transition hover:bg-slate-50 disabled:opacity-50"
        disabled={loading}
        onClick={() => void resume()}
        type="button"
      >
        {loading ? "Confirm in MetaMask…" : "Resume private execution"}
      </button>

      {checked && !match && (
        <p className="mt-3 text-[11px] text-slate-500">
          No matched private execution was found for this wallet.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
