"use client";

import { memo } from "react";
import { GitIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";


function PureHeaderActions() {

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="icon" type="button" variant="ghost">
        <a
          className="flex items-center justify-center"
          href="https://github.com/franciscomoretti/ai-registry"
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitIcon size={20} />
        </a>
      </Button>

    </div>
  );
}

export const HeaderActions = memo(PureHeaderActions);
