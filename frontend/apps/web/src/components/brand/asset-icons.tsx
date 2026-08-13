type IconProps = {
  size?: number;
  className?: string;
};

export function FlareLockLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#c10f45] shadow-[0_7px_18px_rgba(193,15,69,0.18)]">
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M7.2 10V8.5C7.2 5.9 9.2 4 12 4s4.8 1.9 4.8 4.5"
            fill="none"
            stroke="white"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <rect fill="white" height="9" rx="2.2" width="14" x="5" y="9" />
          <circle cx="12" cy="13.5" fill="#c10f45" r="1.4" />
        </svg>
      </div>

      {!compact && (
        <div>
          <p className="text-[17px] font-semibold tracking-[-0.045em] text-[#101217]">FlareLock</p>

          <p className="mt-0.5 text-[7px] font-bold tracking-[0.18em] text-slate-400">
            PRIVATE FASSET EXECUTION
          </p>
        </div>
      )}
    </div>
  );
}

export function XrpIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      aria-label="XRP"
      className={className}
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
    >
      <title>XRP</title>

      <circle cx="24" cy="24" fill="#111318" r="24" />

      <path
        d="M11.5 13.5H17L21.8 18.3C23 19.5 25 19.5 26.2 18.3L31 13.5H36.5L29.2 20.8C26.3 23.7 21.7 23.7 18.8 20.8L11.5 13.5Z"
        fill="white"
      />

      <path
        d="M11.5 34.5H17L21.8 29.7C23 28.5 25 28.5 26.2 29.7L31 34.5H36.5L29.2 27.2C26.3 24.3 21.7 24.3 18.8 27.2L11.5 34.5Z"
        fill="white"
      />
    </svg>
  );
}

export function BitcoinIcon({ size = 42, className = "" }: IconProps) {
  return (
    <div
      aria-label="Bitcoin"
      className={`grid shrink-0 place-items-center rounded-full bg-[#f7931a] font-bold text-white ${className}`}
      role="img"
      style={{
        height: size,
        width: size,
        fontSize: size * 0.5,
      }}
    >
      ₿
    </div>
  );
}

export function DogeIcon({ size = 42, className = "" }: IconProps) {
  return (
    <div
      aria-label="Dogecoin"
      className={`grid shrink-0 place-items-center rounded-full bg-[#c2a633] font-bold text-white ${className}`}
      role="img"
      style={{
        height: size,
        width: size,
        fontSize: size * 0.5,
      }}
    >
      Ð
    </div>
  );
}

export function FlareIcon({ size = 42, className = "" }: IconProps) {
  return (
    <svg
      aria-label="Flare"
      className={className}
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
    >
      <title>Flare</title>

      <circle cx="24" cy="24" fill="#c10f45" r="24" />

      <path
        d="M14 18.5C14 14.9 16.9 12 20.5 12H34V17.5H21.2C20.3 17.5 19.5 18.3 19.5 19.2V21H30V26.5H19.5V36H14V18.5Z"
        fill="white"
      />

      <circle cx="34" cy="34" fill="white" r="3.1" />
    </svg>
  );
}

export function AssetPair({ base, quote }: { base: "xrp" | "btc" | "doge"; quote?: boolean }) {
  const icon =
    base === "xrp" ? (
      <XrpIcon size={42} />
    ) : base === "btc" ? (
      <BitcoinIcon size={42} />
    ) : (
      <DogeIcon size={42} />
    );

  return (
    <div className="flex items-center">
      {icon}

      {quote && <FlareIcon className="-ml-2 ring-2 ring-white" size={34} />}
    </div>
  );
}
