"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search models...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full sm:max-w-[250px] md:max-w-[350px] ${className ?? ""}`}
    >
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        className="h-10 w-full pr-10 pl-10"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {value && (
        <Button
          className="-translate-y-1/2 absolute top-1/2 right-1 h-8 w-8 p-0"
          onClick={onClear}
          size="sm"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
