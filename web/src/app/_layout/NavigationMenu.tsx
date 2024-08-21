"use client";

import Menu from "@/components/Menu";
import { usePathname, useRouter } from "next/navigation";
import { useSwapPro } from "@/stores/useSwapPro";

/**
 * The main Swap/Stake navigation menu.
 */
export const NavigationMenu = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { swapPro } = useSwapPro();

  return (
    <Menu id="nav">
      <Menu.Item
        onClick={() => {
          router.push("/");
        }}
        selected={pathname === "/" || pathname.startsWith("/swap")}
        proToggle
      >
        <div className="text-nowrap">
          Swap{" "}
          {swapPro && <div className="hidden md:inline-flex">{" Pro"}</div>}
        </div>
      </Menu.Item>
      <Menu.Item
        className={"w-[73px]"}
        onClick={() => {
          router.push("/stake");
        }}
        selected={pathname.startsWith("/stake")}
      >
        <div>Stake</div>
      </Menu.Item>
    </Menu>
  );
};
