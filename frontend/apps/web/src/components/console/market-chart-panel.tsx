"use client";

const volumeBars = [42, 68, 52, 88, 61, 96, 74, 58, 91, 66, 102, 82, 56, 78, 64, 94, 72, 108];

const timeLabels = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00"];

export function MarketChartPanel() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#242832] bg-[#11151d] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-6 py-5">
        <div>
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Private price stream
          </p>

          <div className="mt-1 flex items-end gap-3">
            <p className="text-[22px] font-semibold tracking-[-0.045em] text-white">FXRP/C2FLR</p>

            <span className="mb-0.5 text-xs font-semibold text-emerald-300">+2.18%</span>
          </div>
        </div>

        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {["1H", "4H", "1D"].map((item) => (
            <button
              className={
                item === "1H"
                  ? "rounded-full bg-white px-4 py-2 text-xs font-bold text-[#111318]"
                  : "rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-white"
              }
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[470px] overflow-hidden bg-[#0b0f17]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:84px_64px]" />

        <div className="absolute left-6 top-6 z-10 rounded-2xl border border-white/10 bg-[#11151d]/90 px-5 py-4 backdrop-blur-xl">
          <p className="text-[11px] font-semibold text-slate-500">Private midpoint</p>

          <p className="mt-1 text-[34px] font-semibold tracking-[-0.07em] text-white">142.35</p>

          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            <span className="text-[11px] font-semibold text-emerald-300">Live FTSOv2</span>
          </div>
        </div>

        <div className="absolute right-6 top-7 z-10 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Visibility
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-300">Aggregated only</p>
        </div>

        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-[54px] h-[285px] w-full"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 1000 300"
        >
          <defs>
            <linearGradient id="privateChartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(230,32,88,0.24)" />
              <stop offset="100%" stopColor="rgba(230,32,88,0)" />
            </linearGradient>

            <filter id="chartGlow">
              <feGaussianBlur result="blur" stdDeviation="4" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M0 246
               C60 231 92 206 145 217
               C202 230 238 177 292 188
               C350 201 381 133 442 143
               C495 153 527 113 578 124
               C638 137 670 84 725 97
               C785 112 819 67 870 78
               C916 89 950 54 1000 61
               L1000 300 L0 300 Z"
            fill="url(#privateChartFill)"
          />

          <path
            d="M0 246
               C60 231 92 206 145 217
               C202 230 238 177 292 188
               C350 201 381 133 442 143
               C495 153 527 113 578 124
               C638 137 670 84 725 97
               C785 112 819 67 870 78
               C916 89 950 54 1000 61"
            fill="none"
            filter="url(#chartGlow)"
            stroke="#f04472"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>

        <div className="absolute bottom-[58px] left-6 right-6 flex h-[110px] items-end gap-2">
          {volumeBars.map((height, index) => (
            <div className="flex flex-1 items-end" key={`${height}-${index}`}>
              <div
                className={
                  index % 4 === 0
                    ? "w-full rounded-t-sm bg-rose-400/50"
                    : "w-full rounded-t-sm bg-emerald-300/45"
                }
                style={{ height }}
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/[0.06] bg-[#0d1119]/90 px-6 py-4">
          {timeLabels.map((time) => (
            <span className="mono text-[10px] font-medium text-slate-600" key={time}>
              {time}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
