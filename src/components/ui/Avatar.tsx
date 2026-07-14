import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const imageSizes = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-orange-500/30",
          sizes[size],
          className
        )}
      >
        <Image
          src={src}
          alt={name}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 font-semibold text-white ring-2 ring-orange-500/30",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
