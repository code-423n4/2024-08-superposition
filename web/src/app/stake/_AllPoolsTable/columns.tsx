import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { usdFormat } from "@/lib/usdFormat";
import { Button } from "@/components/ui/button";
import Sort from "@/assets/icons/sort.svg";
import Link from "next/link";
import TokenIridescent from "@/assets/icons/iridescent-token.svg";
import Ethereum from "@/assets/icons/ethereum.svg";
import Token from "@/assets/icons/token.svg";
import { TokenIcon } from "@/components/TokenIcon";
import { getTokenFromAddress } from "@/config/tokens";

export type Token = {
  name: string;
};

export type Pool = {
  id: string;
  tokens: [Token, Token];
  totalValueLocked: number;
  fees: number;
  volume: number;
  rewards: number;
  annualPercentageYield: number;
  claimable: boolean;
  boosted?: boolean;
  liquidityRange: [string, string];
};

export const columns: ColumnDef<Pool>[] = [
  {
    accessorKey: "tokens",
    header: "Pair",
    cell: ({ row }) => {
      const token = getTokenFromAddress(row.original.id);
      return (
        <Link href={`/stake/pool?id=${row.original.id}`}>
          <Badge className="h-[35.61px] cursor-pointer gap-1 pl-1 text-2xs md:text-xs">
            <div className={"flex flex-row items-center"}>
              <TokenIcon src={token?.icon} className="size-[25px] rounded-lg" />
              <TokenIridescent className={"-ml-2 mb-3 size-[18px]"} />
            </div>
            <div className={"iridescent-text flex flex-row items-center gap-2"}>
              {row.original.tokens[0].name}
              <div className={"mb-1.5"}>{row.original.tokens[1].name}</div>
            </div>
          </Badge>
        </Link>
      );
    },
  },
  {
    accessorKey: "totalValueLocked",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TVL
          <Sort className="ml-2 size-3" />
        </div>
      );
    },
    cell: ({ row }) => {
      return usdFormat(row.original.totalValueLocked);
    },
  },
  {
    accessorKey: "fees",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fees
          <Sort className="ml-2 size-3" />
        </div>
      );
    },
    cell: ({ row }) => {
      return usdFormat(row.original.fees);
    },
  },
  {
    accessorKey: "volume",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Volume
          <Sort className="ml-2 size-3" />
        </div>
      );
    },
    cell: ({ row }) => {
      return usdFormat(row.original.volume);
    },
  },
  {
    accessorKey: "rewards",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rewards
          <Sort className="ml-2 size-3" />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <Badge className="h-[19px] gap-1 px-0.5 pr-1 group-hover:invert">
          <div className={"flex flex-row items-center"}>
            <TokenIridescent className={"size-[18px]"} />
            <Ethereum className={"-ml-2 size-[14px] invert"} />
          </div>
          {usdFormat(row.original.rewards)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "annualPercentageYield",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer flex-row items-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          APY
          <Sort className="ml-2 size-3" />
        </div>
      );
    },
    cell: ({ row }) => {
      return `${row.original.annualPercentageYield.toFixed(2)}%`;
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row gap-2 group-hover:invert">
          <Link href={`/stake/pool/create?id=${row.original.id}`}>
            <Button size="sm" className="h-[29px] text-2xs md:text-xs">
              +
            </Button>
          </Link>
          {row.original.claimable && (
            <Button size="sm" className="h-[29px] text-2xs md:text-xs">
              Claim
            </Button>
          )}
        </div>
      );
    },
  },
];
