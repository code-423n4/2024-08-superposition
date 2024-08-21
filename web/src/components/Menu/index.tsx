import { LayoutGroup, motion } from "framer-motion";
import styles from "./Menu.module.scss";
import ArrowDownWhite from "@/assets/icons/arrow-down-white.svg";
import ArrowDown from "@/assets/icons/arrow-down.svg";
import ProToggle from "@/assets/icons/pro-toggle.svg";
import ProToggleSelected from "@/assets/icons/pro-toggle-selected.svg";
import { useSwapPro } from "@/stores/useSwapPro";
import { cn } from "@/lib/utils";
import { clsx } from "clsx";
import { useWelcomeStore } from "@/stores/useWelcomeStore";

interface ItemProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  groupId?: string;
  background?: "light" | "dark";
  proToggle?: boolean;
  className?: string;
  variant?: "iridescent";
}

/**
 * Menu item component
 *
 * @deprecated Use `SegmentedControl` instead
 */
const Item: React.FC<ItemProps> = ({
  children,
  selected,
  onClick,
  groupId,
  background = "light",
  proToggle,
  className,
  variant,
}) => {
  const classes = `
    ${styles.Item}
    ${selected ? styles.selected : ""}
    ${styles[background]}
  `;

  const { swapPro, setSwapPro } = useSwapPro();
  const { setWelcome } = useWelcomeStore();

  return (
    <motion.div
      className={cn(
        classes,
        "group rounded-md",
        proToggle &&
          `h-[43px] px-2 transition-[width] ${swapPro ? "md:w-[125px] md:hover:w-[147px]" : "md:w-[97px] md:hover:w-[122px]"}`,
        selected ? "cursor-default" : "cursor-pointer",
        className,
      )}
      whileTap={{
        scale: !selected ? 0.95 : 1,
        y: 1,
        transition: {
          duration: 0.2,
          ease: "easeInOut",
        },
      }}
      onClick={onClick}
    >
      {selected && (
        <>
          <motion.div
            layoutId={groupId}
            // background={background}
            className={cn(
              "absolute inset-0 -z-10 rounded-md",
              background === "light" ? "bg-black" : "bg-white",
              proToggle && swapPro && "shine",
              {
                iridescent: variant === "iridescent",
              },
            )}
          />
        </>
      )}
      <div
        className={cn(
          "flex h-full flex-row items-center justify-center gap-2 text-base font-medium",
          {
            "iridescent-text": variant === "iridescent" && !selected,
            "text-black": variant === "iridescent" && selected,
          },
        )}
      >
        {children}
        {proToggle && (
          <div className="hidden md:inline-flex">
            <div className="group-hover:hidden">
              {selected ? (
                <ArrowDownWhite height={10} width={10} />
              ) : (
                <ArrowDown height={10} width={10} />
              )}
            </div>
            <div
              className={clsx(`hidden cursor-pointer group-hover:inline-flex`, {
                invert: !selected,
              })}
              onClick={() => {
                setWelcome(false);
                setSwapPro(!swapPro);
              }}
            >
              {swapPro ? (
                <ProToggleSelected className="h-[20px] w-[35px]" />
              ) : (
                <ProToggle className="h-[20px] w-[35px]" />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface MenuProps {
  children: React.ReactElement<ItemProps>[];
  background?: "light" | "dark";
  style?: "primary" | "secondary";
  id: string;
  className?: string;
}

/**
 * Menu component
 *
 * @deprecated Use `SegmentedControl` instead
 */
const Menu: React.FC<MenuProps> = ({
  children,
  background = "light",
  style = "secondary",
  id,
  className,
}) => {
  const frameColor =
    (background === "light" && style === "primary") ||
    (background === "dark" && style === "secondary")
      ? "dark"
      : "light";

  return (
    <div className={cn("flex flex-row gap-3 rounded", className)}>
      <LayoutGroup id={id}>
        {children.map((item, i) => {
          return (
            <Item
              {...item.props}
              groupId={id}
              key={`${id}-${i}`}
              background={frameColor}
            />
          );
        })}
      </LayoutGroup>
    </div>
  );
};

export default Object.assign(Menu, {
  Item,
});
