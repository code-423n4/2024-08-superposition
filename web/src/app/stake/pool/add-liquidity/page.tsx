"use client";

import { StakeForm } from "@/components/StakeForm";
import { useSearchParams } from "next/navigation";

export default function CreatePoolPage() {
  const params = useSearchParams();
  const positionId = Number(params.get("positionId"));
  const poolId = params.get("id");

  return (
    <StakeForm
      mode="existing"
      poolId={poolId ?? ""}
      positionId={positionId ?? 0}
    />
  );
}
