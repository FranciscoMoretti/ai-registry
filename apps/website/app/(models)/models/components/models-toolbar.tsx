"use client";

import { RotateCcw, Search, X } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption =
  | "newest"
  | "pricing-low"
  | "pricing-high"
  | "context-high"
  | "context-low";

export const PureModelsToolbar = memo(function PureModelsToolbar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  sortBy,
  onChangeSort,
  onClearAll,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  sortBy: SortOption;
  onChangeSort: (value: SortOption) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
      <div className="relative max-w-md flex-1">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pr-10 pl-10"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search models..."
          value={searchQuery}
        />
        {searchQuery && (
          <Button
            className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
            onClick={onClearSearch}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select
        onValueChange={(value: SortOption) => onChangeSort(value)}
        value={sortBy}
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-40">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="text-sm">
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="pricing-low">$ Low → High</SelectItem>
          <SelectItem value="pricing-high">$ High → Low</SelectItem>
          <SelectItem value="context-high">Context High → Low</SelectItem>
          <SelectItem value="context-low">Context Low → High</SelectItem>
        </SelectContent>
      </Select>
      <Button className="shrink-0" onClick={onClearAll} variant="ghost">
        <RotateCcw className="mr-2 h-4 w-4" /> Reset
      </Button>
    </div>
  );
});
