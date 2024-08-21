import { InventoryContent } from "@/components/InventoryContent";

export default function InvetoryPage() {
  return (
    <div className="flex flex-col items-center">
      <div
        className={
          "h-[586px] w-[317px] overflow-y-auto rounded-lg bg-black p-4 text-white"
        }
      >
        <InventoryContent />
      </div>
    </div>
  );
}
