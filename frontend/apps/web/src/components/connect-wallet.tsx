"use client";

import { coston2 } from "@flarelock/web3/chains";
import { usePathname, useRouter } from "next/navigation";
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

type ConnectWalletProps = {
  connectLabel?: string;
  connectedMode?: "menu" | "go_to_app";
  appLabel?: string;
};

export function ConnectWallet({
  connectLabel = "Connect wallet",
  connectedMode = "menu",
  appLabel = "Go to app",
}: ConnectWalletProps) {
  const wallet = useFlareWallet();
  const pathname = usePathname();
  const router = useRouter();

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  async function handleConnect() {
    setShowInstallPrompt(false);
    setLocalError(null);

    try {
      await wallet.connect();

      if (pathname === "/") {
        router.push("/overview");
      }
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

  function handleDisconnect() {
    // Remove every FlareLock-owned localStorage value so pending
    // confidential execution references cannot leak into a new test.
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("flarelock:")) {
        window.localStorage.removeItem(key);
      }
    }

    // Keep this one marker after cleanup so WalletProvider does not
    // immediately restore the MetaMask account on the reload below.
    window.localStorage.setItem("flarelock:wallet:disconnected", "1");

    // Clear FlareLock session values without touching unrelated apps
    // sharing this browser profile.
    for (const key of Object.keys(window.sessionStorage)) {
      if (key.startsWith("flarelock:")) {
        window.sessionStorage.removeItem(key);
      }
    }

    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("flarelock:activity-signature:")) {
        window.localStorage.removeItem(key);
      }
    }

    wallet.disconnect();

    window.location.reload();
  }

  if (wallet.isConnected && wallet.address) {
    const isCoston2 = wallet.chainId === coston2.id;

    if (connectedMode === "go_to_app") {
      return (
        <div className="relative flex items-center gap-2">
          {!isCoston2 ? (
            <button
              className="clean-button rounded-full bg-amber-100 px-4 py-2.5 text-[12px] font-semibold text-amber-800 transition hover:bg-amber-200 disabled:opacity-60 sm:px-5 sm:py-3 sm:text-[13px]"
              disabled={isSwitchingNetwork}
              onClick={handleSwitchChain}
              type="button"
            >
              {isSwitchingNetwork ? "Switching…" : "Switch network"}
            </button>
          ) : null}

          <button
            className="clean-button inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-[12px] border border-slate-200 bg-white px-6 text-[13px] font-semibold text-[#0a0b0d] transition hover:border-slate-300 hover:shadow-sm"
            onClick={() => router.push("/overview")}
            type="button"
          >
            <span>{appLabel}</span>

            <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12h14M14 7l5 5-5 5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>

          {localError || wallet.errorMessage ? (
            <p className="absolute right-0 top-14 w-72 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-600 shadow-xl">
              {localError ?? wallet.errorMessage}
            </p>
          ) : null}
        </div>
      );
    }

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

        <div className="relative">
          <button
            aria-expanded={showWalletMenu}
            aria-haspopup="menu"
            className="clean-button inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-2.5 text-[12px] font-semibold text-[#0a0b0d] transition hover:border-slate-300 hover:shadow-sm sm:px-5 sm:py-3 sm:text-[15px]"
            onClick={() => setShowWalletMenu((open) => !open)}
            title="Wallet menu"
            type="button"
          >
            <span>{shortenAddress(wallet.address)}</span>

            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                showWalletMenu ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>

          {showWalletMenu ? (
            <>
              <button
                aria-label="Close wallet menu"
                className="fixed inset-0 z-[78] cursor-default bg-transparent"
                onClick={() => setShowWalletMenu(false)}
                type="button"
              />

              <div
                className="absolute right-0 top-[calc(100%+8px)] z-[79] w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
                role="menu"
              >
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Connected wallet
                  </p>

                  <p
                    className="mt-1 truncate font-mono text-[10px] text-slate-600"
                    title={wallet.address}
                  >
                    {shortenAddress(wallet.address)}
                  </p>
                </div>

                <button
                  className="mt-1 flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  onClick={() => {
                    setShowWalletMenu(false);
                    router.push("/overview");
                  }}
                  role="menuitem"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 10.5 12 4l8 6.5V20H5a1 1 0 0 1-1-1v-8.5Z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                    <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  Overview
                </button>

                <button
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[12px] font-semibold text-red-600 transition hover:bg-red-50"
                  onClick={() => {
                    setShowWalletMenu(false);
                    handleDisconnect();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                  Disconnect
                </button>
              </div>
            </>
          ) : null}
        </div>

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
        {wallet.status === "connecting" ? "Connecting…" : connectLabel}
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
