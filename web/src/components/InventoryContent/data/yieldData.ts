import { Yield } from "@/components/InventoryContent/columns";
import { nanoid } from "nanoid";

export const yieldData: Yield[] = [
  {
    id: nanoid(),
    yield: 12.33,
    status: "claimable",
    pool: "ETH-fUSDC",
  },
  {
    id: nanoid(),
    yield: 12.33,
    status: "claimable",
    pool: "ETH x fUSDC",
  },
  {
    id: nanoid(),
    yield: 12.33,
    status: "claimed",
    pool: "ETH x fUSDC",
  },
  {
    id: nanoid(),
    yield: 12.33,
    status: "claimed",
    pool: "ETH x fUSDC",
  },
];
