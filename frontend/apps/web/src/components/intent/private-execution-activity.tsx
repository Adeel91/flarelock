"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfidentialSettlementAction } from "@/components/intent/confidential-settlement-action";
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
  if (value.length <= start + end + 3) {
    return value;
  }

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

function stageLabel(stage: MatchExecution["stage"]) {
  if (stage === "partially_funded") {
    return "Partially funded";
  }

  if (stage === "funded") {
    return "Ready for FCC";
  }

  if (stage === "settled") {
    return "Settled";
  }

  return "Matched";
}

function stageTextClass(stage: MatchExecution["stage"]) {
  if (stage === "settled") {
    return "text-emerald-700";
  }

  if (stage === "funded") {
    return "text-[#e62058]";
  }

  if (stage === "partially_funded") {
    return "text-amber-700";
  }

  return "text-slate-600";
}

function Status({ complete, label }: { complete: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          complete
            ? "text-[12px] font-bold text-emerald-600"
            : "text-[12px] font-bold text-slate-300"
        }
      >
        {complete ? "✓" : "○"}
      </span>

      <span
        className={
          complete ? "text-[11px] font-medium text-slate-700" : "text-[11px] text-slate-400"
        }
      >
        {label}
      </span>
    </div>
  );
}

export function rememberActiveExecution(matchId: string) {
  window.localStorage.setItem(ACTIVE_EXECUTION_KEY, matchId);
  window.dispatchEvent(new Event("flarelock:execution-changed"));
}

