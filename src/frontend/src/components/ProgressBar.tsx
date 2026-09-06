import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <Progress
      value={clamped}
      data-ocid="progress_bar"
      className={cn("h-2", className)}
      aria-label={`${clamped}% complete`}
    >
      <div
        className={cn(
          "h-full w-full rounded-full bg-primary transition-all",
          indicatorClassName,
        )}
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </Progress>
  );
}
