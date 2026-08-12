"use client";

import { useEffect, useMemo, useState } from "react";
import { encodeFunctionData, parseAbi } from "viem";

import { primaryActionClass } from "@/components/ui/action-styles";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  buildEscrowPlanMessage,
  type EscrowPlan,
  getEscrowPlan,
  getMatchExecution,
  type MatchExecution,
  registerEscrowFunding,
} from "@/lib/api";

const ESCROW = "0x71A27096640D3D24545D505B5F830ea3d94355d6" as const;
const FXRP = "0x0b6A3645c240605887a5532109323A3E12273dc7" as const;
const EXPLORER = "https://coston2-explorer.flare.network/tx/";

const escrowAbi = parseAbi([
  "function depositNative(bytes32 intentHash, uint64 expiresAt) payable returns (bytes32 depositId)",
  "function depositFXRP(uint256 amount, bytes32 intentHash, uint64 expiresAt) returns (bytes32 depositId)",
]);

const erc20Abi = parseAbi(["function approve(address spender, uint256 amount) returns (bool)"]);

type Props = {
  matchId: string;
};

type Stage = "idle" | "authorizing" | "approving" | "depositing" | "registering" | "error";

function toHexValue(value: bigint): `0x${string}` {
  return `0x${value.toString(16)}`;
}

function shorten(value: string, start = 10, end = 8) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatRawAmount(amountRaw: string, asset: "C2FLR" | "FXRP") {
  const decimals = asset === "C2FLR" ? 18 : 6;
  const raw = BigInt(amountRaw);
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = (raw % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function MatchEscrowFunding({ matchId }: Props) {
  const wallet = useFlareWallet();
  const [stage, setStage] = useState<Stage>("idle");
  const [execution, setExecution] = useState<MatchExecution | null>(null);

  useEffect(() => {
    if (!execution) return;

    window.dispatchEvent(
      new CustomEvent("flarelock:execution-updated", {
        detail: { matchId },
      }),
    );
  }, [execution, matchId]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const next = await getMatchExecution(matchId);
        if (!cancelled) setExecution(next);
      } catch {
        // Funding can still proceed; surface errors only after explicit user action.
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const allFunded = Boolean(execution?.buyer && execution?.seller);

  const fundingLabel = useMemo(() => {
    if (stage === "authorizing") return "Confirm ownership in MetaMask…";
    if (stage === "approving") return "Approve FXRP in MetaMask…";
    if (stage === "depositing") return "Confirm escrow deposit…";
    if (stage === "registering") return "Recording onchain deposit…";
    return "Fund your side";
  }, [stage]);

  async function fund() {
    if (!wallet.address) {
      setStage("error");
      setErrorMessage("Connect the wallet that owns this matched intent.");
      return;
    }

    setStage("authorizing");
    setErrorMessage(null);

    try {
      if (wallet.chainId !== 114) {
        await wallet.switchToCoston2();
      }

      const message = buildEscrowPlanMessage(matchId, wallet.address);
      const signature = await wallet.signMessage(message);
      const plan: EscrowPlan = await getEscrowPlan(matchId, wallet.address, signature);

      const existing = plan.role === "buyer" ? execution?.buyer : execution?.seller;
      if (existing) {
        setExecution(await getMatchExecution(matchId));
        setStage("idle");
        return;
      }

      const expiresAt = BigInt(Math.floor(new Date(plan.expiresAt).getTime() / 1000));
      let approvalTransactionHash: `0x${string}` | undefined;
      let transactionHash: `0x${string}`;

      if (plan.asset === "FXRP") {
        setStage("approving");

        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [ESCROW, BigInt(plan.amountRaw)],
        });

        approvalTransactionHash = await wallet.sendTransaction({
          to: FXRP,
          data: approveData,
        });

        await wallet.waitForTransactionReceipt(approvalTransactionHash);

        setStage("depositing");

        const depositData = encodeFunctionData({
          abi: escrowAbi,
          functionName: "depositFXRP",
          args: [BigInt(plan.amountRaw), plan.intentHash, expiresAt],
        });

        transactionHash = await wallet.sendTransaction({
          to: ESCROW,
          data: depositData,
        });
      } else {
        setStage("depositing");

        const depositData = encodeFunctionData({
          abi: escrowAbi,
          functionName: "depositNative",
          args: [plan.intentHash, expiresAt],
        });

        transactionHash = await wallet.sendTransaction({
          to: ESCROW,
          data: depositData,
          value: toHexValue(BigInt(plan.amountRaw)),
        });
      }

      await wallet.waitForTransactionReceipt(transactionHash);

      setStage("registering");

      const nextExecution = await registerEscrowFunding(
        matchId,
        wallet.address,
        signature,
        transactionHash,
        approvalTransactionHash,
      );

      setExecution(nextExecution);
      setStage("idle");
    } catch (error) {
      setStage("error");
      setErrorMessage(error instanceof Error ? error.message : "Escrow funding failed.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#e62058]">
            Execution funding
          </p>
          <p className="mt-1 text-[12px] font-semibold text-[#0a0b0d]">
            One funding action for your side
          </p>
        </div>

        <span
          className={
            allFunded
              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
              : "rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500"
          }
        >
          {allFunded
            ? "Both funded"
            : execution?.buyer || execution?.seller
              ? "Partially funded"
              : "Matched"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {(["buyer", "seller"] as const).map((role) => {
          const funding = execution?.[role] ?? null;
          return (
            <div className="rounded-lg bg-[#f7f8fa] p-3" key={role}>
              <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                {role} escrow
              </p>
              <p
                className={
                  funding
                    ? "mt-1 text-[12px] font-semibold text-emerald-700"
                    : "mt-1 text-[12px] font-semibold text-slate-500"
                }
              >
                {funding
                  ? `${formatRawAmount(funding.amountRaw, funding.asset)} ${funding.asset}`
                  : "Waiting"}
              </p>
              {funding && (
                <p className="mt-1 text-[10px] capitalize text-slate-500">{funding.state}</p>
              )}
            </div>
          );
        })}
      </div>

      {!allFunded && (
        <button
          className={`${primaryActionClass} mt-4 w-full`}
          disabled={stage !== "idle" && stage !== "error"}
          onClick={() => void fund()}
          type="button"
        >
          {fundingLabel}
        </button>
      )}

      {allFunded && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[12px] font-semibold text-emerald-800">
            Both escrow deposits confirmed
          </p>
          <p className="mt-1 text-[11px] leading-5 text-emerald-700">
            The execution is ready for FCC confidential verification and settlement.
          </p>
        </div>
      )}

      {execution && execution.transactions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Transactions
          </p>
          <div className="mt-2 grid gap-2">
            {execution.transactions.map((transaction) => (
              <a
                className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f8fa] px-3 py-2 text-[10px] transition hover:bg-slate-100"
                href={`${EXPLORER}${transaction.hash}`}
                key={`${transaction.kind}-${transaction.hash}`}
                rel="noreferrer"
                target="_blank"
              >
                <span className="font-medium text-slate-700">{transaction.label}</span>
                <span className="font-mono text-slate-500">{shorten(transaction.hash)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] font-medium text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
