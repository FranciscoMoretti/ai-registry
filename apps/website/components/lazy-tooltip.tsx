"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LazyTooltip({
  children,
  content,
  asChild = true,
}: {
  children: React.ReactElement;
  content: React.ReactNode;
  asChild?: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  const triggerProps = {
    onPointerEnter: () => {
      console.log("pointer enter");
      setEnabled(true);
    },
    onTouchStart: () => {
      setEnabled(true);
      console.log("touch start");
    },
  } as const;

  if (!enabled) {
    // Clone to attach events without mounting Tooltip tree
    // @ts-expect-error - children is a ReactElement
    return { ...children, props: { ...children.props, ...triggerProps } };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild={asChild}>
        {
          // Attach the same listeners so once active, hover continues to work
          // @ts-expect-error - children is a ReactElement
          { ...children, props: { ...children.props, ...triggerProps } }
        }
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
