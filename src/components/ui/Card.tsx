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
            ? "bg-white/5 backdrop-blur-xl border-white/10"
            : "bg-gray-900 border-gray-800",
          hover && "transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-teal-500/5",
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
