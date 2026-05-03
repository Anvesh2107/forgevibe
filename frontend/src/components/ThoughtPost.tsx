import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertTriangle, XCircle, Flag, MoreHorizontal, Share2, Twitter, Linkedin, Link2, Trash2 } from "lucide-react";
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
  const [localComments, setLocalComments] = useState<CommentData[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const { data: apiComments = [], refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/thoughts/${local.id}/comments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/thoughts/${local.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!local.id,
  });

  const apiBodySet = new Set(apiComments.map((c: any) => c.content));
  const allFlat: CommentData[] = [
    ...apiComments.map((c: any) => ({
      id: c.id,
      body: c.content,
      createdAt: c.createdAt,
      user: c.author,
      replies: [],
    })),
    ...localComments.filter((lc: CommentData) => !apiBodySet.has(lc.body)),
  ];

  const threads: CommentData[] = [];
  const byId: Record<string | number, CommentData> = {};
  for (const c of allFlat) { byId[c.id] = { ...c, replies: [] }; }
  for (const c of allFlat) {
    const node = byId[c.id];
    if (c.body.startsWith("__reply__:")) {
      const [, parentIdStr, ...rest] = c.body.split(":");
      node.body = rest.join(":");
      const parent = byId[parseInt(parentIdStr)];
      if (parent) { parent.replies = [...(parent.replies || []), node]; continue; }
    }
    threads.push(node);
  }

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

  const handlePost = async (body: string) => {
    if (!user) { toast({ title: "Sign in to weigh in" }); return; }
    try {
      await apiRequest("POST", `/api/thoughts/${local.id}/comments`, { content: body });
      setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      refetchComments();
    } catch {}
  };

  const handleReply = async (parent: CommentData, body: string) => {
    if (!user) { toast({ title: "Sign in to reply" }); return; }
    const taggedBody = `@${parent.user?.username} ${body}`;
    const optimisticId = `opt-${Date.now()}`;
    setLocalComments(prev => [...prev, {
      id: optimisticId,
      body: `__reply__:${parent.id}:${taggedBody}`,
      createdAt: new Date().toISOString(),
      user: { username: user.username, avatarUrl: user.avatarUrl },
      replies: [],
    }]);
    setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
    try {
      await apiRequest("POST", `/api/thoughts/${local.id}/comments`, { content: `__reply__:${parent.id}:${taggedBody}` });
    } catch {}
  };

  const displayed = showAllComments ? threads : threads.slice(0, 2);
  const isOwn = user && local.user?.username === user.username;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiRequest("DELETE", `/api/thoughts/${local.id}`);
      queryClient.setQueryData(["/api/thoughts"], (old: any[] = []) => old.filter((t: any) => t.id !== local.id));
      queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "Post deleted" });
    } catch {
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
    setIsDeleting(false);
  };

  return (
    <>
      {showReport && <ReportDialog thoughtId={local.id} onClose={() => setShowReport(false)} />}

      <div
        data-testid={`card-thought-${local.id}`}
        className="rounded-2xl border border-card-border bg-card overflow-hidden transition-all duration-300 card-elevated"
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
            <DropdownMenu onOpenChange={open => { if (!open) setConfirmDelete(false); }}>
              <DropdownMenuTrigger asChild>
                <button className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwn ? (
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2"
                    disabled={isDeleting}
                    onSelect={e => {
                      if (!confirmDelete) {
                        e.preventDefault();
                        setConfirmDelete(true);
                        return;
                      }
                      handleDelete();
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmDelete ? "Confirm delete?" : "Delete post"}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 gap-2"
                    onClick={() => {
                      if (!user) { toast({ title: "Sign in to flag" }); return; }
                      setShowReport(true);
                    }}
                  >
                    <Flag className="w-3.5 h-3.5" /> Flag this post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{local.content}</p>
        </div>

        {/* ── Reaction summary bar ── */}
        {(local.likeCount > 0 || threads.length > 0) && (
          <div className="mx-4 mb-2 flex items-center gap-3 text-xs text-muted-foreground">
            {local.likeCount > 0 && <span>✅ {local.likeCount}</span>}
            {threads.length > 0 && <span>💬 {threads.length}</span>}
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
          <div className="flex-1 flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(local.content?.slice(0, 100) + "… " + window.location.origin)}`, "_blank")}
                  className="gap-2 cursor-pointer"
                >
                  <Twitter className="w-4 h-4" /> Share on X
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`, "_blank")}
                  className="gap-2 cursor-pointer"
                >
                  <Linkedin className="w-4 h-4" /> Share on LinkedIn
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}`);
                    toast({ title: "Link copied!" });
                  }}
                  className="gap-2 cursor-pointer"
                >
                  <Link2 className="w-4 h-4" /> Copy link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            totalCount={threads.length}
          />
        </div>
      </div>
    </>
  );
}
