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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Search from "@/assets/icons/Search.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { rankItem } from "@tanstack/match-sorter-utils";
import { useSwapStore } from "@/stores/useSwapStore";
import { useRouter } from "next/navigation";

interface AllPoolsTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  children?: React.ReactNode;
  token: "0" | "1";
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
 * Hide the address column from the UI. This is included
 * so that the filter can search by address, but the column
 * is not shown in the UI.
 */
const columnVisibility = {
  address: false,
};

export function AllAssetsTable<TData, TValue>({
  columns,
  data,
  children,
  token,
}: AllPoolsTableProps<TData, TValue>) {
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

  const { token0, token1, setToken1, setToken0, flipTokens } = useSwapStore();

  const router = useRouter();

  return (
    <div>
      <Label htmlFor={"filter"} className={"text-[10px] md:text-[12px]"}>
        Filter
      </Label>
      <div className="flex flex-row items-center border-b border-white">
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          variant="no-ring"
          className="h-8 border-0 bg-transparent text-[10px] md:text-[12px]"
          placeholder={"e.g. Ether, ARB, 0x0bafe8babf38bf3ba83fb80a82..."}
        />
        <Search className="size-4" />
      </div>
      {children}
      <div className={"mt-[26px] flex flex-row items-center justify-between"}>
        <div className={"text-[10px] md:text-[12px]"}>All</div>
        <div
          className={
            "flex flex-row items-center gap-1 text-[10px] md:text-[12px]"
          }
        >
          <div className={"text-nowrap"}>Sort by</div>
          <Select defaultValue={"campaigns"}>
            <SelectTrigger
              className={
                "h-auto rounded-none border-0 border-b border-dashed bg-transparent p-0 text-[10px] md:text-[12px]"
              }
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"campaigns"}>campaigns</SelectItem>
              <SelectItem value={"popularity"}>popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader className="[&_tr]:border-b-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b-0">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="h-8 p-0 text-[10px] text-neutral-400"
                  >
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
                className=" cursor-pointer border-b-0 text-[10px] hover:bg-black md:text-xs"
                onClick={() => {
                  const {
                    original: { token: rowToken },
                  } = row;
                  const { address } = rowToken;
                  if (token === "0") {
                    if (address === token1.address) flipTokens();
                    else setToken0(rowToken);
                  } else if (token === "1") {
                    if (address === token0.address) flipTokens();
                    else setToken1(rowToken);
                  }
                  router.back();
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="h-8 p-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
