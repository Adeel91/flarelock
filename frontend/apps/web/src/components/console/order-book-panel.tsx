"use client";

const asks = [
  { amount: "6.40", price: "143.20", total: "916.48" },
  { amount: "4.85", price: "142.95", total: "693.31" },
  { amount: "2.10", price: "142.70", total: "299.67" },
  { amount: "1.75", price: "142.55", total: "249.46" },
];

const bids = [
  { amount: "3.30", price: "142.10", total: "468.93" },
  { amount: "5.75", price: "141.80", total: "815.35" },
  { amount: "8.20", price: "141.45", total: "1160.00" },
  { amount: "2.90", price: "141.10", total: "409.19" },
];

function Row({
  amount,
  price,
  total,
  type,
}: {
  amount: string;
  price: string;
  total: string;
  type: "ask" | "bid";
}) {
  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl px-4 py-3 text-base transition hover:bg-slate-50">
      <p
        className={type === "ask" ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}
      >
        {price}
      </p>
      <p className="text-right font-medium text-slate-700">{amount}</p>
      <p className="text-right font-medium text-slate-500">{total}</p>
    </div>
  );
}

export function OrderBookPanel() {
  return (
    <aside className="clean-card rounded-[2rem] p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Order book
          </p>
          <h2 className="mt-2 text-4xl font-normal tracking-[-0.04em] text-[#0a0b0d]">
            FXRP/C2FLR
          </h2>
        </div>

        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Mock
        </span>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 border-b border-slate-100 px-4 pb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        <p>Price</p>
        <p className="text-right">FXRP</p>
        <p className="text-right">C2FLR</p>
      </div>

      <div className="mt-2 grid gap-1">
        {asks.map((row) => (
          <Row key={`${row.price}-ask`} type="ask" {...row} />
        ))}
      </div>

      <div className="my-5 rounded-[1.5rem] bg-blue-50 p-5 text-center">
        <p className="text-5xl font-medium tracking-[-0.05em] text-[#0a0b0d]">142.35</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#0052ff]">
          Private quote mid
        </p>
      </div>

      <div className="grid gap-1">
        {bids.map((row) => (
          <Row key={`${row.price}-bid`} type="bid" {...row} />
        ))}
      </div>

      <div className="mt-7 rounded-[1.5rem] bg-slate-50 p-5">
        <p className="text-lg font-medium text-[#0a0b0d]">Coming next</p>
        <p className="mt-2 text-base leading-7 text-slate-600">
          Signed private intents will appear here as matched liquidity.
        </p>
      </div>
    </aside>
  );
}
