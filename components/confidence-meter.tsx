"use client";

import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  score: number; // 0-1
  breakdown?: {
    similarity: number;
    llmConfidence: number;
    successRate: number;
  };
  action?: "auto-resolve" | "suggest" | "escalate";
  compact?: boolean;
}

export function ConfidenceMeter({ score, breakdown, action, compact }: ConfidenceMeterProps) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80 ? "text-emerald-500" : pct >= 55 ? "text-amber-500" : "text-red-500";
  const bgColor =
    pct >= 80 ? "bg-emerald-500" : pct >= 55 ? "bg-amber-500" : "bg-red-500";
  const label =
    action === "auto-resolve"
      ? "High Confidence"
      : action === "suggest"
        ? "Medium Confidence"
        : "Low Confidence";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={cn("text-sm font-semibold tabular-nums", color)}>{pct}%</div>
        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", bgColor)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">AI Confidence</span>
        <span className={cn("text-lg font-bold tabular-nums", color)}>{pct}%</span>
      </div>

      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", bgColor)} style={{ width: `${pct}%` }} />
      </div>

      <div className={cn(
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        pct >= 80 ? "bg-emerald-500/10 text-emerald-500" :
        pct >= 55 ? "bg-amber-500/10 text-amber-500" :
        "bg-red-500/10 text-red-500"
      )}>
        {label}
      </div>

      {breakdown && (
        <div className="flex flex-col gap-2 pt-1">
          <BreakdownBar label="Semantic Similarity" value={breakdown.similarity} />
          <BreakdownBar label="LLM Confidence" value={breakdown.llmConfidence} />
          <BreakdownBar label="Historical Success" value={breakdown.successRate} />
        </div>
      )}
    </div>
  );
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary/70 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
