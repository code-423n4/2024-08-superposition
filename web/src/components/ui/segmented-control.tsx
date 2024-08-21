"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const segmentedControlVariants = cva(
  "relative m-auto inline-flex justify-between gap-2 overflow-hidden p-[2.5px] before:absolute before:inset-0 before:z-0 before:w-[var(--highlight-width)] before:translate-x-[var(--highlight-x-pos)] before:rounded-md before:bg-black before:transition-all before:content-['']",
  {
    variants: {
      variant: {
        secondary: "text-white before:bg-white",
      },
    },
  },
);

export interface Segment<T extends string> {
  label: React.ReactNode;
  value: T;
  ref: React.MutableRefObject<any>;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string>
  extends VariantProps<typeof segmentedControlVariants> {
  segments: Segment<T>[];
  callback?: (value: T, index: number) => void;
  defaultIndex?: number;
  className?: string;
  name?: string;
}

const SegmentedControl = <T extends string>({
  segments,
  callback,
  defaultIndex = 0,
  className,
  variant,
  name,
}: SegmentedControlProps<T>) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const controlRef = useRef<any>();

  useEffect(() => {
    const activeSegmentRef = segments[activeIndex].ref;
    const { offsetWidth, offsetLeft } = activeSegmentRef.current;
    const { style } = controlRef.current;

    style.setProperty("--highlight-width", `${offsetWidth}px`);
    style.setProperty("--highlight-x-pos", `${offsetLeft}px`);
  }, [activeIndex, controlRef, segments]);

  /**
   * reset by calling the callback with the defaultIndex on mount
   */
  useEffect(() => {
    if (callback) callback(segments[defaultIndex].value, defaultIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIndex]);

  const onInputChange = (value: any, index: any) => {
    setActiveIndex(index);
    if (callback) callback(value, index);
  };

  return (
    <div
      className={cn("flex flex-row text-[12px]", className)}
      ref={controlRef}
    >
      <div className={cn(segmentedControlVariants({ variant }))}>
        {segments?.map((item: Segment<T>, i: number) => (
          <div
            key={item.value}
            className={"relative z-10 w-full text-center"}
            ref={item.ref}
          >
            <input
              type="radio"
              value={item.value}
              id={`${name}-${item.value}`}
              disabled={item.disabled}
              onChange={() => onInputChange(item.value, i)}
              checked={i === activeIndex}
              name={name}
              className={cn(
                "absolute inset-0 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed",
              )}
            />
            <label
              id={`${name}-${item.value}`}
              className={cn(
                `mx-[6px] block text-nowrap font-medium transition-colors ${item.disabled ? "text-gray-500" : ""}`,
                {
                  invert: i === activeIndex,
                },
              )}
            >
              {item.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SegmentedControl;
