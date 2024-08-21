import { createPublicClient, http } from "viem";
import { arbitrumStylusTestnet } from "../config/arbitrumStylusTestnet";

export const publicClient = createPublicClient({
  chain: arbitrumStylusTestnet,
  transport: http(),
});
