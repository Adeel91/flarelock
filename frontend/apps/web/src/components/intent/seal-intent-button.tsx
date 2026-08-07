"use client";

import { useState } from "react";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import {
  buildPrivateIntentMessage,
  type ConvertQuote,
  type SealedIntent,
  sealPrivateIntent,
} from "@/lib/api";

type SealIntentButtonProps = {
  quote: ConvertQuote;
};

export function SealIntentButton({ quote }: SealIntentButtonProps) {
  const wallet = useFlareWallet();

  const [status, setStatus] = useState<"idle" | "signing" | "submitting" | "sealed" | "error">(
    "idle",
  );
  const [sealedIntent, setSealedIntent] = useState<SealedIntent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSealIntent() {
    if (!wallet.address) {
      setStatus("error");
      setErrorMessage("Connect your wallet before sealing the intent.");
      return;
    }

    setStatus("signing");
    setErrorMessage(null);

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
      };

      const message = buildPrivateIntentMessage(unsignedIntent);
      const signature = await wallet.signMessage(message);

      setStatus("submitting");

      const result = await sealPrivateIntent({
        ...unsignedIntent,
        signature,
      });

      setSealedIntent(result);
      setStatus("sealed");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to seal private intent.");
    }
  }

  if (status === "sealed" && sealedIntent) {
    return (
      <div className="quote-pop mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Intent sealed</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">Signature verified</p>
          </div>

          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Searching
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-700">
              Intent ID
            </p>
            <p className="mono mt-1 break-all text-sm text-emerald-950">{sealedIntent.intentId}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-emerald-700">
              Intent hash
            </p>
            <p className="mono mt-1 break-all text-sm text-emerald-950">
              {sealedIntent.intentHash}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        className="clean-button w-full rounded-2xl bg-[#0052ff] px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-[#0042cc] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={status === "signing" || status === "submitting"}
        onClick={handleSealIntent}
        type="button"
      >
        {status === "signing"
          ? "Confirm in MetaMask"
          : status === "submitting"
            ? "Verifying signature"
            : "Seal private intent"}
      </button>

      <p className="mt-3 text-center text-sm leading-6 text-slate-500">
        MetaMask opens only after clicking this button.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
