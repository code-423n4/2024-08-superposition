"use client";

import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Search from "@/assets/icons/Search.svg";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useStakeStore } from "@/stores/useStakeStore";
import { fUSDC } from "@/config/tokens";
import { rankItem } from "@tanstack/match-sorter-utils";
import { useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children: React.ReactNode;
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

/**
 * Hide the address and token0/1 columns from the UI. This is included
 * so that the filter can search by address and token, but the columns
 * are not shown in the UI.
 */
const columnVisibility = {
  address: false,
  token0Symbol: false,
  token0Address: false,
  token0Name: false,
  token1Symbol: false,
  token1Address: false,
  token1Name: false,
};

export function SelectPrimeAssetTable<TData, TValue>({
  columns,
  data,
  children,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
  });
  const { setToken1, setToken0 } = useStakeStore();

  const router = useRouter();

  return (
    <div className="flex flex-col">
      <div>
        <div className={"text-[10px]"}>All Pools</div>

        <div className={"mt-[11px] text-[8px]"}>Filter</div>

        <div className="flex flex-row items-center border-b border-white pl-2">
          <Search className="size-4" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            variant="no-ring"
            className="h-8 w-[350px] border-0 bg-transparent text-xs"
            placeholder="Search for tokens by name, symbol, or contract address."
          />
        </div>

        {children}
      </div>
      <div className="w-full rounded-lg text-xs">
        <Table>
          <TableHeader className="text-3xs md:text-2xs [&_tr]:border-b-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="h-6 p-0 text-gray-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer border-b-0"
                  onClick={() => {
                    // assume the first token is always the original
                    const [token0] = row.original.tokens;
                    setToken0(token0);
                    setToken1(fUSDC);
                    router.push(`/stake/pool/create?id=${token0.address}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-0 py-[4px] text-2xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
