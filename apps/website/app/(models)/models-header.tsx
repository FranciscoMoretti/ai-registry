"use client";

import { Menu, SquareLibrary } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { HeaderActions } from "@/components/header-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function PureModelsHeader({ className }: { className?: string }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <header
      className={cn(
        "relative flex h-(--header-height) w-full items-center gap-2 bg-background px-2 sm:px-3",
        className
      )}
    >
      <Link aria-label="Home" className="py-2" href="/">
        <span className="flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 font-semibold text-lg hover:bg-muted">
          <SquareLibrary aria-hidden="true" className="size-6" />
          <span className="hidden sm:inline">AI Registry</span>
        </span>
      </Link>

      <nav className="-translate-x-1/2 absolute left-1/2 hidden items-center gap-6 sm:flex">
        <Link
          className={cn(
            "font-medium text-sm transition-colors hover:text-foreground",
            isActive("/") ? "text-foreground" : "text-muted-foreground"
          )}
          href="/"
        >
          Models
        </Link>
        <Link
          className={cn(
            "font-medium text-sm transition-colors hover:text-foreground",
            isActive("/compare") ? "text-foreground" : "text-muted-foreground"
          )}
          href="/compare"
        >
          Compare
        </Link>
      </nav>

      {/* Right side: actions + mobile menu */}
      <div className="ml-auto flex items-center gap-1">
        <HeaderActions />
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open navigation menu"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40"
              side="bottom"
              sideOffset={8}
            >
              <DropdownMenuItem asChild>
                <Link className={cn(isActive("/") && "font-semibold")} href="/">
                  Models
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  className={cn(isActive("/compare") && "font-semibold")}
                  href="/compare"
                >
                  Compare
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export const ModelsHeader = memo(PureModelsHeader);
