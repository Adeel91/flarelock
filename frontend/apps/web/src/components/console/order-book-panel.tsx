"use client";

import { useQuery } from "@tanstack/react-query";
import { getSealedIntents, type SealedIntent } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenHash(hash: string) {
  return `${hash.slice(0, 12)}...${hash.slice(-10)}`;
}

function formatRemainingTime(expiresAt: string) {
  const remaining = Date.parse(expiresAt) - Date.now();

  if (remaining <= 0) {
    return "Expiring";
  }

  const seconds = Math.ceil(remaining / 1_000);

  if (seconds < 60) {
    return `${seconds}s remaining`;
  }

  const minutes = Math.ceil(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m remaining`;
  }

  return `${Math.ceil(minutes / 60)}h remaining`;
}

function formatOrderType(orderType: SealedIntent["orderType"]) {
  return orderType === "stop" ? "Stop loss" : orderType;
}

function IntentRow({ intent }: { intent: SealedIntent }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-t border-slate-100 py-5">
      <div className="min-w-0 overflow-hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold capitalize text-slate-950">
            {formatOrderType(intent.orderType)} intent
          </p>

          <span className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            Private
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {shortenAddress(intent.owner)} · {intent.market}
        </p>

        <p className="mono mt-2 truncate text-xs text-slate-400" title={intent.intentHash}>
          {shortenHash(intent.intentHash)}
        </p>

        <p className="mt-2 text-xs font-medium text-slate-400">
          {formatRemainingTime(intent.expiresAt)}
        </p>
      </div>

      <span className="shrink-0 justify-self-end whitespace-nowrap rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold capitalize text-[#c91549]">
        {intent.matchStatus}
      </span>
    </div>
  );
}

export function OrderBookPanel() {
  const intents = useQuery({
    queryKey: ["sealed-intents"],
    queryFn: getSealedIntents,
    refetchInterval: 5_000,
  });

  const rows = intents.data ?? [];

  return (
    <aside className="clean-card self-start overflow-hidden rounded-[28px] p-7">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Private intent pool
          </p>

          <h2 className="mt-2 truncate text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
            FXRP/C2FLR
          </h2>
        </div>

        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          Encrypted
        </span>
      </div>

      <div className="mt-7">
        {intents.isLoading && (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-600">Loading active encrypted intents…</p>
          </div>
        )}

        {intents.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">
              Private intent service is unavailable.
            </p>
          </div>
        )}

        {!intents.isLoading && !intents.isError && rows.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-950">No active private intents</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Signed intents appear here while waiting for private matching. Unmatched market IOC
              intents expire automatically.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 pb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <p>Intent</p>
              <p className="text-right">Status</p>
            </div>

            {rows.map((intent) => (
              <IntentRow intent={intent} key={intent.intentId} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50 p-5">
        <p className="text-base font-semibold text-slate-950">Trade details hidden</p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Side, amount, trigger price, expected output, and wallet signature are encrypted and are
          not returned by the public API.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Active</p>

          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {rows.length}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            Matching
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-950">Not connected</p>
        </div>
      </div>
    </aside>
  );
}
