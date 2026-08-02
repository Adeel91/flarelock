"use client";

const candles = [
  { h: 58, y: 66 },
  { h: 92, y: 34 },
  { h: 74, y: 44 },
  { h: 118, y: 26 },
  { h: 86, y: 38 },
  { h: 132, y: 18 },
  { h: 104, y: 30 },
  { h: 78, y: 46 },
  { h: 126, y: 22 },
  { h: 95, y: 36 },
  { h: 142, y: 12 },
  { h: 110, y: 28 },
];

export function MarketChartPanel() {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080d18]/95 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Private price stream
          </p>
          <p className="mt-1 text-xl font-black tracking-[-0.05em] text-white">FXRP/C2FLR</p>
        </div>

        <div className="flex rounded-full border border-white/10 bg-white/[0.035] p-1">
          {["1H", "4H", "1D"].map((item) => (
            <button
              className={
                item === "1H"
                  ? "rounded-full bg-cyan-200 px-3 py-1.5 text-xs font-black text-[#06101c]"
                  : "rounded-full px-3 py-1.5 text-xs font-black text-slate-500"
              }
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[315px] bg-[#040814] p-5">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_64px]" />

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 900 315"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0.22)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
          </defs>

          <path
            d="M0 230 C80 210 110 190 170 208 C250 232 280 126 350 146 C430 170 470 82 535 104 C610 128 650 60 720 82 C800 106 830 56 900 68 L900 315 L0 315 Z"
            fill="url(#chartFill)"
          />

          <path
            d="M0 230 C80 210 110 190 170 208 C250 232 280 126 350 146 C430 170 470 82 535 104 C610 128 650 60 720 82 C800 106 830 56 900 68"
            fill="none"
            stroke="rgba(103,232,249,0.95)"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>

        <div className="absolute bottom-6 left-5 right-5 flex items-end justify-between gap-2">
          {candles.map((candle, index) => (
            <div className="flex flex-1 items-end justify-center" key={`${candle.h}-${index}`}>
              <div
                className={
                  index % 3 === 0
                    ? "w-3 rounded-full bg-red-300/80"
                    : "w-3 rounded-full bg-emerald-300/80"
                }
                style={{ height: candle.h, transform: `translateY(${candle.y}px)` }}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-[#080d18]/80 p-4 backdrop-blur-xl">
          <p className="text-xs font-semibold text-slate-500">Private mid</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.08em] text-white">142.35</p>
          <p className="mt-1 text-xs font-black text-emerald-200">+2.18%</p>
        </div>
      </div>
    </section>
  );
}
