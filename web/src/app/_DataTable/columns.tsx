"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Token from "@/assets/icons/token.svg";
import { usdFormat } from "@/lib/usdFormat";
import { useSwapStore } from "@/stores/useSwapStore";

export type Transaction = {
  id: string;
  value: number;
  rewards: number;
  time: Date;
  amountFrom: number;
  amountTo: number;
};

const AmountHeader = () => {
  const { token0, token1 } = useSwapStore();
  return (
    <div className="font-bold">
      {token0.symbol}/{token1.symbol}
    </div>
  );
};

export const columns: (ColumnDef<Transaction> & { colSpan?: number })[] = [
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => usdFormat(row.original.value),
  },
  {
    id: "amountFrom",
    header: () => <AmountHeader />,
    colSpan: 3,
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-2">
          <Token />
          {row.original.amountFrom}
        </div>
      );
    },
  },
  {
    id: "amountIcon",
    header: undefined,
    cell: () => {
      return <span>{"->"}</span>;
    },
  },
  {
    id: "amountTo",
    header: undefined,
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-2">
          <Token size="small" />
          {row.original.amountTo}
        </div>
      );
    },
  },
  {
    accessorKey: "rewards",
    header: "Rewards",
    cell: ({ row }) => {
      return (
        <Badge className="pl-0.5 group-hover:border group-hover:border-white">
          <Token size="small" />
          <div className="ml-2">{row.original.rewards}</div>
        </Badge>
      );
    },
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => {
      return `${formatDistanceToNow(row.original.time)} ago`;
    },
  },
];
