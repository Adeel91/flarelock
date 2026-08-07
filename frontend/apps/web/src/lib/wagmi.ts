import { coston2, flare } from "@flarelock/web3/chains";
import { createConfig, http } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [coston2, flare],
  connectors: [],
  multiInjectedProviderDiscovery: false,
  transports: {
    [coston2.id]: http(),
    [flare.id]: http(),
  },
  ssr: true,
});
