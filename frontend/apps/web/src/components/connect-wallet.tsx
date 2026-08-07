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
      <div className="relative flex items-center gap-2">
        {!isCoston2 && (
          <button
            className="clean-button rounded-full bg-amber-100 px-5 py-3 text-[15px] font-semibold text-amber-800 hover:bg-amber-200 disabled:opacity-60"
            disabled={isSwitchingNetwork}
            onClick={handleSwitchChain}
            type="button"
          >
            {isSwitchingNetwork ? "Switching" : "Switch network"}
          </button>
        )}

        <button
          className="clean-button rounded-full border border-slate-200/90 bg-white px-5 py-3 text-[15px] font-semibold text-[#0a0b0d] hover:border-slate-300 hover:shadow-sm"
          onClick={wallet.disconnect}
          type="button"
        >
          {shortenAddress(wallet.address)}
        </button>

        {(localError || wallet.errorMessage) && (
          <p className="absolute right-0 top-14 w-72 rounded-2xl border border-slate-200/90 bg-white p-3 text-xs font-medium text-slate-600 shadow-xl">
            {localError ?? wallet.errorMessage}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="clean-button rounded-full border border-slate-200/90 bg-white px-5 py-3 text-[15px] font-semibold text-[#0a0b0d] hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        disabled={wallet.status === "connecting"}
        onClick={handleConnect}
        type="button"
      >
        {wallet.status === "connecting" ? "Connecting" : "Connect wallet"}
      </button>

      {showInstallPrompt && (
        <div className="absolute right-0 top-14 z-50 w-72 rounded-3xl border border-slate-200/90 bg-white p-5 text-left shadow-2xl">
          <p className="text-sm font-semibold text-slate-950">Wallet required</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Install MetaMask in this browser profile, then refresh this page.
          </p>
        </div>
      )}

      {(localError || wallet.errorMessage) && (
        <p className="absolute right-0 top-14 w-72 rounded-2xl border border-slate-200/90 bg-white p-3 text-xs font-medium text-slate-600 shadow-xl">
          {localError ?? wallet.errorMessage}
        </p>
      )}
    </div>
  );
}
