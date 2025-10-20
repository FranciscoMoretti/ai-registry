import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";

type VirtualizedScrollAreaProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  estimateSize: (index: number) => number;
  getItemKey?: (index: number) => string | number;
  listHeight: number;
  className?: string;
  initialScroll?: {
    index: number;
    clickAfterScroll: boolean;
  };
};

export type VirtualizedScrollAreaRef = {
  scrollToIndex: (
    index: number,
    options?: {
      align?: "start" | "center" | "end";
      behavior?: "auto" | "smooth";
    }
  ) => void;
};

const VirtualizedScrollArea = ({
  items,
  renderItem,
  overscan = 5,
  estimateSize,
  getItemKey,
  listHeight,
  initialScroll,
  className,
  ...props
}: VirtualizedScrollAreaProps<any>) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    getItemKey: getItemKey || ((index) => index),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  React.useEffect(() => {
    if (initialScroll == null) {
      return;
    }
    if (initialScroll.index > -1) {
      rowVirtualizer.scrollToIndex(initialScroll.index, {
        align: "start",
        behavior: "auto",
      });

      if (initialScroll.clickAfterScroll) {
        //need to wait for the scroll to be completed
        setTimeout(() => {
          const targetElement = parentRef.current?.querySelector(
            `[data-virtual-index="${initialScroll.index}"]`
          );
          const renderedElement = targetElement?.children[0];
          if (renderedElement instanceof HTMLElement) {
            renderedElement.click();
          }
        }, 100);
      }
    }
  }, [initialScroll?.index, rowVirtualizer, initialScroll]);
  return (
    <ScrollArea
      ref={parentRef}
      style={{ height: `${listHeight}px` }}
      {...props}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            data-virtual-index={virtualItem.index}
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

VirtualizedScrollArea.displayName = "VirtualizedScrollArea";

export { VirtualizedScrollArea };
