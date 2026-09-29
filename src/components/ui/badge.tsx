import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-elevated px-2.5 py-1 text-xs font-medium tracking-wide text-muted shadow-border",
        className,
      )}
      {...props}
    />
  );
}
