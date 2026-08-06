import { type ReactNode, useState } from "react";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type CollapsibleBrandingSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Keeps secondary branding controls available without overwhelming the page. */
export function CollapsibleBrandingSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleBrandingSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="space-y-3">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/50">
        {title}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="space-y-3">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
