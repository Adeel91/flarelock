"use client";

import { useQuery } from "@tanstack/react-query";
import { getSealedIntents, type SealedIntent } from "@/lib/api";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function IntentRow({ intent }: { intent: SealedIntent }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-slate-100 py-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-950">Encrypted intent</p>

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
            Private
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {shortenAddress(intent.owner)} · {intent.market}
        </p>

        <p className="mono mt-2 truncate text-xs text-slate-400">{intent.intentHash}</p>
      </div>

      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
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
    <aside className="clean-card rounded-[2rem] p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Private intent book
          </p>

          <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
            FXRP/C2FLR
          </h2>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Encrypted
        </span>
      </div>

      <div className="mt-7">
        {intents.isLoading && (
          <div className="rounded-[1.5rem] bg-slate-50 p-6">
            <p className="text-base text-slate-600">Loading encrypted intents…</p>
          </div>
        )}

        {intents.isError && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6">
            <p className="text-base font-medium text-red-700">
              Private intent service is unavailable.
            </p>
          </div>
        )}

        {!intents.isLoading && !intents.isError && rows.length === 0 && (
          <div className="rounded-[1.5rem] bg-slate-50 p-6">
            <p className="text-lg font-medium text-slate-950">No encrypted intents yet</p>

            <p className="mt-2 text-base leading-7 text-slate-600">
              Create and sign the first private execution intent.
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div>
            <div className="grid grid-cols-[1fr_auto] gap-4 pb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              <p>Intent</p>
              <p>Status</p>
            </div>

            {rows.map((intent) => (
              <IntentRow intent={intent} key={intent.intentId} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-medium text-slate-950">Trade details hidden</p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Side, amount, expected output, and wallet signature are encrypted before storage and are
          never returned by the public API.
        </p>
      </div>
    </aside>
  );
}
