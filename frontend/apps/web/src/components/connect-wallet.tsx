"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useState } from "react";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isWalletMissing(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("wallet not found");
}

function isRejected(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("rejected") || message.includes("denied") || message.includes("cancelled")
  );
}

export function ConnectWallet() {
  const wallet = useFlareWallet();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  async function handleConnect() {
    setShowInstallPrompt(false);
    setLocalError(null);

    try {
      await wallet.connect();
    } catch (error) {
      if (isWalletMissing(error)) {
        setShowInstallPrompt(true);
        return;
      }

      if (isRejected(error)) {
        setLocalError("Wallet request was cancelled.");
        return;
      }

      setLocalError(error instanceof Error ? error.message : "Wallet connection failed.");
    }
  }

  async function handleSwitchChain() {
    setLocalError(null);
    setIsSwitchingNetwork(true);

    try {
      await wallet.switchToCoston2();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Network switch failed.");
    } finally {
      setIsSwitchingNetwork(false);
    }
  }

  if (wallet.isConnected && wallet.address) {
    const isCoston2 = wallet.chainId === coston2.id;

    return (
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        {!isCoston2 && (
          <button
            className="rounded-full bg-cyan-200 px-5 py-3 text-sm font-black text-[#050712] transition hover:bg-white disabled:opacity-60"
            disabled={isSwitchingNetwork}
            onClick={handleSwitchChain}
            type="button"
          >
            {isSwitchingNetwork ? "Switching" : "Switch to Coston2"}
          </button>
        )}

        <button
          className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#050712] transition hover:bg-cyan-200"
          onClick={wallet.disconnect}
          type="button"
        >
          {shortenAddress(wallet.address)}
        </button>

        {(localError || wallet.errorMessage) && (
          <p className="max-w-72 text-right text-xs font-semibold text-cyan-200">
            {localError ?? wallet.errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      <button
        className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#050712] shadow-lg shadow-black/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={wallet.status === "connecting"}
        onClick={handleConnect}
        type="button"
      >
        {wallet.status === "connecting" ? "Connecting" : "Connect Flare wallet"}
      </button>

      {showInstallPrompt && (
        <div className="absolute right-0 top-14 z-50 w-72 rounded-3xl border border-white/10 bg-[#050712]/95 p-5 text-left shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <p className="text-sm font-black text-white">Wallet required</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Install MetaMask, Bifrost, Luminite, or another Flare compatible browser wallet, then
            refresh this page.
          </p>
        </div>
      )}

      {(localError || wallet.errorMessage) && (
        <p className="max-w-72 text-right text-xs font-semibold text-cyan-200">
          {localError ?? wallet.errorMessage}
        </p>
      )}
    </div>
  );
}
