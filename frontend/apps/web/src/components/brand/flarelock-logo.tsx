type FlareLockLogoProps = {
  className?: string;
  priority?: boolean;
  compact?: boolean;
};

export function FlareLockLogo({ className = "", compact = false }: FlareLockLogoProps) {
  return (
    <div className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[#c10f45] shadow-[0_7px_20px_rgba(193,15,69,0.18)] sm:h-10 sm:w-10">
        <svg
          aria-hidden="true"
          className="h-[23px] w-[23px] text-white sm:h-[25px] sm:w-[25px]"
          fill="none"
          viewBox="0 0 32 32"
        >
          {/* Stylized F / execution path */}
          <path
            d="M7 8.25h15.25c1.1 0 1.75.53 1.75 1.45 0 .66-.38 1.18-1.13 1.54L13 15.85v2.27l7.92-3.53c1.26-.56 2.18-.2 2.18.87 0 .65-.37 1.16-1.12 1.51L13 21.16V25H8.6V12.15H7V8.25Z"
            fill="currentColor"
          />

          {/* Lock detail */}
          <rect
            x="18.1"
            y="19"
            width="8.2"
            height="6.7"
            rx="2"
            fill="#c10f45"
            stroke="white"
            strokeWidth="1.65"
          />

          <path
            d="M20.15 19v-1.8a2.05 2.05 0 0 1 4.1 0V19"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="1.65"
          />

          <circle cx="22.2" cy="22.25" r=".85" fill="white" />
        </svg>

        <span className="pointer-events-none absolute inset-x-1 bottom-0 h-px bg-white/20" />
      </span>

      {!compact && (
        <span className="flex min-w-0 flex-col">
          <span className="whitespace-nowrap text-[18px] font-semibold leading-none tracking-[-0.045em] text-[#101217] sm:text-[20px]">
            Flare<span className="text-[#c10f45]">Lock</span>
          </span>

          <span className="mt-1 hidden whitespace-nowrap text-[7px] font-bold uppercase leading-none tracking-[0.17em] text-slate-400 sm:block">
            Private asset execution
          </span>
        </span>
      )}
    </div>
  );
}
