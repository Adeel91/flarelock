"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useCallback, useEffect, useState } from "react";

import { ConfidentialSettlementAction } from "@/components/intent/confidential-settlement-action";
import { MatchEscrowFunding } from "@/components/intent/match-escrow-funding";
import { primaryActionClass } from "@/components/ui/action-styles";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  getMatchExecution,
  getWalletPrivateActivity,
  type MatchExecution,
  type WalletPrivateActivity,
} from "@/lib/api";

const EXPLORER = "https://coston2-explorer.flare.network/tx/";
const ACTIVE_EXECUTION_KEY = "flarelock:active-execution:C2FLR-FXRP";
const PRIVATE_ACTIVITY_CACHE_PREFIX = "flarelock:private-activity:";

function privateActivityCacheKey(address: string) {
  return `${PRIVATE_ACTIVITY_CACHE_PREFIX}${address.toLowerCase()}`;
}

function readCachedPrivateActivity(address: string): WalletPrivateActivity | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const raw = window.sessionStorage.getItem(privateActivityCacheKey(address));

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as WalletPrivateActivity;
  } catch {
    window.sessionStorage.removeItem(privateActivityCacheKey(address));

    return undefined;
  }
}

function writeCachedPrivateActivity(address: string, activity: WalletPrivateActivity) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(privateActivityCacheKey(address), JSON.stringify(activity));
}

