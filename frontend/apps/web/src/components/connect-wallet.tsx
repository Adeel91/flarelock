"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useRef, useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";

type EthereumWindow = Window & {
  ethereum?: unknown;
};

const WALLET_REQUEST_TIMEOUT_MS = 12_000;

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function hasInjectedWallet() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as EthereumWindow).ethereum);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    return String(error.message);
  }

  return "Wallet request failed.";
}

function isUserRejectedError(message: string) {
  const value = message.toLowerCase();

  return (
    value.includes("user rejected") ||
    value.includes("user denied") ||
    value.includes("request rejected") ||
    value.includes("rejected the request") ||
    value.includes("user closed") ||
    value.includes("user cancelled") ||
    value.includes("user canceled")
  );
}

function isProviderNotFoundError(message: string) {
  return (
    message.toLowerCase().includes("provider not found") ||
    message.toLowerCase().includes("no provider")
  );
}

function getFriendlyWalletError(error: unknown) {
  const message = getErrorMessage(error);

  if (isUserRejectedError(message)) {
    return null;
  }

  if (isProviderNotFoundError(message)) {
    return "install";
  }

  return "Wallet connection failed. Please try again.";
}

export function ConnectWallet() {
  const requestIdRef = useRef(0);

  const [walletError, setWalletError] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();

  const connector = connectors.find((item) => {
    const name = item.name.toLowerCase();

    return (
      name.includes("metamask") ||
      name.includes("bifrost") ||
      name.includes("luminite") ||
      name.includes("injected")
    );
  });

  function resetWalletUi(requestId: number) {
    if (requestIdRef.current === requestId) {
      setIsConnecting(false);
    }
  }

  async function handleConnect() {
    if (isConnecting) {
      return;
    }

    setWalletError(null);
    setShowInstallPrompt(false);

    if (!hasInjectedWallet() || !connector) {
      setShowInstallPrompt(true);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsConnecting(true);

    const handleFocus = () => {
      window.setTimeout(() => resetWalletUi(requestId), 500);
    };

    const timeoutId = window.setTimeout(() => {
      resetWalletUi(requestId);
    }, WALLET_REQUEST_TIMEOUT_MS);

    window.addEventListener("focus", handleFocus, { once: true });

    try {
      await connectAsync({ chainId: coston2.id, connector });
    } catch (error) {
      const friendlyError = getFriendlyWalletError(error);

      if (friendlyError === "install") {
        setShowInstallPrompt(true);
      } else if (friendlyError) {
        setWalletError(friendlyError);
      }
    } finally {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", handleFocus);
      resetWalletUi(requestId);
    }
  }

  async function handleSwitchChain() {
    if (isSwitchingNetwork) {
      return;
    }

    setWalletError(null);
    setShowInstallPrompt(false);
    setIsSwitchingNetwork(true);

    try {
      await switchChainAsync({ chainId: coston2.id });
    } catch (error) {
      const friendlyError = getFriendlyWalletError(error);

      if (friendlyError === "install") {
        setShowInstallPrompt(true);
      } else if (friendlyError) {
        setWalletError(friendlyError);
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  }

  if (isConnected && address) {
    const isCoston2 = chainId === coston2.id;

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
          onClick={() => disconnect()}
          type="button"
        >
          {shortenAddress(address)}
        </button>

        {walletError && (
          <p className="max-w-64 text-right text-xs font-semibold text-cyan-200">{walletError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      <button
        className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#050712] shadow-lg shadow-black/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isConnecting}
        onClick={handleConnect}
        type="button"
      >
        {isConnecting ? "Connecting" : "Connect Flare wallet"}
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

      {walletError && (
        <p className="max-w-64 text-right text-xs font-semibold text-cyan-200">{walletError}</p>
      )}
    </div>
  );
}
