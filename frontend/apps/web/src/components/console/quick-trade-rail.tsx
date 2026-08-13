"use client";

import { coston2 } from "@flarelock/web3/chains";

import { ConvertTicket } from "@/components/console/convert-ticket";
import { useFlareWallet } from "@/components/wallet/wallet-provider";

export function QuickTradeRail() {
  const { chainId, isConnected } = useFlareWallet();

  const isCoston2 = chainId === coston2.id;

  return (
    <div className="min-h-full min-w-0 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
          Quick trade
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold tracking-[-0.035em]">FXRP / C2FLR</h2>

            <p className="mt-1 text-[10px] text-slate-500">Private execution</p>
          </div>

          <span className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Coston2
          </span>
        </div>
      </div>

      <div className="p-2 sm:p-3">
        <ConvertTicket disabled={!isConnected || !isCoston2} />
      </div>

      <div className="border-t border-slate-200 px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">Price</p>

            <p className="mt-1 text-[10px] font-semibold">FTSOv2</p>
          </div>

          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">Match</p>

            <p className="mt-1 text-[10px] font-semibold">Private</p>
          </div>

          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Settle
            </p>

            <p className="mt-1 text-[10px] font-semibold">Onchain</p>
          </div>
        </div>
      </div>
    </div>
  );
}
