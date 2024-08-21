"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usdFormat } from "@/lib/usdFormat";
import Token from "@/assets/icons/token.svg";

export type Yield = {
  id: string;
  yield: number;
  pool: string;
  status: "claimable" | "claimed";
};

export const columns: ColumnDef<Yield>[] = [
  {
    accessorKey: "yield",
    header: "Yield",
    cell: ({ row }) => (
      <Badge variant={"iridescent"} size={"sm"} className={"pl-[2px]"}>
        <Token className={"size-[12px]"} />
        <Token className={"-ml-1.5 mr-0.5 size-[12px]"} />
        {usdFormat(row.original.yield)}
      </Badge>
    ),
  },
  {
    accessorKey: "pool",
    header: "Pool",
    cell: ({ row }) => (
      <div className={"flex flex-row items-center"}>
        <Token className={"size-[12px]"} />
        <Token className={"-ml-1.5 mr-0.5 size-[12px]"} />
        {row.original.pool}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) =>
      row.original.status === "claimable" ? (
        <div>
          <Button size={"xs"} variant={"iridescent"}>
            Claim Now
          </Button>
        </div>
      ) : (
        "Claimed"
      ),
  },
];