type ActivityTab = "orders" | "executions";

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
  const queryClient = useQueryClient();
  const [activity, setActivity] = useState<WalletPrivateActivity | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const [selectedExecution, setSelectedExecution] = useState<MatchExecution | null>(null);
  const [executionDetailsOpen, setExecutionDetailsOpen] = useState(false);

  const [tab, setTab] = useState<ActivityTab>("executions");
  const [refreshingExecution, setRefreshingExecution] = useState(false);
  const [authorizingActivity, setAuthorizingActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExecution = useCallback((next: MatchExecution) => {
    setSelectedExecution((current) => (current?.matchId === next.matchId ? next : current));

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
    setSelectedMatchId(null);
    setSelectedExecution(null);
    setExecutionDetailsOpen(false);
    setError(null);
  }, [wallet.address]);

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

  async function authorizePrivateActivity() {
    if (!wallet.address) {
      setError("Connect your wallet first.");
      return;
    }

    setAuthorizingActivity(true);
    setError(null);

    try {
      const signature = await wallet.ensurePrivateActivityAuth();

      const next = await getWalletPrivateActivity(wallet.address, signature);

      queryClient.setQueryData(["private-activity", wallet.address], next);

      writeCachedPrivateActivity(wallet.address, next);
      setActivity(next);

      const remembered = window.localStorage.getItem(ACTIVE_EXECUTION_KEY);

      const preferred =
        next.executions.find((execution) => execution.matchId === remembered) ??
        next.executions[0] ??
        null;

      if (preferred) {
        window.localStorage.setItem(ACTIVE_EXECUTION_KEY, preferred.matchId);

        setSelectedMatchId(preferred.matchId);
        setSelectedExecution(preferred);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to authorize private activity.");
    } finally {
      setAuthorizingActivity(false);
    }
  }

  const privateActivityQuery = useQuery({
    queryKey: ["private-activity", wallet.address],
    queryFn: async () => {
      if (!wallet.address || !wallet.privateActivitySignature) {
        throw new Error("Private wallet authentication is not available.");
      }

      return getWalletPrivateActivity(wallet.address, wallet.privateActivitySignature);
    },
    enabled: Boolean(wallet.isConnected && wallet.address && wallet.privateActivitySignature),
    initialData: wallet.address
      ? () => readCachedPrivateActivity(wallet.address as `0x${string}`)
      : undefined,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    const next = privateActivityQuery.data;

    if (!next) {
      return;
    }

    setActivity(next);
    setError(null);

    if (wallet.address) {
      writeCachedPrivateActivity(wallet.address, next);
    }

    const remembered = window.localStorage.getItem(ACTIVE_EXECUTION_KEY);

    const preferred =
      next.executions.find((execution) => execution.matchId === remembered) ??
      next.executions[0] ??
      null;

    if (preferred) {
      window.localStorage.setItem(ACTIVE_EXECUTION_KEY, preferred.matchId);
      setSelectedMatchId(preferred.matchId);
      setSelectedExecution(preferred);
    } else {
      setSelectedMatchId(null);
      setSelectedExecution(null);
    }
  }, [privateActivityQuery.data, wallet.address]);

  useEffect(() => {
    if (!privateActivityQuery.error) {
      return;
    }

    setError(
      privateActivityQuery.error instanceof Error
        ? privateActivityQuery.error.message
        : "Unable to load private activity.",
    );
  }, [privateActivityQuery.error]);

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
  ];

  return (
    <section className="bg-[#f5f6f8] px-3 py-5 sm:px-5 sm:py-6 xl:px-8 xl:py-7">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:rounded-[26px]">
        <div className="flex flex-col gap-5 border-b border-slate-200 px-4 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c10f45]">
              My private activity
            </p>

            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em] text-[#0a0b0d] sm:text-[26px]">
              Orders and executions
            </h2>

            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
              All private Market, Limit and Stop Loss orders appear here. Matched Limit orders
              continue to Executions for escrow funding, FCC verification and final settlement.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-[11px] font-semibold text-slate-600">
              {!wallet.isConnected
                ? "Connect wallet to view private activity"
                : !wallet.privateActivitySignature
                  ? "Private session not authorized"
                  : privateActivityQuery.isFetching
                    ? activity
                      ? "Checking for updates…"
                      : "Loading private activity…"
                    : privateActivityQuery.isError
                      ? "Unable to load private activity"
                      : "Private activity up to date"}
            </p>

            {wallet.isConnected && !wallet.privateActivitySignature ? (
              <button
                className="clean-button inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] bg-[#c10f45] px-4 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(193,15,69,0.16)] transition hover:bg-[#a50d3b] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={authorizingActivity}
                onClick={() => {
                  void authorizePrivateActivity();
                }}
                type="button"
              >
                {authorizingActivity ? "Authorizing…" : "Authorize once"}
              </button>
            ) : null}

            {wallet.isConnected && wallet.privateActivitySignature && activity ? (
              <button
                className={`${primaryActionClass} h-10 whitespace-nowrap px-4 text-[12px]`}
                disabled={privateActivityQuery.isFetching}
                onClick={() => {
                  void privateActivityQuery.refetch();
                }}
                title="Fetch new orders, matches, funding or settlement updates."
                type="button"
              >
                {privateActivityQuery.isFetching ? "Checking…" : "Check for updates"}
              </button>
            ) : null}

            {wallet.isConnected &&
            wallet.privateActivitySignature &&
            !activity &&
            privateActivityQuery.isError ? (
              <button
                className="text-[10px] font-semibold text-[#c10f45] hover:underline"
                onClick={() => {
                  void privateActivityQuery.refetch();
                }}
                type="button"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>

        {!activity ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-[#fafbfc] px-5 py-8 text-center">
              <p className="text-[14px] font-semibold text-slate-800">
                {wallet.isConnected
                  ? privateActivityQuery.isLoading
                    ? "Loading your private activity…"
                    : error
                      ? "Unable to load your private activity"
                      : "Preparing your private activity…"
                  : "Connect wallet to view private activity"}
              </p>

              <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-500">
                Your orders and executions are not exposed in the public aggregated order book.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-4">
              {tabs.map((item) => (
                <button
                  className={
                    tab === item.id
                      ? "border-b-2 border-[#c10f45] px-3 py-3.5 text-[11px] sm:px-4 sm:py-4 sm:text-[12px] font-semibold text-[#c10f45]"
                      : "border-b-2 border-transparent px-3 py-3.5 text-[11px] sm:px-4 sm:py-4 sm:text-[12px] font-semibold text-slate-500 transition hover:text-slate-900"
                  }
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  title={
                    item.id === "orders"
                      ? "Orders includes all private Market, Limit and Stop Loss orders."
                      : "Executions is currently available for matched Limit orders only, including escrow funding, FCC verification and final settlement."
                  }
                  type="button"
                >
                  {item.label}

                  <span
                    aria-hidden="true"
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[12px] font-bold leading-none text-slate-600 shadow-sm"
                  >
                    i
                  </span>

                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500">
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {tab === "orders" && (
              <div className="p-3 sm:p-5">
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
                            ? "flex flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5"
                            : "flex flex-col items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:gap-5"
                        }
                        key={intent.intentId}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
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

                        <div className="shrink-0 text-left sm:text-right">
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
              <div className="grid min-w-0 2xl:grid-cols-[0.72fr_1.28fr]">
                <div className="border-b border-slate-200 p-3 sm:p-4 2xl:border-b-0 2xl:border-r">
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
                        const active =
                          executionDetailsOpen && execution.matchId === selectedMatchId;

                        return (
                          <button
                            className={
                              active
                                ? "rounded-xl border border-[#c10f45]/30 bg-[#fff6f8] p-4 text-left"
                                : "rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                            }
                            key={execution.matchId}
                            onClick={() => {
                              window.localStorage.setItem(ACTIVE_EXECUTION_KEY, execution.matchId);

                              setSelectedMatchId(execution.matchId);
                              setSelectedExecution(execution);
                              setExecutionDetailsOpen(true);
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

                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${stageClass(
                                    execution.stage,
                                  )}`}
                                >
                                  {stageLabel(execution.stage)}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="text-[16px] leading-none text-slate-300 2xl:hidden"
                                >
                                  →
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedExecution && executionDetailsOpen ? (
                  <button
                    aria-label="Close execution details"
                    className="fixed inset-0 z-[80] cursor-default bg-slate-950/25 backdrop-blur-[1px] 2xl:hidden"
                    onClick={() => setExecutionDetailsOpen(false)}
                    type="button"
                  />
                ) : null}

                <div
                  className={
                    selectedExecution && executionDetailsOpen
                      ? "fixed inset-y-0 right-0 z-[90] w-[min(600px,calc(100vw-12px))] translate-x-0 overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-[-24px_0_70px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out sm:w-[min(600px,calc(100vw-32px))] sm:p-5 2xl:static 2xl:z-auto 2xl:w-auto 2xl:translate-x-0 2xl:overflow-visible 2xl:border-l-0 2xl:p-5 2xl:shadow-none"
                      : "pointer-events-none fixed inset-y-0 right-0 z-[90] w-[min(600px,calc(100vw-12px))] translate-x-full overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-[-24px_0_70px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out sm:w-[min(600px,calc(100vw-32px))] sm:p-5 2xl:pointer-events-auto 2xl:static 2xl:z-auto 2xl:w-auto 2xl:translate-x-0 2xl:overflow-visible 2xl:border-l-0 2xl:p-5 2xl:shadow-none"
                  }
                >
                  {!selectedExecution || !executionDetailsOpen ? (
                    <div className="rounded-2xl bg-slate-50 px-5 py-10 text-center text-[11px] text-slate-500">
                      Select an execution to view its details.
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 2xl:hidden">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c10f45]">
                            Execution details
                          </p>

                          <p className="mt-1 text-[16px] font-semibold text-slate-900">
                            Private execution
                          </p>
                        </div>

                        <button
                          aria-label="Close execution details"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-[22px] leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                          onClick={() => setExecutionDetailsOpen(false)}
                          type="button"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#c10f45]">
                            Selected execution
                          </p>

                          <p
                            className="mt-2 break-all font-mono text-[10px] text-slate-600"
                            title={selectedExecution.matchId}
                          >
                            {shorten(selectedExecution.matchId, 16, 10)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
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
                        <MatchEscrowFunding
                          initialExecution={selectedExecution}
                          matchId={selectedExecution.matchId}
                        />

                        <ConfidentialSettlementAction
                          execution={selectedExecution}
                          onSettled={() => refreshExecution(selectedExecution.matchId, true)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="mx-3 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700 sm:mx-6 sm:mb-6">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
