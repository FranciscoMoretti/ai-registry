import { Filter as FilterIcon, RotateCcw } from "lucide-react";
import { ModelFilters } from "@/app/(models)/models/model-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function FilterSheet({
  onClearAll,
  activeFiltersCount,
}: {
  onClearAll: () => void;
  activeFiltersCount: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="relative" size="icon" variant="secondary">
          <FilterIcon className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="-top-1 -right-1 absolute h-4 min-w-[1rem] rounded-full bg-primary px-0.5 text-center text-[10px] text-primary-foreground leading-4">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0" side="left">
        <SheetHeader className="border-b">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="h-full overflow-y-auto">
          <ModelFilters className="p-4" />
        </div>
        <div className="border-t p-4">
          <Button
            className="w-full justify-center"
            onClick={onClearAll}
            variant="ghost"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Clear filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
