"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { usdFormat } from "@/lib/usdFormat";
import { formatDistanceToNowStrict } from "date-fns";
import Token from "@/assets/icons/token.svg";
import TokenIridescent from "@/assets/icons/token-iridescent.svg";
import Ethereum from "@/assets/icons/ethereum.svg";

export type Token = {
  name: string;
  icon: React.ReactNode;
};

export type TransactionHistory = {
  id: string;
  tokens: [Token, Token];
  date: Date;
  rewards: number;
};
export const columns: ColumnDef<TransactionHistory>[] = [
  {
    accessorKey: "tokens",
    header: "Trades",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-1 md:pr-6">
          {row.original.tokens[0].icon}
          {row.original.tokens[0].name}
          <div className={"text-nowrap"}>{"->"}</div>
          {row.original.tokens[1].icon}
          {row.original.tokens[1].name}
        </div>
      );
    },
  },
  {
    accessorKey: "rewards",
    header: "Rewards",
    cell: ({ row }) => (
      <div className="md:pr-6">
        <Badge
          variant={"secondary"}
          className={"h-4 px-0.5 text-[10px] font-semibold"}
        >
          <TokenIridescent className={"size-[12px]"} />
          <Ethereum className={"-ml-1 mr-1 size-[12px]"} />
          {usdFormat(row.original.rewards)}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      return formatDistanceToNowStrict(row.original.date);
    },
  },
];
