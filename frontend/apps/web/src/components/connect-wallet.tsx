"use client";

import { coston2 } from "@flarelock/web3/chains";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isUserRejectedError(message: string) {
  return message.toLowerCase().includes("user rejected");
}

export function ConnectWallet() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { isPending: isSwitching, switchChain } = useSwitchChain();

  const connector = connectors.find((item) => {
    const name = item.name.toLowerCase();

    return (
      name.includes("metamask") ||
      name.includes("bifrost") ||
      name.includes("luminite") ||
      name.includes("injected")
    );
  });

  const shouldShowError = error && !isUserRejectedError(error.message);

  if (isConnected && address) {
    const isCoston2 = chainId === coston2.id;

    return (
      <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        {!isCoston2 && (
          <button
            className="rounded-full bg-cyan-200 px-5 py-3 text-sm font-black text-[#050712] transition hover:bg-white disabled:opacity-60"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: coston2.id })}
            type="button"
          >
            {isSwitching ? "Switching" : "Switch to Coston2"}
          </button>
        )}

        <button
          className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#050712] transition hover:bg-cyan-200"
          onClick={() => disconnect()}
          type="button"
        >
          {shortenAddress(address)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-full bg-white px-5 py-3 text-sm font-black text-[#050712] shadow-lg shadow-black/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ chainId: coston2.id, connector })}
        type="button"
      >
        {isPending ? "Connecting" : "Connect Flare wallet"}
      </button>

      {shouldShowError && (
        <p className="max-w-56 text-right text-xs font-semibold text-cyan-200">{error.message}</p>
      )}
    </div>
  );
}
