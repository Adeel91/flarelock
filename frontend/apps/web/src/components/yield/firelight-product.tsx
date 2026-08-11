"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { FirelightExitPanel } from "@/components/yield/firelight-exit-panel";
import { StakeYieldPanel } from "@/components/yield/stake-yield-panel";
import { getFirelightStatus, getFirelightWallet, getFirelightWithdrawals } from "@/lib/api";

type Tab = "overview" | "deposit" | "withdrawals";

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="border-r border-slate-200 px-6 py-5 last:border-r-0">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[25px] font-semibold tracking-[-0.035em] text-[#101217]">{value}</p>

        {suffix && <span className="text-[11px] font-semibold text-slate-400">{suffix}</span>}
      </div>
    </div>
  );
}

export function FirelightProduct() {
  const [tab, setTab] = useState<Tab>("overview");
  const { address } = useFlareWallet();

  const status = useQuery({
    queryKey: ["firelight-status"],
    queryFn: getFirelightStatus,
    refetchInterval: 15_000,
  });

  const wallet = useQuery({
    queryKey: ["firelight-wallet", address],
    queryFn: () => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      return getFirelightWallet(address);
    },
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });

  const withdrawals = useQuery({
    queryKey: ["firelight-withdrawals", address],
    queryFn: () => {
      if (!address) {
        throw new Error("Wallet is not connected.");
      }

      return getFirelightWithdrawals(address);
    },
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });

  const pendingExit =
    withdrawals.data?.requests.reduce(
      (total, request) => total + Number(request.requestedAssetsFormatted),
      0,
    ) ?? 0;

  const claimable =
    withdrawals.data?.requests.reduce(
      (total, request) => total + Number(request.claimableAssetsFormatted),
      0,
    ) ?? 0;

  return (
    <div>
      <div className="flex gap-8 border-b border-slate-200">
        {[
          ["overview", "Overview"],
          ["deposit", "Deposit"],
          ["withdrawals", "Withdrawals"],
        ].map(([value, label]) => (
          <button
            className={
              tab === value
                ? "border-b-2 border-[#e62058] px-1 py-4 text-[14px] font-semibold text-[#101217]"
                : "border-b-2 border-transparent px-1 py-4 text-[14px] font-medium text-slate-500 transition hover:text-[#101217]"
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
        <div>
          <section className="border-b border-slate-200">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <p className="text-[15px] font-semibold">Your position</p>

                <p className="mt-1 text-[12px] text-slate-500">
                  Live FXRP balances and Firelight position.
                </p>
              </div>

              <span className="flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>

            <div className="grid border-t border-slate-200 md:grid-cols-4">
              <Metric
                label="Available FXRP"
                suffix="FXRP"
                value={address ? (wallet.data?.balance.formatted ?? "...") : "—"}
              />

              <Metric
                label="In Firelight"
                suffix="FXRP"
                value={address ? (wallet.data?.position.assetsFormatted ?? "...") : "—"}
              />

              <Metric
                label="Vault shares"
                value={address ? (wallet.data?.position.sharesFormatted ?? "...") : "—"}
              />

              <Metric
                label="Pending exit"
                suffix="FXRP"
                value={
                  address
                    ? pendingExit.toLocaleString("en-US", {
                        maximumFractionDigits: 6,
                      })
                    : "—"
                }
              />
            </div>
          </section>

          <section className="border-b border-slate-200">
            <div className="px-6 py-5">
              <p className="text-[15px] font-semibold">Firelight status</p>

              <p className="mt-1 text-[12px] text-slate-500">
                Current vault and withdrawal state on Coston2.
              </p>
            </div>

            <div className="grid border-t border-slate-200 md:grid-cols-4">
              <div className="border-r border-slate-200 px-6 py-5">
                <p className="text-[11px] text-slate-500">Protocol</p>

                <p className="mt-2 text-[16px] font-semibold">Firelight</p>

                <p className="mt-1 text-[11px] text-emerald-700">Live on Coston2</p>
              </div>

              <div className="border-r border-slate-200 px-6 py-5">
                <p className="text-[11px] text-slate-500">Current period</p>

                <p className="mt-2 text-[16px] font-semibold">
                  {status.data?.vault.currentPeriod ?? "..."}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">Period based exits</p>
              </div>

              <div className="border-r border-slate-200 px-6 py-5">
                <p className="text-[11px] text-slate-500">Vault assets</p>

                <p className="mt-2 text-[16px] font-semibold">
                  {status.data?.vault.totalAssetsFormatted ?? "..."} FXRP
                </p>

                <p className="mt-1 text-[11px] text-slate-500">ERC 4626 vault</p>
              </div>

              <div className="px-6 py-5">
                <p className="text-[11px] text-slate-500">Claimable</p>

                <p className="mt-2 text-[16px] font-semibold">
                  {claimable.toLocaleString("en-US", {
                    maximumFractionDigits: 6,
                  })}{" "}
                  FXRP
                </p>

                <p className="mt-1 text-[11px] text-slate-500">Processed withdrawals</p>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200">
            <div className="px-6 py-5">
              <p className="text-[15px] font-semibold">Manage your position</p>

              <p className="mt-1 text-[12px] text-slate-500">
                Deposit FXRP or manage an existing exit request.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-slate-200 px-6 py-5">
              <button
                className="inline-flex h-[46px] min-w-[130px] items-center justify-center rounded-[10px] bg-[#e62058] px-5 text-[14px] font-medium !text-white shadow-[0_6px_16px_rgba(230,32,88,0.16)] transition hover:bg-[#ce174d]"
                onClick={() => setTab("deposit")}
                type="button"
              >
                Deposit FXRP
              </button>

              <button
                className="inline-flex h-[46px] min-w-[150px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-5 text-[14px] font-medium text-[#101217] transition hover:bg-slate-50"
                onClick={() => setTab("withdrawals")}
                type="button"
              >
                View withdrawals
              </button>
            </div>
          </section>

          <section className="px-6 py-6">
            <p className="text-[15px] font-semibold">How Firelight works</p>

            <div className="mt-5 grid border border-slate-200 md:grid-cols-4">
              {[
                ["01", "Deposit FXRP", "Move FXRP into the Firelight vault."],
                ["02", "Receive shares", "Your vault position is represented by shares."],
                ["03", "Request exit", "Redeem shares into a period based withdrawal request."],
                ["04", "Claim FXRP", "Claim after Firelight finishes processing the request."],
              ].map(([number, title, description], index) => (
                <div
                  className={
                    index < 3 ? "border-b border-slate-200 p-5 md:border-b-0 md:border-r" : "p-5"
                  }
                  key={number}
                >
                  <p className="text-[10px] font-bold text-[#e62058]">{number}</p>

                  <p className="mt-3 text-[13px] font-semibold">{title}</p>

                  <p className="mt-2 text-[11px] leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "deposit" && (
        <div className="py-6">
          <StakeYieldPanel />
        </div>
      )}

      {tab === "withdrawals" && (
        <div className="py-6">
          <FirelightExitPanel />
        </div>
      )}
    </div>
  );
}
