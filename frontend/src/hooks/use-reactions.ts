/**
 * useReactions — manages per-post reaction state (in-memory, per session).
 *
 * The backend tracks a binary like (hasLiked) — the reaction type
 * refines *which* reaction the user chose, stored in component state.
 */

import { useState, useCallback } from "react";
import type { ReactionKey, ReactionCounts } from "@/components/ReactionPicker";
import { REACTIONS } from "@/components/ReactionPicker";

/**
 * Build a ReactionCounts object from stored reactions + like count.
 * Since we only have the total likeCount from the backend, we synthesise
 * a breakdown: the user's own reaction shows count 1 extra (or the full
 * count is attributed to "agree" as the default).
 */
function buildCounts(
  hasLiked: boolean,
  likeCount: number,
  userReaction: ReactionKey | null
): ReactionCounts {
  const base: ReactionCounts = { agree: 0, brilliant: 0, buildit: 0, respect: 0, fire: 0 };
  if (!hasLiked || likeCount === 0) return base;
  // Spread likes: put the user's reaction as their own, rest go to "agree"
  const others = Math.max(0, likeCount - (hasLiked ? 1 : 0));
  base.agree += others;
  if (userReaction && hasLiked) {
    base[userReaction] += 1;
  } else if (hasLiked) {
    base.agree += 1;
  }
  return base;
}

export function useReactions(
  entityType: "project" | "thought",
  id: number,
  hasLiked: boolean,
  likeCount: number,
  onLikeToggle: () => Promise<{ liked: boolean; likeCount: number } | null>
) {
  const [currentReaction, setCurrentReaction] = useState<ReactionKey | null>(
    hasLiked ? "agree" : null
  );
  const [counts, setCounts] = useState<ReactionCounts>(() =>
    buildCounts(hasLiked, likeCount, hasLiked ? "agree" : null)
  );
  const [isReacting, setIsReacting] = useState(false);

  const handleReact = useCallback(async (reaction: ReactionKey | null) => {
    if (isReacting) return;
    setIsReacting(true);

    const wasLiked = currentReaction !== null;
    const willLike = reaction !== null;

    // Optimistic update
    setCurrentReaction(reaction);
    setCounts(buildCounts(willLike, willLike ? likeCount + (wasLiked ? 0 : 1) : likeCount - 1, reaction));

    // If switching between reactions (both liked) — no API needed, just UI change
    if (wasLiked === willLike) {
      setIsReacting(false);
      return;
    }

    // Otherwise toggle the backend like
    const result = await onLikeToggle();
    if (result) {
      setCounts(buildCounts(result.liked, result.likeCount, reaction));
    }

    setIsReacting(false);
  }, [currentReaction, isReacting, entityType, id, likeCount, onLikeToggle]);

  return { currentReaction, counts, handleReact, isReacting };
}
