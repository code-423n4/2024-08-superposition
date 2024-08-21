import { Welcome } from "@/app/Welcome";

import { SwapForm } from "@/components/SwapForm";
import { SwapPro } from "@/components/SwapPro";

export default function Swap() {
  return (
    <div className="relative flex w-full flex-col">
      <div className="flex max-w-full flex-col-reverse justify-center gap-8 lg:flex-row">
        <SwapPro />
        <SwapForm />
      </div>

      <Welcome />
    </div>
  );
}
