import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-green-600/20 text-green-500",
        warning: "border-transparent bg-amber-500/20 text-amber-500",
        pending: "border-amber-500/30 bg-amber-500/20 text-amber-500",
        confirmed: "border-amber-600/30 bg-amber-600/20 text-amber-400",
        in_progress: "border-blue-500/30 bg-blue-500/20 text-blue-400",
        completed: "border-green-500/30 bg-green-500/20 text-green-400",
        cancelled: "border-red-500/30 bg-red-500/20 text-red-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
