"use client";

import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { http } from "viem";
import { arbitrumStylusTestnet } from "./arbitrumStylusTestnet";

// Get projectId at https://cloud.walletconnect.com
export const projectId =
  process.env.NEXT_PUBLIC_LONGTAIL_WALLETCONNECT_PROJECT_ID;

if (!projectId) throw new Error("Project ID is not defined");

const metadata = {
  name: "Longtail",
  description: "",
  url: "https://long.so",
  icons: [""],
};

// Create wagmiConfig
const chains = [arbitrumStylusTestnet] as const;

export const config = defaultWagmiConfig({
  chains,
  projectId,
  transports: {
    [arbitrumStylusTestnet.id]: http("https://testnet-rpc.superposition.so"),
  },
  metadata,
  ssr: true,
});
