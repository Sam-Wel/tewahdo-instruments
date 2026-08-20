import { cn } from "@/lib/utils";

// A repeating gold tick-mark border, echoing woven-textile/cross-motif
// trim. Purely decorative, hence aria-hidden.
export function OrnamentDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-3 opacity-45", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent 0, transparent 14px, var(--primary) 14px, var(--primary) 15px, transparent 15px, transparent 20px, var(--primary) 20px, var(--primary) 21px, transparent 21px, transparent 40px)",
      }}
    />
  );
}
