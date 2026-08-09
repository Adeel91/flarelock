"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type EthereumProvider = {
  isMetaMask?: boolean;
  isTronLink?: boolean;
  providers?: EthereumProvider[];
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

type EthereumWindow = Window & {
  ethereum?: EthereumProvider;
};

type WalletStatus = "idle" | "connecting" | "connected" | "error";

type WalletContextValue = {
  address: `0x${string}` | null;
  chainId: number | null;
  errorMessage: string | null;
  isConnected: boolean;
  status: WalletStatus;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<`0x${string}`>;
  switchToCoston2: () => Promise<void>;
  watchAsset: (asset: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  }) => Promise<boolean>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getMetaMaskProvider(): EthereumProvider {
  if (typeof window === "undefined") {
    throw new Error("Wallet access is unavailable during server rendering.");
  }

  const ethereum = (window as EthereumWindow).ethereum;

  if (!ethereum) {
    throw new Error("MetaMask wallet not found.");
  }

  const providers = ethereum.providers ?? [ethereum];

  const provider =
    providers.find((candidate) => candidate.isMetaMask === true && candidate.isTronLink !== true) ??
    providers.find((candidate) => candidate.isMetaMask === true);

  if (!provider) {
    throw new Error("MetaMask was not found in this browser profile.");
  }

  return provider;
}

function parseAddress(value: unknown): `0x${string}` | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const account = value.find(
    (item): item is string => typeof item === "string" && /^0x[a-fA-F0-9]{40}$/.test(item),
  );

  return account ? (account as `0x${string}`) : null;
}

function parseChainId(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseInt(value, value.startsWith("0x") ? 16 : 10);

  return Number.isFinite(parsed) ? parsed : null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const providerRef = useRef<EthereumProvider | null>(null);

  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (providerRef.current) {
      return providerRef.current;
    }

    const provider = getMetaMaskProvider();
    providerRef.current = provider;

    return provider;
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      // The provider is accessed only after the user clicks Connect wallet.
      const provider = getProvider();

      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });

      const nextAddress = parseAddress(accounts);

      if (!nextAddress) {
        throw new Error(
          "No MetaMask account was returned. Unlock MetaMask, choose an account, and approve the connection.",
        );
      }

      const currentChain = await provider.request({
        method: "eth_chainId",
      });

      setAddress(nextAddress);
      setChainId(parseChainId(currentChain));
      setStatus("connected");
      setErrorMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed.";

      setAddress(null);
      setChainId(null);
      setStatus("error");
      setErrorMessage(message);

      throw error;
    }
  }, [getProvider]);

  const refreshWallet = useCallback(async () => {
    if (!address) {
      return;
    }

    const provider = getProvider();

    const [accounts, currentChain] = await Promise.all([
      provider.request({ method: "eth_accounts" }),
      provider.request({ method: "eth_chainId" }),
    ]);

    const nextAddress = parseAddress(accounts);

    setAddress(nextAddress);
    setChainId(parseChainId(currentChain));
    setStatus(nextAddress ? "connected" : "idle");
  }, [address, getProvider]);

  const disconnect = useCallback(() => {
    providerRef.current = null;
    setAddress(null);
    setChainId(null);
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  const signMessage = useCallback(
    async (message: string): Promise<`0x${string}`> => {
      if (!address) {
        throw new Error("Connect your wallet before signing.");
      }

      const provider = getProvider();

      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });

      if (typeof signature !== "string" || !signature.startsWith("0x")) {
        throw new Error("MetaMask returned an invalid signature.");
      }

      return signature as `0x${string}`;
    },
    [address, getProvider],
  );

  const watchAsset = useCallback(
    async (asset: {
      address: `0x${string}`;
      symbol: string;
      decimals: number;
    }): Promise<boolean> => {
      if (!address) {
        throw new Error("Connect your wallet before adding FXRP.");
      }

      const provider = getProvider();

      const accepted = await provider.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: asset.address,
            symbol: asset.symbol,
            decimals: asset.decimals,
            chainId: 114,
          },
        },
      });

      return accepted === true;
    },
    [address, getProvider],
  );

  const switchToCoston2 = useCallback(async () => {
    const provider = getProvider();

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x72" }],
      });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? Number((error as { code: unknown }).code)
          : null;

      if (code !== 4902) {
        throw error;
      }

      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x72",
            chainName: "Coston2",
            nativeCurrency: {
              name: "Coston2 Flare",
              symbol: "C2FLR",
              decimals: 18,
            },
            rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
            blockExplorerUrls: ["https://coston2-explorer.flare.network"],
          },
        ],
      });
    }

    const currentChain = await provider.request({
      method: "eth_chainId",
    });

    setChainId(parseChainId(currentChain));
  }, [getProvider]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      errorMessage,
      isConnected: Boolean(address),
      status,
      connect,
      disconnect,
      refreshWallet,
      signMessage,
      switchToCoston2,
      watchAsset,
    }),
    [
      address,
      chainId,
      connect,
      disconnect,
      errorMessage,
      refreshWallet,
      signMessage,
      status,
      switchToCoston2,
      watchAsset,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useFlareWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useFlareWallet must be used inside WalletProvider.");
  }

  return context;
}
