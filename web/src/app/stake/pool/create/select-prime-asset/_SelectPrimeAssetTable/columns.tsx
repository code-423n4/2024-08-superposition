import { ColumnDef } from "@tanstack/react-table";
import TokenIridescent from "@/assets/icons/token-iridescent.svg";
import { Token, getTokenFromAddress } from "../../../../../../config/tokens";
import { TokenIcon } from "@/components/TokenIcon";

export type Pool = {
  id: string;
  tokens: [Token, Token];
  duration: number;
  APR: number;
  volume: string;
  // include these columns to enable search filtering
  token0Address: string;
  token0Symbol: string;
  token0Name: string;
  token1Address: string;
  token1Symbol: string;
  token1Name: string;
};

export const columns: ColumnDef<Pool>[] = [
  {
    accessorKey: "tokens",
    header: "Pair",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-2">
          <TokenIcon
            src={getTokenFromAddress(row.original.token0Address)?.icon}
            className="size-[20px]"
          />
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
    accessorKey: "APR",
    header: "APR",
    cell: ({ row }) => {
      return `${row.original.APR}%`;
    },
  },
  {
    accessorKey: "volume",
    header: "Vol. 24h",
    cell: ({ row }) => {
      return row.original.volume;
    },
  },
  {
    accessorKey: "duration",
    header: "Boost",
    cell: ({ row }) => {
      return `${row.original.duration} mins`;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      return row.original.id;
    },
  },
  {
    accessorKey: "token0Symbol",
    header: "Token 0 Symbol",
    cell: ({ row }) => {
      return row.original.tokens[0].symbol;
    },
  },
  {
    accessorKey: "token0Name",
    header: "Token 0 Name",
    cell: ({ row }) => {
      return row.original.tokens[0].name;
    },
  },
  {
    accessorKey: "token0Address",
    header: "Token 0 Address",
    cell: ({ row }) => {
      return row.original.tokens[0].address;
    },
  },
  {
    accessorKey: "token1Symbol",
    header: "Token 1 Symbol",
    cell: ({ row }) => {
      return row.original.tokens[1].symbol;
    },
  },
  {
    accessorKey: "token1Name",
    header: "Token 1 Name",
    cell: ({ row }) => {
      return row.original.tokens[1].name;
    },
  },
  {
    accessorKey: "token1Address",
    header: "Token 1 Address",
    cell: ({ row }) => {
      return row.original.tokens[1].address;
    },
  },
];
