import Image from "next/image";
import { cn } from "@/lib/utils";

export function getProviderIcon(
  provider: string,
  size = 16,
  className?: string
) {
  if (!provider) {
    return null;
  }
  return (
    <Image
      alt={`${provider} logo`}
      className={cn("brightness-0 dark:invert", className)}
      height={size}
      src={`https://models.dev/logos/${provider}.svg`}
      width={size}
    />
  );
}
