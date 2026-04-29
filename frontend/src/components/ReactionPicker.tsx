/**
 * ReactionPicker — LinkedIn-style hover reaction button.
 *
 * Five reactions: Agree · Brilliant · Build It · Respect · Fire
 *
 * Tap behaviour:
 *   - Hover (desktop) or single tap → open emoji picker
 *   - Double tap (within 280 ms) → undo / remove current reaction
 */

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export type ReactionKey = "agree" | "brilliant" | "buildit" | "respect" | "fire";

export interface ReactionCounts {
  agree: number;
  brilliant: number;
  buildit: number;
  respect: number;
  fire: number;
}

export const REACTIONS: { key: ReactionKey; emoji: string; label: string; color: string }[] = [
  { key: "agree",    emoji: "✅", label: "Agree",     color: "text-green-400"  },
  { key: "brilliant",emoji: "💡", label: "Brilliant", color: "text-yellow-300" },
  { key: "buildit",  emoji: "🔨", label: "Build It",  color: "text-orange-400" },
  { key: "respect",  emoji: "🫡", label: "Respect",   color: "text-blue-400"   },
  { key: "fire",     emoji: "🔥", label: "Fire",      color: "text-red-400"    },
];

export function totalReactions(counts: ReactionCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export function dominantReaction(counts: ReactionCounts): typeof REACTIONS[number] | null {
  let best: typeof REACTIONS[number] | null = null;
  let max = 0;
  for (const r of REACTIONS) {
    if (counts[r.key] > max) { max = counts[r.key]; best = r; }
  }
  return best;
}

interface ReactionPickerProps {
  currentReaction: ReactionKey | null;
  counts: ReactionCounts;
  onReact: (reaction: ReactionKey | null) => void;
  disabled?: boolean;
  testIdPrefix?: string;
}

export default function ReactionPicker({
  currentReaction,
  counts,
  onReact,
  disabled,
  testIdPrefix = "",
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Double-tap detection
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef(0);

  const active = currentReaction ? REACTIONS.find(r => r.key === currentReaction) : null;
  const total = totalReactions(counts);

  const showPicker = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setOpen(true);
  };
  const hidePicker = (delay = 120) => {
    hoverTimeoutRef.current = setTimeout(() => setOpen(false), delay);
  };

  const handleReact = (key: ReactionKey) => {
    setOpen(false);
    onReact(currentReaction === key ? null : key);
  };

  const handleButtonClick = () => {
    if (disabled) return;
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 2) {
      // Double tap → undo current reaction
      tapCountRef.current = 0;
      setOpen(false);
      if (currentReaction) onReact(null);
    } else {
      // Wait to see if a second tap follows
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        // Single tap → open picker
        setOpen(true);
      }, 280);
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center">
      {/* Floating reaction bar */}
      {open && (
        <div
          className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-card border border-card-border rounded-2xl px-2.5 py-1.5 shadow-xl"
          onMouseEnter={showPicker}
          onMouseLeave={() => hidePicker(150)}
        >
          {REACTIONS.map(r => (
            <button
              key={r.key}
              onClick={() => handleReact(r.key)}
              title={r.label}
              className={cn(
                "group flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1 transition-all hover:scale-125 hover:bg-muted/60",
                currentReaction === r.key && "scale-110 bg-muted/60"
              )}
            >
              <span className="text-xl leading-none">{r.emoji}</span>
              <span className={cn("text-[10px] font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity", r.color)}>
                {r.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main button */}
      <button
        disabled={disabled}
        onMouseEnter={showPicker}
        onMouseLeave={() => hidePicker()}
        onClick={handleButtonClick}
        data-testid={`${testIdPrefix}reaction-btn`}
        title={currentReaction ? "Double-tap to remove reaction" : "React"}
        className={cn(
          "w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-muted/50",
          active ? active.color : "text-muted-foreground/50 hover:text-muted-foreground/80"
        )}
      >
        <span className={cn("text-base leading-none transition-opacity", !active && "opacity-30")}>
          {active ? active.emoji : "✅"}
        </span>
        <span>{active ? active.label : "Agree"}</span>
        {total > 0 && (
          <span className="text-xs font-mono opacity-70 ml-0.5">·{total}</span>
        )}
      </button>
    </div>
  );
}
