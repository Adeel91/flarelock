"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { XrpIcon } from "@/components/brand/asset-icons";
import { useFlareWallet } from "@/components/wallet/wallet-provider";
import { getFirelightWallet, getFxrpRedemptionStatus } from "@/lib/api";

export function FxrpAssetRow() {
  const { address } = useFlareWallet();

  const balance = useQuery({
    queryKey: ["assets-fxrp", address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      const [fxrp, firelight] = await Promise.all([
        getFxrpRedemptionStatus(address),
        getFirelightWallet(address),
      ]);

      return {
        available: fxrp.balance.formatted,
        inFirelight: firelight.position.assetsFormatted,
      };
    },
    enabled: Boolean(address),
  });

  return (
    <div className="grid grid-cols-1 items-start gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 md:grid-cols-[minmax(260px,1.4fr)_0.8fr_0.8fr_0.7fr_auto] md:items-center md:gap-5">
      <div className="flex items-center gap-4">
        <XrpIcon size={40} />

        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold">FXRP</p>

            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
              LIVE
            </span>
          </div>

          <p className="mt-1 text-[12px] text-slate-500">Coston2 test token: FTestXRP</p>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold">
          {address ? (balance.data?.available ?? "Loading...") : "Connect wallet"}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">FXRP</p>
      </div>

      <div>
        <p className="text-[13px] font-semibold">
          {address ? (balance.data?.inFirelight ?? "Loading...") : "—"}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">Firelight</p>
      </div>

      <span className="w-fit rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">
        Available
      </span>

      <Link
        className="inline-flex h-10 w-full min-w-[92px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-4 text-[12px] font-semibold text-[#101217] transition hover:bg-slate-50 sm:w-auto"
        href="/earn/firelight-fxrp"
      >
        Manage
      </Link>
    </div>
  );
}
