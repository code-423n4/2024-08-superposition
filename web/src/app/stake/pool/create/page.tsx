"use client";

import { StakeForm } from "@/components/StakeForm";
import { useSearchParams } from "next/navigation";

export default function CreatePoolPage() {
  const params = useSearchParams();
  const poolId = params.get("id");

  return <StakeForm mode="new" poolId={poolId ?? ""} />;
}
