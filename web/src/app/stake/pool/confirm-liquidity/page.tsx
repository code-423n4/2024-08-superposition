"use client";

import { ConfirmStake } from "@/components/ConfirmStake";
import { useSearchParams } from "next/navigation";

export default function ConfirmAddLiquidity() {
  const params = useSearchParams();
  const positionId = Number(params.get("positionId"));

  return <ConfirmStake mode="existing" positionId={positionId ?? 0} />;
}
