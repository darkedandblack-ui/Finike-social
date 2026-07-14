import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border p-4",
          glass
            ? "bg-[var(--card)] backdrop-blur-xl border-[var(--border)]"
            : "bg-[var(--card-solid)] border-[var(--border)]",
          hover && "transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
