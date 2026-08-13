"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { MatchEscrowFunding } from "@/components/intent/match-escrow-funding";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  buildRecoverMatchMessage,
  getMatchExecution,
  getWalletPrivateActivity,
  type MatchExecution,
  type WalletPrivateActivity,
} from "@/lib/api";

const EXPLORER = "https://coston2-explorer.flare.network/tx/";
const ACTIVE_EXECUTION_KEY = "flarelock:active-execution:C2FLR-FXRP";

type ActivityTab = "orders" | "executions" | "transactions";

function shorten(value: string, start = 10, end = 8) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRawAmount(amountRaw: string, asset: "C2FLR" | "FXRP") {
  const decimals = asset === "C2FLR" ? 18 : 6;
  const raw = BigInt(amountRaw);
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = (raw % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function stageLabel(stage: MatchExecution["stage"]) {
  if (stage === "partially_funded") return "Funding";
  if (stage === "funded") return "Ready for FCC";
  if (stage === "settled") return "Settled";
  return "Matched";
}

function stageClass(stage: MatchExecution["stage"]) {
  if (stage === "settled") return "bg-emerald-100 text-emerald-700";
  if (stage === "funded") return "bg-[#fff0f4] text-[#c8174b]";
  if (stage === "partially_funded") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function orderStatusClass(status: string) {
  if (status === "matched") return "bg-emerald-100 text-emerald-700";
  if (status === "expired") return "bg-slate-100 text-slate-500";
  return "bg-amber-100 text-amber-700";
}

export function rememberActiveExecution(matchId: string) {
  window.localStorage.setItem(ACTIVE_EXECUTION_KEY, matchId);

  window.dispatchEvent(
    new CustomEvent("flarelock:execution-changed", {
      detail: { matchId },
    }),
  );
}

export function PrivateExecutionActivity() {
  const wallet = useFlareWallet();

  const [activity, setActivity] = useState<WalletPrivateActivity | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [selectedExecution, setSelectedExecution] = useState<MatchExecution | null>(null);

  const [tab, setTab] = useState<ActivityTab>("executions");

  const [loadingActivity, setLoadingActivity] = useState(false);
  const [refreshingExecution, setRefreshingExecution] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExecution = useCallback((next: MatchExecution) => {
    setSelectedExecution(next);

    setActivity((current) => {
      if (!current) return current;

      const exists = current.executions.some((execution) => execution.matchId === next.matchId);

      return {
        ...current,
        executions: exists
          ? current.executions.map((execution) =>
              execution.matchId === next.matchId ? next : execution,
            )
          : [next, ...current.executions],
      };
    });
  }, []);

  const refreshExecution = useCallback(
    async (matchId: string, showLoading = false) => {
      if (showLoading) {
        setRefreshingExecution(true);
      }

      try {
        const next = await getMatchExecution(matchId);

        updateExecution(next);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to refresh execution.");
      } finally {
        if (showLoading) {
          setRefreshingExecution(false);
        }
      }
    },
    [updateExecution],
  );

  useEffect(() => {
    setActivity(null);
    setSelectedExecution(null);
    setError(null);

    const remembered = window.localStorage.getItem(ACTIVE_EXECUTION_KEY);

    setSelectedMatchId(remembered);

    if (remembered) {
      void refreshExecution(remembered);
    }
  }, [wallet.address, refreshExecution]);

  useEffect(() => {
    function handleExecutionEvent(event: Event) {
      const custom = event as CustomEvent<{ matchId?: string }>;

      const nextMatchId =
        custom.detail?.matchId ??
        window.localStorage.getItem(ACTIVE_EXECUTION_KEY) ??
        selectedMatchId;

      if (!nextMatchId) return;

      setSelectedMatchId(nextMatchId);
      void refreshExecution(nextMatchId);
    }

    function handleStorage() {
      const next = window.localStorage.getItem(ACTIVE_EXECUTION_KEY);

      if (!next) return;

      setSelectedMatchId(next);
      void refreshExecution(next);
    }

    window.addEventListener("flarelock:execution-changed", handleExecutionEvent);

    window.addEventListener("flarelock:execution-updated", handleExecutionEvent);

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("flarelock:execution-changed", handleExecutionEvent);

      window.removeEventListener("flarelock:execution-updated", handleExecutionEvent);

      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshExecution, selectedMatchId]);

  async function loadActivity() {
    if (!wallet.address) {
      setError("Connect your wallet to view private activity.");
      return;
    }

    setLoadingActivity(true);
    setError(null);

    try {
      if (wallet.chainId !== 114) {
        await wallet.switchToCoston2();
      }

      const message = buildRecoverMatchMessage(wallet.address);

      const signature = await wallet.signMessage(message);

      const next = await getWalletPrivateActivity(wallet.address, signature);

      setActivity(next);

      const remembered = window.localStorage.getItem(ACTIVE_EXECUTION_KEY);

      const preferred =
        next.executions.find((execution) => execution.matchId === remembered) ??
        next.executions[0] ??
        null;

      if (preferred) {
        rememberActiveExecution(preferred.matchId);
        setSelectedMatchId(preferred.matchId);
        setSelectedExecution(preferred);
      } else {
        setSelectedMatchId(null);
        setSelectedExecution(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load private activity.");
    } finally {
      setLoadingActivity(false);
    }
  }

  const transactions = useMemo(() => {
    if (!activity) return [];

    return activity.executions.flatMap((execution, executionIndex) =>
      execution.transactions.map((transaction) => ({
        ...transaction,
        matchId: execution.matchId,
        executionNumber: activity.executions.length - executionIndex,
        createdAt: execution.createdAt,
      })),
    );
  }, [activity]);

  const tabs: Array<{
    id: ActivityTab;
    label: string;
    count: number;
  }> = [
    {
      id: "orders",
      label: "Orders",
      count: activity?.intents.length ?? 0,
    },
    {
      id: "executions",
      label: "Executions",
      count: activity?.executions.length ?? 0,
    },
    {
      id: "transactions",
      label: "Transactions",
      count: transactions.length,
    },
  ];

  return (
    <section className="bg-[#f5f6f8] px-6 py-7 xl:px-8">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-5 border-b border-slate-200 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e62058]">
              My private activity
            </p>

            <h2 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] text-[#0a0b0d]">
              Orders, executions and transactions
            </h2>

            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
              A simple private history for this wallet. Detailed cryptographic evidence stays behind
              the execution and explorer links.
            </p>
          </div>

          <button
            className="h-11 rounded-xl bg-[#0a0b0d] px-5 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            disabled={!wallet.isConnected || loadingActivity}
            onClick={() => void loadActivity()}
            type="button"
          >
            {loadingActivity
              ? "Confirm in MetaMask…"
              : activity
                ? "Refresh activity"
                : "Load activity"}
          </button>
        </div>

        {!activity ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fafbfc] px-5 py-8 text-center">
              <p className="text-[14px] font-semibold text-slate-800">
                {wallet.isConnected
                  ? "Authorize your wallet to view private history"
                  : "Connect wallet to view private history"}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-500">
                Your orders and executions are not exposed in the public aggregated order book.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex overflow-x-auto border-b border-slate-200 px-4">
              {tabs.map((item) => (
                <button
                  className={
                    tab === item.id
                      ? "border-b-2 border-[#e62058] px-4 py-4 text-[12px] font-semibold text-[#e62058]"
                      : "border-b-2 border-transparent px-4 py-4 text-[12px] font-semibold text-slate-500 transition hover:text-slate-900"
                  }
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  type="button"
                >
                  {item.label}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {tab === "orders" && (
              <div className="p-5">
                {activity.intents.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-[11px] text-slate-500">
                    No private orders for this wallet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    {activity.intents.map((intent, index) => (
                      <div
                        className={
                          index === activity.intents.length - 1
                            ? "flex items-center justify-between gap-5 px-4 py-4"
                            : "flex items-center justify-between gap-5 border-b border-slate-100 px-4 py-4"
                        }
                        key={intent.intentId}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-semibold capitalize text-slate-900">
                              {intent.orderType} order
                            </p>

                            <span className="text-[10px] text-slate-400">{intent.market}</span>
                          </div>

                          <p
                            className="mt-1 truncate font-mono text-[9px] text-slate-400"
                            title={intent.intentId}
                          >
                            {shorten(intent.intentId, 12, 8)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold capitalize ${orderStatusClass(
                              intent.status,
                            )}`}
                          >
                            {intent.status}
                          </span>

                          <p className="mt-2 text-[9px] text-slate-400">
                            {formatDate(intent.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "executions" && (
              <div className="grid xl:grid-cols-[0.72fr_1.28fr]">
                <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
                  <p className="px-1 pb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Executions
                  </p>

                  {activity.executions.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 px-4 py-7 text-center text-[11px] text-slate-500">
                      No matched executions yet.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {activity.executions.map((execution, index) => {
                        const active = execution.matchId === selectedMatchId;

                        return (
                          <button
                            className={
                              active
                                ? "rounded-xl border border-[#e62058]/30 bg-[#fff6f8] p-4 text-left"
                                : "rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                            }
                            key={execution.matchId}
                            onClick={() => {
                              rememberActiveExecution(execution.matchId);

                              setSelectedMatchId(execution.matchId);

                              setSelectedExecution(execution);
                            }}
                            type="button"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] font-semibold text-slate-900">
                                  Execution {activity.executions.length - index}
                                </p>

                                <p className="mt-1 text-[9px] text-slate-400">
                                  {formatDate(execution.createdAt)}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${stageClass(
                                  execution.stage,
                                )}`}
                              >
                                {stageLabel(execution.stage)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {!selectedExecution ? (
                    <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center text-[11px] text-slate-500">
                      Select an execution.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#e62058]">
                            Selected execution
                          </p>

                          <p
                            className="mt-2 font-mono text-[10px] text-slate-600"
                            title={selectedExecution.matchId}
                          >
                            {shorten(selectedExecution.matchId, 16, 10)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${stageClass(
                              selectedExecution.stage,
                            )}`}
                          >
                            {stageLabel(selectedExecution.stage)}
                          </span>

                          <button
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            disabled={refreshingExecution}
                            onClick={() => void refreshExecution(selectedExecution.matchId, true)}
                            type="button"
                          >
                            {refreshingExecution ? "Refreshing…" : "Refresh"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {(["buyer", "seller"] as const).map((role) => {
                          const funding = selectedExecution[role];

                          return (
                            <div
                              className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-4"
                              key={role}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                                  {role}
                                </p>

                                <span
                                  className={
                                    funding
                                      ? "text-[10px] font-semibold capitalize text-emerald-700"
                                      : "text-[10px] font-medium text-slate-400"
                                  }
                                >
                                  {funding ? funding.state : "Waiting"}
                                </span>
                              </div>

                              <p className="mt-3 text-[18px] font-semibold text-slate-900">
                                {funding
                                  ? `${formatRawAmount(
                                      funding.amountRaw,
                                      funding.asset,
                                    )} ${funding.asset}`
                                  : "Not funded"}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {selectedExecution.stage === "settled" &&
                        selectedExecution.buyer &&
                        selectedExecution.seller && (
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                                  Settlement receipt
                                </p>

                                <p className="mt-2 text-[14px] font-semibold text-slate-900">
                                  Atomic swap completed
                                </p>

                                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                                  Both escrow legs settled successfully on Coston2 through the
                                  confidential FCC flow.
                                </p>
                              </div>

                              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-semibold text-emerald-700">
                                Verified
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Buyer received
                                </p>

                                <p className="mt-2 text-[16px] font-semibold text-slate-900">
                                  {formatRawAmount(
                                    selectedExecution.seller.amountRaw,
                                    selectedExecution.seller.asset,
                                  )}{" "}
                                  {selectedExecution.seller.asset}
                                </p>
                              </div>

                              <div className="rounded-xl border border-emerald-100 bg-white px-4 py-3">
                                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                  Seller received
                                </p>

                                <p className="mt-2 text-[16px] font-semibold text-slate-900">
                                  {formatRawAmount(
                                    selectedExecution.buyer.amountRaw,
                                    selectedExecution.buyer.asset,
                                  )}{" "}
                                  {selectedExecution.buyer.asset}
                                </p>
                              </div>
                            </div>

                            {selectedExecution.transactions.find(
                              (transaction) => transaction.kind === "settlement",
                            ) ? (
                              <a
                                className="mt-4 inline-flex items-center rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                                href={`${EXPLORER}${
                                  selectedExecution.transactions.find(
                                    (transaction) => transaction.kind === "settlement",
                                  )?.hash
                                }`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                View settlement transaction ↗
                              </a>
                            ) : null}
                          </div>
                        )}

                      <div className="mt-5">
                        <MatchEscrowFunding matchId={selectedExecution.matchId} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {tab === "transactions" && (
              <div className="p-5">
                {transactions.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-5 py-8 text-center text-[11px] text-slate-500">
                    No onchain transactions recorded yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    {transactions.map((transaction, index) => (
                      <a
                        className={
                          index === transactions.length - 1
                            ? "flex items-center justify-between gap-5 px-4 py-4 transition hover:bg-slate-50"
                            : "flex items-center justify-between gap-5 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50"
                        }
                        href={`${EXPLORER}${transaction.hash}`}
                        key={`${transaction.matchId}-${transaction.kind}-${transaction.hash}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800">
                            {transaction.label}
                          </p>

                          <p className="mt-1 text-[9px] text-slate-400">
                            Execution {transaction.executionNumber}
                            {" · "}
                            {formatDate(transaction.createdAt)}
                          </p>

                          <p className="mt-1 truncate font-mono text-[9px] text-slate-400">
                            {shorten(transaction.hash, 12, 10)}
                          </p>
                        </div>

                        <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                          Explorer ↗
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
