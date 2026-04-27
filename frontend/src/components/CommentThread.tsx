/**
 * CommentThread — renders a list of comments with 1-level reply support.
 *
 * - Top-level comments are posted via onPost(body)
 * - Replies tag the parent author: "@username <body>" visually
 * - Only 1 level of nesting (reply to reply not supported)
 * - Input placeholder & action label uses "take" language (Weigh In)
 */

import { useState } from "react";
import { Link } from "wouter";
import { Send, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface CommentData {
  id: number | string;
  body: string;
  createdAt: string;
  user?: { username: string; avatarUrl?: string };
  replies?: CommentData[];
  isOptimistic?: boolean;
}

interface CommentRowProps {
  comment: CommentData;
  currentUser: any;
  onReply: (parentComment: CommentData, body: string) => void;
  depth?: number;
}

function CommentRow({ comment, currentUser, onReply, depth = 0 }: CommentRowProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const timeAgo = (() => {
    try {
      const s = comment.createdAt;
      const d = new Date(s?.endsWith("Z") || s?.includes("+") ? s : s + "Z");
      return formatDistanceToNow(d, { addSuffix: true });
    }
    catch { return "just now"; }
  })();

  const submitReply = async () => {
    if (!replyText.trim() || isPosting) return;
    setIsPosting(true);
    await onReply(comment, replyText.trim());
    setReplyText("");
    setShowReplyInput(false);
    setIsPosting(false);
  };

  return (
    <div className={cn("flex gap-2", depth > 0 && "ml-9 mt-2")}>
      {depth > 0 && (
        <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-2.5" />
      )}
      <Avatar className="w-7 h-7 shrink-0 mt-0.5">
        <AvatarImage src={comment.user?.avatarUrl} />
        <AvatarFallback className="text-xs">{comment.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 rounded-2xl px-3 py-2">
          <Link href={`/users/${comment.user?.username}`}>
            <span className="text-xs font-semibold hover:text-primary transition-colors cursor-pointer">
              {comment.user?.username}
            </span>
          </Link>
          <p className="text-sm mt-0.5 leading-relaxed break-words">
            {/* If body starts with @mention, highlight it */}
            {comment.body.startsWith("@") ? (
              <>
                <span className="text-primary font-medium">{comment.body.split(" ")[0]}</span>
                {" "}
                <span>{comment.body.split(" ").slice(1).join(" ")}</span>
              </>
            ) : (
              comment.body
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {/* Only allow reply at depth 0 */}
          {depth === 0 && currentUser && (
            <button
              onClick={() => setShowReplyInput(v => !v)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Reply
            </button>
          )}
        </div>

        {/* Reply input (inline, depth 0 only) */}
        {showReplyInput && depth === 0 && (
          <div className="flex gap-2 mt-2 ml-0 items-center">
            <Avatar className="w-6 h-6 shrink-0">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="text-xs">{currentUser?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-1.5">
              <input
                autoFocus
                type="text"
                placeholder={`Reply to @${comment.user?.username}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); }
                  if (e.key === "Escape") { setShowReplyInput(false); }
                }}
                disabled={isPosting}
                className="flex-1 bg-muted/50 border border-border rounded-full px-3 py-1.5 text-xs outline-none focus:border-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50"
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim() || isPosting}
                className="w-7 h-7 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 space-y-1">
            {comment.replies.map(reply => (
              <CommentRow
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onReply={onReply}
                depth={1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main thread ────────────────────────────────────────────────────────────────

interface CommentThreadProps {
  comments: CommentData[];
  currentUser: any;
  onPost: (body: string) => Promise<void>;
  onReply: (parentComment: CommentData, body: string) => Promise<void>;
  showAll?: boolean;
  onShowAll?: () => void;
  totalCount?: number;
  inputTestId?: string;
  submitTestId?: string;
}

const PLACEHOLDER_PHRASES = [
  "Drop your take...",
  "Share your build thoughts...",
  "Weigh in on this...",
  "What's your read on this?",
];

export default function CommentThread({
  comments,
  currentUser,
  onPost,
  onReply,
  showAll,
  onShowAll,
  totalCount,
  inputTestId,
  submitTestId,
}: CommentThreadProps) {
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const placeholder = currentUser
    ? PLACEHOLDER_PHRASES[Math.floor(Math.random() * PLACEHOLDER_PHRASES.length)]
    : "Sign in to weigh in...";

  const submit = async () => {
    if (!text.trim() || isPosting || !currentUser) return;
    setIsPosting(true);
    await onPost(text.trim());
    setText("");
    setIsPosting(false);
  };

  return (
    <div className="space-y-3">
      {/* Comment input first (Facebook style) */}
      <div className="flex gap-2 items-center">
        {currentUser ? (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>{currentUser.username?.[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">?</span>
          </div>
        )}
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            disabled={!currentUser || isPosting}
            className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm outline-none focus:border-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50"
            data-testid={inputTestId}
          />
          <button
            onClick={submit}
            disabled={!currentUser || !text.trim() || isPosting}
            className="w-9 h-9 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
            data-testid={submitTestId}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Comments */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUser={currentUser}
              onReply={onReply}
            />
          ))}
          {/* Show more */}
          {!showAll && totalCount && totalCount > comments.length && (
            <button
              onClick={onShowAll}
              className="text-xs text-primary hover:underline ml-1"
            >
              View all {totalCount} takes
            </button>
          )}
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">No takes yet — drop the first one.</p>
      )}
    </div>
  );
}
