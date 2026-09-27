"use client";

import type { SortOption } from "@/app/(models)/models/models-store-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SortSelect({
  value,
  onChangeAction,
  className,
}: {
  value: SortOption;
  onChangeAction: (value: SortOption) => void;
  className?: string;
}) {
  return (
    <Select onValueChange={(v: SortOption) => onChangeAction(v)} value={value}>
      <SelectTrigger
        className={`data-[size=default]:h-10 data-[size=sm]:h-10 w-full sm:w-64 ${className ?? ""}`}
      >
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent className="min-w-[var(--radix-select-trigger-width)] text-sm">
        <SelectItem value="released-desc">Newest releases</SelectItem>
        <SelectItem value="name-asc">A-Z</SelectItem>
        <SelectItem value="name-desc">Z-A</SelectItem>
        <SelectItem value="pricing-high">Pricing (High → Low)</SelectItem>
        <SelectItem value="pricing-low">Pricing (Low → High)</SelectItem>
        <SelectItem value="context-high">Context (High → Low)</SelectItem>
        <SelectItem value="max-output-tokens-high">
          Max Output (High → Low)
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
