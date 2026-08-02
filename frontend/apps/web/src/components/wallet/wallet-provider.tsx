"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type WalletStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (value: unknown) => void) => void;
  removeListener?: (event: string, listener: (value: unknown) => void) => void;
};

type EthereumWindow = Window & {
  ethereum?: EthereumProvider;
};

type WalletContextValue = {
  address: `0x${string}` | null;
  chainId: number | null;
  status: WalletStatus;
  isConnected: boolean;
  errorMessage: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToCoston2: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereum() {
  if (typeof window === "undefined") {
    return null;
  }

  const ethereum = (window as EthereumWindow).ethereum;

  if (!ethereum) {
    return null;
  }

  const metamaskProvider = ethereum.providers?.find((provider) => provider.isMetaMask);

  return metamaskProvider ?? ethereum;
}

function parseChainId(value: unknown) {
  if (typeof value === "string") {
    return Number.parseInt(value, 16);
  }

  if (typeof value === "number") {
    return value;
  }

  return null;
}

function getFirstAccount(value: unknown): `0x${string}` | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const [account] = value;

  if (typeof account === "string" && account.startsWith("0x")) {
    return account as `0x${string}`;
  }

  return null;
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    return Number(error.code);
  }

  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setStatus("disconnected");
      return;
    }

    const [accounts, chain] = await Promise.all([
      ethereum.request({ method: "eth_accounts" }),
      ethereum.request({ method: "eth_chainId" }),
    ]);

    const nextAddress = getFirstAccount(accounts);
    const nextChainId = parseChainId(chain);

    setAddress(nextAddress);
    setChainId(nextChainId);
    setStatus(nextAddress ? "connected" : "disconnected");
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      throw new Error("Wallet not found.");
    }

    setStatus("connecting");
    setErrorMessage(null);

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const chain = await ethereum.request({ method: "eth_chainId" });

      const nextAddress = getFirstAccount(accounts);
      const nextChainId = parseChainId(chain);

      setAddress(nextAddress);
      setChainId(nextChainId);
      setStatus(nextAddress ? "connected" : "disconnected");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Wallet connection failed.");
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus("disconnected");
  }, []);

  const switchToCoston2 = useCallback(async () => {
    const ethereum = getEthereum();

    if (!ethereum) {
      throw new Error("Wallet not found.");
    }

    setErrorMessage(null);

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x72" }],
      });
    } catch (error) {
      if (getErrorCode(error) !== 4902) {
        throw error;
      }

      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            blockExplorerUrls: ["https://coston2-explorer.flare.network"],
            chainId: "0x72",
            chainName: "Coston2",
            nativeCurrency: {
              decimals: 18,
              name: "Coston2 Flare",
              symbol: "C2FLR",
            },
            rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
          },
        ],
      });
    }

    await refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    refreshWallet().catch(() => {
      setStatus("disconnected");
    });

    const ethereum = getEthereum();

    if (!ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (value: unknown) => {
      const nextAddress = getFirstAccount(value);

      setAddress(nextAddress);
      setStatus(nextAddress ? "connected" : "disconnected");
    };

    const handleChainChanged = (value: unknown) => {
      setChainId(parseChainId(value));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [refreshWallet]);

  const value = useMemo(
    () => ({
      address,
      chainId,
      connect,
      disconnect,
      errorMessage,
      isConnected: Boolean(address),
      status,
      switchToCoston2,
    }),
    [address, chainId, connect, disconnect, errorMessage, status, switchToCoston2],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useFlareWallet() {
  const value = useContext(WalletContext);

  if (!value) {
    throw new Error("useFlareWallet must be used inside WalletProvider.");
  }

  return value;
}
