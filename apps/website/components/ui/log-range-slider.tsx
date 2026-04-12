"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type * as React from "react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

const STEPS = 200;

type LogRangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  formatLabel: (v: number) => string;
  roundValue?: (v: number) => number;
  tickCount?: number;
  className?: string;
};

function getEffectiveMin(min: number, max: number) {
  return min > 0 ? min : Math.max(max / 10_000, 1e-6);
}

function positionToValue(p: number, min: number, max: number): number {
  if (max <= min) return min;
  if (p <= 0) return min;
  if (p >= STEPS) return max;
  const effectiveMin = getEffectiveMin(min, max);
  const lo = Math.log(effectiveMin);
  const hi = Math.log(max);
  return Math.exp(lo + (p / STEPS) * (hi - lo));
}

function valueToPosition(v: number, min: number, max: number): number {
  if (max <= min) return 0;
  if (v <= min) return 0;
  if (v >= max) return STEPS;
  const effectiveMin = getEffectiveMin(min, max);
  const clamped = Math.max(effectiveMin, v);
  const lo = Math.log(effectiveMin);
  const hi = Math.log(max);
  return Math.round(((Math.log(clamped) - lo) / (hi - lo)) * STEPS);
}

export function LogRangeSlider({
  min,
  max,
  value,
  onValueChange,
  formatLabel,
  roundValue,
  tickCount = 7,
  className,
}: LogRangeSliderProps) {
  const positions = useMemo<[number, number]>(
    () => [
      valueToPosition(value[0], min, max),
      valueToPosition(value[1], min, max),
    ],
    [value, min, max]
  );

  const handleChange = useCallback(
    (next: number[]) => {
      const [p0, p1] = next as [number, number];
      const v0Raw = positionToValue(p0, min, max);
      const v1Raw = positionToValue(p1, min, max);
      const v0 = p0 <= 0 ? min : p0 >= STEPS ? max : (roundValue?.(v0Raw) ?? v0Raw);
      const v1 = p1 <= 0 ? min : p1 >= STEPS ? max : (roundValue?.(v1Raw) ?? v1Raw);
      onValueChange([v0, v1]);
    },
    [min, max, onValueChange, roundValue]
  );

  const ticks = useMemo(() => {
    if (max <= min || tickCount <= 1) return [] as number[];
    return Array.from({ length: tickCount }, (_, i) => (i / (tickCount - 1)) * 100);
  }, [min, max, tickCount]);

  const midLabel = useMemo(() => {
    const midPos = STEPS / 2;
    return formatLabel(positionToValue(midPos, min, max));
  }, [min, max, formatLabel]);

  return (
    <div className={cn("w-full", className)}>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50"
        max={STEPS}
        min={0}
        onValueChange={handleChange}
        step={1}
        value={positions}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {positions.map((_, index) => (
          <SliderPrimitive.Thumb
            className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50"
            // biome-ignore lint/suspicious/noArrayIndexKey: two thumbs
            key={index}
          />
        ))}
      </SliderPrimitive.Root>
      <div className="relative mt-1.5 h-2">
        {ticks.map((pct) => (
          <div
            className="absolute top-0 h-2 w-px bg-muted-foreground/40"
            key={pct}
            style={{ left: `${pct}%`, transform: "translateX(-0.5px)" }}
          />
        ))}
      </div>
      <div className="relative mt-1 flex justify-between text-muted-foreground text-xs">
        <span>{formatLabel(value[0])}</span>
        <span className="-translate-x-1/2 absolute left-1/2">{midLabel}</span>
        <span>{formatLabel(value[1])}</span>
      </div>
    </div>
  );
}