export function PrivateExecutionActivity() {
  const wallet = useFlareWallet();

  const [activity, setActivity] = useState<WalletPrivateActivity | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<MatchExecution | null>(null);
  const [tab, setTab] = useState<ActivityTab>("executions");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivity(null);
    setSelectedMatchId(null);
    setSelectedExecution(null);
    setError(null);
  }, [wallet.address]);

  useEffect(() => {
    if (!selectedMatchId) {
      setSelectedExecution(null);
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const next = await getMatchExecution(selectedMatchId);

        if (!cancelled) {
          setSelectedExecution(next);

          setActivity((current) =>
            current
              ? {
                  ...current,
                  executions: current.executions.map((execution) =>
                    execution.matchId === next.matchId ? next : execution,
                  ),
                }
              : current,
          );

          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to refresh execution.");
        }
      }
    }

    void refresh();

    const timer = window.setInterval(() => void refresh(), 4_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedMatchId]);

  async function loadActivity() {
    if (!wallet.address) {
      setError("Connect your wallet to load private activity.");
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
      setLoading(false);
    }
  }

  // Private activity is wallet-owned, so request authorization
  // automatically instead of making the user find another button.
  useEffect(() => {
    if (!wallet.address || !wallet.isConnected) {
      return;
    }

    // loadActivity intentionally runs once for each connected wallet.
  }, [wallet.address, wallet.isConnected]);

  const summary = useMemo(() => {
    const intents = activity?.intents ?? [];
    const executions = activity?.executions ?? [];

    return {
      orders: intents.length,
      open: intents.filter((intent) => intent.status === "sealed").length,
      executions: executions.length,
      active: executions.filter((execution) => execution.stage !== "settled").length,
      transactions: executions.reduce(
        (total, execution) => total + execution.transactions.length,
        0,
      ),
    };
  }, [activity]);

  const allTransactions = useMemo(
    () =>
      (activity?.executions ?? []).flatMap((execution) =>
        execution.transactions.map((transaction) => ({
          ...transaction,
          matchId: execution.matchId,
          executionCreatedAt: execution.createdAt,
        })),
      ),
    [activity],
  );

  const selectedIndex = activity?.executions.findIndex(
    (execution) => execution.matchId === selectedMatchId,
  );

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-none px-7 py-8 xl:px-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#e62058]">
              Your private trading
            </p>

            <h2 className="mt-1 text-[27px] font-semibold tracking-[-0.04em] text-[#0a0b0d]">
              Your orders & transactions
            </h2>

            <p className="mt-1 text-[11px] text-slate-500">
              Everything you have submitted, matched or funded appears here.
            </p>
          </div>

          <button
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-[#e62058] px-8 py-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(230,32,88,0.24)] transition hover:bg-[#cf184d] hover:shadow-[0_10px_28px_rgba(230,32,88,0.30)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:w-auto sm:min-w-[190px]"
            disabled={!wallet.isConnected || loading}
            onClick={() => void loadActivity()}
            type="button"
          >
            {loading ? "Confirm in MetaMask…" : activity ? "Refresh activity" : "Load my activity"}
          </button>
        </div>

        {!activity ? (
          <div className="mt-6 border-y border-slate-100 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[12px] font-medium text-slate-700">
                  {wallet.isConnected
                    ? "Your private trading history is ready to unlock"
                    : "Connect your wallet to view your activity"}
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  {wallet.isConnected
                    ? "One wallet signature securely loads your orders, executions and onchain transactions."
                    : "Your private activity becomes available after connecting your wallet."}
                </p>
              </div>

              {wallet.isConnected && (
                <span className="text-[10px] font-medium text-slate-400">
                  Private to this wallet
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7 flex flex-wrap items-center gap-7 border-b border-slate-200">
              {[
                ["orders", "Orders", summary.orders],
                ["executions", "Executions", summary.executions],
                ["transactions", "Transactions", summary.transactions],
              ].map(([value, label, count]) => {
                const active = tab === value;

                return (
                  <button
                    className={
                      active
                        ? "border-b-2 border-[#e62058] pb-3 text-[12px] font-semibold text-[#0a0b0d]"
                        : "border-b-2 border-transparent pb-3 text-[12px] font-medium text-slate-400 transition hover:text-slate-700"
                    }
                    key={value}
                    onClick={() => setTab(value as ActivityTab)}
                    type="button"
                  >
                    {label}
                    <span className="ml-2 text-[10px] text-slate-400">{count}</span>
                  </button>
                );
              })}

              <div className="ml-auto hidden items-center gap-5 pb-3 text-[10px] text-slate-400 sm:flex">
                <span>{summary.open} open</span>
                <span>{summary.active} active</span>
              </div>
            </div>

            {tab === "orders" && (
              <div>
                {activity.intents.length === 0 ? (
                  <p className="py-12 text-center text-[11px] text-slate-400">
                    No private orders for this wallet.
                  </p>
                ) : (
                  activity.intents.map((intent) => (
                    <div
                      className="grid gap-3 border-b border-slate-100 py-4 sm:grid-cols-[1.2fr_0.7fr_0.7fr_auto] sm:items-center"
                      key={intent.intentId}
                    >
                      <div>
                        <p className="font-mono text-[10px] font-medium text-slate-700">
                          {shorten(intent.intentId, 14, 10)}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          FXRP / C2FLR · {formatDate(intent.createdAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">Type</p>
                        <p className="mt-1 text-[11px] font-medium capitalize text-slate-700">
                          {intent.orderType}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                          Status
                        </p>
                        <p className="mt-1 text-[11px] font-medium capitalize text-slate-700">
                          {intent.status}
                        </p>
                      </div>

                      <span
                        className={
                          intent.status === "matched"
                            ? "text-[10px] font-semibold text-emerald-700"
                            : intent.status === "expired"
                              ? "text-[10px] font-semibold text-slate-400"
                              : "text-[10px] font-semibold text-amber-700"
                        }
                      >
                        {intent.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "executions" && (
              <div className="grid lg:grid-cols-[0.62fr_1.38fr]">
                <div className="border-b border-slate-200 py-2 lg:border-b-0 lg:border-r lg:pr-6">
                  {activity.executions.length === 0 ? (
                    <p className="py-12 text-center text-[11px] text-slate-400">
                      No matched executions yet.
                    </p>
                  ) : (
                    activity.executions.map((execution, index) => {
                      const active = execution.matchId === selectedMatchId;

                      return (
                        <button
                          className={
                            active
                              ? "w-full border-b border-slate-100 border-l-2 border-l-[#e62058] py-4 pl-4 pr-2 text-left"
                              : "w-full border-b border-slate-100 border-l-2 border-l-transparent py-4 pl-4 pr-2 text-left transition hover:bg-slate-50"
                          }
                          key={execution.matchId}
                          onClick={() => {
                            rememberActiveExecution(execution.matchId);
                            setSelectedMatchId(execution.matchId);
                            setSelectedExecution(execution);
                          }}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-slate-800">
                                Execution {activity.executions.length - index}
                              </p>

                              <p className="mt-1 font-mono text-[9px] text-slate-400">
                                {shorten(execution.matchId)}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 text-[10px] font-semibold ${stageTextClass(
                                execution.stage,
                              )}`}
                            >
                              {stageLabel(execution.stage)}
                            </span>
                          </div>

                          <p className="mt-2 text-[10px] text-slate-400">
                            {formatDate(execution.createdAt)}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="py-5 lg:pl-8">
                  {selectedExecution ? (
                    <>
                      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Selected execution
                          </p>

                          <p className="mt-2 font-mono text-[11px] font-medium text-slate-700">
                            {shorten(selectedExecution.matchId, 18, 12)}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            {selectedIndex !== undefined && selectedIndex >= 0
                              ? `Execution ${activity.executions.length - selectedIndex}`
                              : "Private execution"}{" "}
                            · {formatDate(selectedExecution.createdAt)}
                          </p>
                        </div>

                        <p
                          className={`text-[12px] font-semibold ${stageTextClass(
                            selectedExecution.stage,
                          )}`}
                        >
                          {stageLabel(selectedExecution.stage)}
                        </p>
                      </div>

                      <div className="grid gap-3 border-b border-slate-200 py-5 sm:grid-cols-2 xl:grid-cols-4">
                        <Status complete label="Matched" />
                        <Status complete={Boolean(selectedExecution.buyer)} label="Buyer funded" />
                        <Status
                          complete={Boolean(selectedExecution.seller)}
                          label="Seller funded"
                        />
                        <Status
                          complete={selectedExecution.stage === "settled"}
                          label="FCC settled"
                        />
                      </div>

                      <div className="grid gap-8 border-b border-slate-200 py-5 md:grid-cols-2">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Escrow
                          </p>

                          {(["buyer", "seller"] as const).map((role) => {
                            const funding = selectedExecution[role];

                            return (
                              <div
                                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                                key={role}
                              >
                                <span className="text-[11px] font-medium capitalize text-slate-700">
                                  {role}
                                </span>

                                <span
                                  className={
                                    funding
                                      ? "text-[10px] font-semibold capitalize text-emerald-700"
                                      : "text-[10px] text-slate-400"
                                  }
                                >
                                  {funding ? funding.state : "Not funded"}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                              Transactions
                            </p>

                            <span className="text-[9px] text-slate-400">
                              {selectedExecution.transactions.length}
                            </span>
                          </div>

                          {selectedExecution.transactions.length === 0 ? (
                            <p className="py-5 text-[10px] text-slate-400">
                              No onchain transactions recorded yet.
                            </p>
                          ) : (
                            selectedExecution.transactions.map((transaction) => (
                              <a
                                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                                href={`${EXPLORER}${transaction.hash}`}
                                key={`${transaction.kind}-${transaction.hash}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <div className="min-w-0">
                                  <p className="text-[10px] font-medium text-slate-700">
                                    {transaction.label}
                                  </p>

                                  <p className="mt-1 font-mono text-[9px] text-slate-400">
                                    {shorten(transaction.hash)}
                                  </p>
                                </div>

                                <span className="text-[9px] font-semibold text-slate-400">
                                  Explorer ↗
                                </span>
                              </a>
                            ))
                          )}
                        </div>
                      </div>

                      {selectedExecution.stage !== "settled" && (
                        <div className="pt-5">
                          <MatchEscrowFunding matchId={selectedExecution.matchId} />

                          {selectedExecution ? (
                            <ConfidentialSettlementAction
                              execution={selectedExecution}
                              onSettled={async () => {
                                const refreshed = await getMatchExecution(
                                  selectedExecution.matchId,
                                );

                                setSelectedExecution(refreshed);

                                setActivity((current) => {
                                  if (!current) {
                                    return current;
                                  }

                                  return {
                                    ...current,
                                    executions: current.executions.map((execution) =>
                                      execution.matchId === refreshed.matchId
                                        ? refreshed
                                        : execution,
                                    ),
                                  };
                                });
                              }}
                            />
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="py-14 text-center text-[11px] text-slate-400">
                      Select an execution to inspect it.
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === "transactions" && (
              <div>
                {allTransactions.length === 0 ? (
                  <p className="py-12 text-center text-[11px] text-slate-400">
                    No onchain transactions recorded yet.
                  </p>
                ) : (
                  allTransactions.map((transaction) => (
                    <a
                      className="grid gap-3 border-b border-slate-100 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                      href={`${EXPLORER}${transaction.hash}`}
                      key={`${transaction.matchId}-${transaction.kind}-${transaction.hash}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <div>
                        <p className="text-[11px] font-medium text-slate-800">
                          {transaction.label}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          {formatDate(transaction.executionCreatedAt)}
                        </p>
                      </div>

                      <p className="font-mono text-[9px] text-slate-500">
                        {shorten(transaction.hash, 14, 10)}
                      </p>

                      <span className="text-[9px] font-semibold text-slate-400">Explorer ↗</span>
                    </a>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mt-5 border-l-2 border-red-400 pl-3 text-[11px] font-medium text-red-700">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
