import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { usdFormat } from "@/lib/usdFormat";
import { Button } from "@/components/ui/button";
import TokenIridescent from "@/assets/icons/token-iridescent.svg";
import { TokenIcon } from "@/components/TokenIcon";
import { getTokenFromAddress } from "@/config/tokens";

export type Token = {
  name: string;
};

// this is a misnomer - it represents a position and its corresponding pool
export type Pool = {
  id: string;
  positionId: number;
  tokens: [Token, Token];
  duration: number;
  staked: number;
  totalYield: number;
};

export const columns: ColumnDef<Pool>[] = [
  {
    accessorKey: "tokens",
    header: "Pool",
    cell: ({ row }) => {
      const token = getTokenFromAddress(row.original.id);
      return (
        <div className="flex flex-row items-center gap-2">
          <TokenIcon src={token?.icon} className="size-[20px]" />
          <TokenIridescent
            className={"-ml-4 size-[20px] rounded-full border border-black"}
          />
          {row.original.tokens[0].name}
          {" x "}
          {row.original.tokens[1].name}
        </div>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      return `${row.original.duration} mins`;
    },
  },
  {
    accessorKey: "staked",
    header: "Staked",
    cell: ({ row }) => {
      return `${usdFormat(row.original.staked)}`;
    },
  },
  {
    accessorKey: "totalYield",
    header: "Total Yield",
    cell: ({ row }) => {
      return (
        <Badge variant="iridescent" className="h-4 px-1 text-2xs">
          {usdFormat(row.original.totalYield)}
        </Badge>
      );
    },
  },
  {
    id: "manage",
    header: "",
    cell: ({ row }) => {
      return (
        <Button
          variant={"link"}
          className="hidden h-6 p-0 text-2xs text-white hover:no-underline md:inline-flex"
          size={"sm"}
        >
          <span className="mr-2 underline">Manage</span> {"->"}
        </Button>
      );
    },
  },
];
