import Link from "next/link";

import { ProductShell } from "@/components/product-shell";
import { FirelightProduct } from "@/components/yield/firelight-product";

export default function FirelightFxrpPage() {
  return (
    <ProductShell hideRightRail title="Earn">
      <section className="px-8 py-7">
        <Link className="text-sm font-semibold text-slate-500 hover:text-black" href="/earn">
          ← Earn products
        </Link>

        <div className="mt-8 mb-9">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Firelight
          </p>

          <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em]">FXRP Vault</h1>

          <p className="mt-2 max-w-2xl text-[14px] leading-6 text-slate-500">
            Manage the Firelight FXRP product without mixing deposits and withdrawals into the same
            screen.
          </p>
        </div>

        <FirelightProduct />
      </section>
    </ProductShell>
  );
}
