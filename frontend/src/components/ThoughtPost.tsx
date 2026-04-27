import { useState, useCallback } from "react";
import { Link } from "wouter";
import { CheckCircle, AlertTriangle, XCircle, Flag, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import ReactionPicker from "./ReactionPicker";
import CommentThread, { type CommentData } from "./CommentThread";
import { useReactions } from "@/hooks/use-reactions";

// ── AI confidence badge ────────────────────────────────────────────────────────
function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 80) return (
    <div className="flex items-center gap-1 text-green-400 text-xs font-mono">
      <CheckCircle className="w-3 h-3" /> {confidence}%
    </div>
  );
  if (confidence >= 50) return (
    <div className="flex items-center gap-1 text-yellow-400 text-xs font-mono">
      <AlertTriangle className="w-3 h-3" /> {confidence}%
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-red-400 text-xs font-mono">
      <XCircle className="w-3 h-3" /> {confidence}%
    </div>
  );
}

// ── Report dialog ──────────────────────────────────────────────────────────────
function ReportDialog({ thoughtId, onClose }: { thoughtId: number; onClose: () => void }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const REASONS = [
    "Spam or irrelevant content",
    "Not tech-related",
    "Harmful or offensive",
    "Misinformation",
    "Other",
  ];

  const handleReport = async () => {
    if (!reason) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/thoughts/${thoughtId}/report`, { reason });
      const data = await res.json();
      if (data.error) {
        toast({ title: data.error, variant: "destructive" });
      } else {
        setDone(true);
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flag className="w-4 h-4 text-red-400" /> Report Post
          </DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="py-4 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
            <p className="text-sm font-medium">Report submitted</p>
            <p className="text-xs text-muted-foreground">Our team will review this post manually.</p>
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Why are you flagging this post?</p>
            <div className="space-y-2">
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={cn(
                    "w-full text-left text-sm px-3 py-2.5 rounded-xl border transition-all",
                    reason === r
                      ? "border-red-500/50 bg-red-500/10 text-red-300"
                      : "border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                disabled={!reason || isSubmitting}
                onClick={handleReport}
              >
                {isSubmitting ? "Submitting..." : "Flag It"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── ThoughtPost ────────────────────────────────────────────────────────────────
interface ThoughtPostProps {
  thought: any;
}

export default function ThoughtPost({ thought }: ThoughtPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [local, setLocal] = useState(thought);
  const [showReport, setShowReport] = useState(false);
  // Local (optimistic) comments — no backend comment API for thoughts yet
  const [localComments, setLocalComments] = useState<CommentData[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const timeAgo = (() => {
    try {
      const s = local.createdAt;
      const d = new Date(s?.endsWith("Z") || s?.includes("+") ? s : s + "Z");
      return formatDistanceToNow(d, { addSuffix: true });
    }
    catch { return ""; }
  })();

  // Like toggle (maps reactions onto existing like API)
  const likeToggle = useCallback(async () => {
    if (!user) { toast({ title: "Sign in to react" }); return null; }
    const res = await apiRequest("POST", `/api/thoughts/${local.id}/like`, {});
    const data = await res.json();
    if (data.thought) {
      setLocal((p: any) => ({ ...p, likeCount: data.thought.likeCount, hasLiked: data.liked }));
    }
    queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    return { liked: data.liked, likeCount: data.thought?.likeCount ?? local.likeCount };
  }, [local.id, local.likeCount, user, toast]);

  const { currentReaction, counts, handleReact, isReacting } = useReactions(
    "thought", local.id, local.hasLiked, local.likeCount ?? 0, likeToggle
  );

  // Post top-level comment (optimistic only — no thought comment API)
  const handlePost = async (body: string) => {
    if (!user) { toast({ title: "Sign in to weigh in" }); return; }
    const c: CommentData = {
      id: `opt-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      user: { username: user.username, avatarUrl: user.avatarUrl },
      replies: [],
    };
    setLocalComments(prev => [...prev, c]);
    setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
  };

  // Reply on a comment (1-level, tagged)
  const handleReply = async (parent: CommentData, body: string) => {
    if (!user) { toast({ title: "Sign in to reply" }); return; }
    const tagged = `@${parent.user?.username} ${body}`;
    // Find the parent and add reply
    setLocalComments(prev => prev.map(c => {
      if (c.id === parent.id) {
        return { ...c, replies: [...(c.replies || []), {
          id: `opt-${Date.now()}`,
          body: tagged,
          createdAt: new Date().toISOString(),
          user: { username: user.username, avatarUrl: user.avatarUrl },
          replies: [],
        }] };
      }
      return c;
    }));
    setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
  };

  const displayed = showAllComments ? localComments : localComments.slice(0, 2);
  const isOwn = user && local.user?.username === user.username;

  return (
    <>
      {showReport && <ReportDialog thoughtId={local.id} onClose={() => setShowReport(false)} />}

      <div
        data-testid={`card-thought-${local.id}`}
        className="rounded-2xl border border-card-border bg-card overflow-hidden transition-all duration-300"
      >
        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <Link href={`/users/${local.user?.username}`}>
            <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-border hover:ring-primary transition-all shrink-0">
              <AvatarImage src={local.user?.avatarUrl} />
              <AvatarFallback>{local.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/users/${local.user?.username}`}>
                <span className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer">
                  {local.user?.username}
                </span>
              </Link>
              {local.user?.verified && <span className="text-primary text-xs">✓</span>}
              <span className="text-xs text-muted-foreground">dropped a take</span>
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {local.aiConfidence !== null && local.aiConfidence !== undefined && (
              <ConfidenceBadge confidence={Math.round(local.aiConfidence)} />
            )}
            {!isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2"
                    onClick={() => {
                      if (!user) { toast({ title: "Sign in to flag" }); return; }
                      setShowReport(true);
                    }}
                  >
                    <Flag className="w-3.5 h-3.5" /> Flag this post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{local.content}</p>
        </div>

        {/* ── Reaction summary bar ── */}
        {(local.likeCount > 0 || localComments.length > 0) && (
          <div className="mx-4 mb-2 flex items-center gap-3 text-xs text-muted-foreground">
            {local.likeCount > 0 && <span>✅ {local.likeCount}</span>}
            {localComments.length > 0 && <span>💬 {localComments.length}</span>}
          </div>
        )}

        {/* ── Action bar ── */}
        <div className="border-t border-border/50 mx-4" />
        <div className="flex items-stretch px-2 py-1">
          <ReactionPicker
            currentReaction={currentReaction}
            counts={counts}
            onReact={handleReact}
            disabled={isReacting}
            testIdPrefix={`thought-${local.id}-`}
          />
        </div>

        {/* ── Comments section (always visible) ── */}
        <div className="border-t border-border/50 px-4 pt-3 pb-4">
          <CommentThread
            comments={displayed}
            currentUser={user}
            onPost={handlePost}
            onReply={handleReply}
            showAll={showAllComments}
            onShowAll={() => setShowAllComments(true)}
            totalCount={localComments.length}
          />
        </div>
      </div>
    </>
  );
}
