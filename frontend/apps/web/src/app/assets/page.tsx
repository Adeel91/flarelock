import { FxrpAssetRow } from "@/components/assets/fxrp-asset-row";
import { BitcoinIcon, DogeIcon } from "@/components/brand/asset-icons";
import { ProductShell } from "@/components/product-shell";

export default function AssetsPage() {
  return (
    <ProductShell title="Assets">
      <div>
        <div className="border-b border-slate-200 px-8 py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Assets</p>

          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em] text-[#101217]">
            Your FAssets
          </h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
            See your available balance, protocol positions and supported underlying networks.
          </p>
        </div>

        <div className="grid grid-cols-[minmax(260px,1.4fr)_0.8fr_0.8fr_0.7fr_auto] gap-5 border-b border-slate-200 bg-[#fafbfc] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          <span>Asset</span>
          <span>Available</span>
          <span>In Earn</span>
          <span>Status</span>
          <span />
        </div>

        <FxrpAssetRow />

        <div className="grid grid-cols-[minmax(260px,1.4fr)_0.8fr_0.8fr_0.7fr_auto] items-center gap-5 border-b border-slate-100 px-6 py-5 opacity-45">
          <div className="flex items-center gap-4">
            <BitcoinIcon size={40} />

            <div>
              <p className="text-[14px] font-semibold">FBTC</p>

              <p className="mt-1 text-[12px] text-slate-500">Bitcoin FAsset</p>
            </div>
          </div>

          <span className="text-[13px]">—</span>
          <span className="text-[13px]">—</span>

          <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
            Coming soon
          </span>

          <span />
        </div>

        <div className="grid grid-cols-[minmax(260px,1.4fr)_0.8fr_0.8fr_0.7fr_auto] items-center gap-5 border-b border-slate-100 px-6 py-5 opacity-45">
          <div className="flex items-center gap-4">
            <DogeIcon size={40} />

            <div>
              <p className="text-[14px] font-semibold">FDOGE</p>

              <p className="mt-1 text-[12px] text-slate-500">Dogecoin FAsset</p>
            </div>
          </div>

          <span className="text-[13px]">—</span>
          <span className="text-[13px]">—</span>

          <span className="w-fit rounded-md bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
            Coming soon
          </span>

          <span />
        </div>
      </div>
    </ProductShell>
  );
}
