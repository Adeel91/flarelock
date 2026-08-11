"use client";

import { useState } from "react";

import { FirelightExitPanel } from "@/components/yield/firelight-exit-panel";
import { StakeYieldPanel } from "@/components/yield/stake-yield-panel";

type Tab = "overview" | "deposit" | "withdrawals";

export function FirelightProduct() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        {[
          ["overview", "Overview"],
          ["deposit", "Deposit"],
          ["withdrawals", "Withdrawals"],
        ].map(([value, label]) => (
          <button
            className={
              tab === value
                ? "border-b-2 border-[#e62058] px-5 py-4 text-sm font-bold text-[#111318]"
                : "px-5 py-4 text-sm font-semibold text-slate-500"
            }
            key={value}
            onClick={() => setTab(value as Tab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <p className="text-xs text-slate-500">Product</p>
            <p className="mt-2 text-xl font-bold">Firelight</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Live FXRP vault on Coston2.</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <p className="text-xs text-slate-500">Asset</p>
            <p className="mt-2 text-xl font-bold">FXRP</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Testnet representation: FTestXRP.
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-6">
            <p className="text-xs text-slate-500">Withdrawals</p>
            <p className="mt-2 text-xl font-bold">Period based</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Request first, claim after processing completes.
            </p>
          </div>
        </div>
      )}

      {tab === "deposit" && <StakeYieldPanel />}

      {tab === "withdrawals" && <FirelightExitPanel />}
    </div>
  );
}
