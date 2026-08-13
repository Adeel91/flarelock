import Link from "next/link";

import { FlareIcon, XrpIcon } from "@/components/brand/asset-icons";
import { ProductShell } from "@/components/product-shell";

export default function EarnPage() {
  return (
    <ProductShell hideRightRail title="Earn">
      <div>
        <div className="border-b border-slate-200 px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Earn</p>

          <h1 className="mt-2 text-[27px] font-semibold tracking-[-0.045em] sm:text-[32px]">
            Earn with FXRP
          </h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
            Deploy FXRP into supported Flare products and manage your position separately from
            trading.
          </p>
        </div>

        <div className="hidden grid-cols-[minmax(320px,1.5fr)_0.7fr_0.8fr_auto] gap-5 border-b border-slate-200 bg-[#fafbfc] px-8 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 md:grid">
          <span>Product</span>
          <span>Asset</span>
          <span>Exit model</span>
          <span />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 border-b border-slate-100 px-4 py-5 sm:px-6 md:grid-cols-[minmax(320px,1.5fr)_0.7fr_0.8fr_auto] md:items-center md:gap-5 xl:px-8 xl:py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <FlareIcon size={44} />

              <div className="absolute -bottom-1 -right-2">
                <XrpIcon size={24} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="text-[16px] font-semibold">Firelight FXRP Vault</p>

                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                  LIVE
                </span>
              </div>

              <p className="mt-1 text-[12px] text-slate-500">
                Deposit FXRP into the live Firelight vault on Coston2.
              </p>
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold">FXRP</p>

            <p className="mt-1 text-[10px] text-slate-400">FTestXRP</p>
          </div>

          <div>
            <p className="text-[13px] font-semibold">Period based</p>

            <p className="mt-1 text-[10px] text-slate-400">Request then claim</p>
          </div>

          <Link
            className="inline-flex h-[46px] w-full min-w-[104px] items-center justify-center rounded-[10px] bg-[#c10f45] sm:w-auto px-5 font-sans text-[14px] font-medium leading-none tracking-[-0.015em] !text-white shadow-[0_6px_16px_rgba(193,15,69,0.16)] transition hover:bg-[#ce174d]"
            href="/earn/firelight-fxrp"
          >
            Manage
          </Link>
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-7 xl:px-8">
          <div className="max-w-3xl rounded-xl border border-slate-200 bg-[#fafbfc] p-5">
            <p className="text-[13px] font-semibold">How Firelight works</p>

            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-bold text-[#c10f45]">01</p>

                <p className="mt-2 text-[13px] font-semibold">Deposit FXRP</p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Deposit the Coston2 FXRP test token into the vault.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#c10f45]">02</p>

                <p className="mt-2 text-[13px] font-semibold">Hold vault shares</p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Your position is represented by Firelight vault shares.
                </p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#c10f45]">03</p>

                <p className="mt-2 text-[13px] font-semibold">Request exit</p>

                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Withdrawals are period based and become claimable later.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProductShell>
  );
}
