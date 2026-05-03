import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Flag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import ThoughtPost from "@/components/ThoughtPost";


export default function ThoughtsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [showAppealInput, setShowAppealInput] = useState(false);
  const [appealNote, setAppealNote] = useState("");
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealSent, setAppealSent] = useState(false);

  const handleAppeal = async () => {
    if (!lastResult?.id) return;
    setIsAppealing(true);
    try {
      const res = await apiRequest("POST", `/api/thoughts/${lastResult.id}/appeal`, { message: appealNote.trim() });
      const data = await res.json();
      if (data.ok) {
        setAppealSent(true);
        setShowAppealInput(false);
      } else {
        toast({ title: data.error || "Appeal failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsAppealing(false);
  };

  const { data: posts = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/thoughts"],
  });

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Sign in to post" }); return; }
    if (!content.trim()) return;
    if (content.trim().length < 10) { setAttempted(true); return; }
    setAttempted(false);
    setIsSubmitting(true);
    setLastResult(null);
    setSubmitError(null);
    setShowAppealInput(false);
    setAppealNote("");
    setAppealSent(false);
    try {
      const res = await apiRequest("POST", "/api/thoughts", { content });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.error ?? "Content must be at least 10 characters.";
        setSubmitError(msg);
        setIsSubmitting(false);
        return;
      }
      const data = await res.json();

      // AI validation is async — poll until status leaves "pending"
      let final = data;
      if (data.id && data.status === "pending") {
        for (let i = 0; i < 12; i++) {
          await new Promise(r => setTimeout(r, 1500));
          try {
            const poll = await apiRequest("GET", `/api/thoughts/${data.id}`);
            if (poll.ok) {
              final = await poll.json();
              if (final.status !== "pending") break;
            }
          } catch { break; }
        }
      }

      setLastResult(final);
      if (final.status === "published") {
        toast({ title: "✅ Thought published!", description: "AI validated your post as tech-relevant." });
        setContent("");
        // Immediately insert at top of feed, then invalidate for server-fresh data
        queryClient.setQueryData(["/api/thoughts"], (old: any[] = []) => [final, ...old]);
        queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      } else if (final.status === "needs_context") {
        toast({ title: "⚠️ Needs more context", description: "Add technical details and resubmit.", variant: "destructive" });
      } else if (final.status === "pending") {
        toast({ title: "⏳ Still validating", description: "Your post is being reviewed — refresh in a moment." });
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      } else {
        // Keep content visible so user can see the rejection + appeal UI
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          💬 Tech Thoughts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Share architecture insights, opinions, and lessons learned. AI-validated for tech relevance.
        </p>
      </div>

      {/* Post composer */}
      <div className="rounded-xl border border-card-border bg-card p-4 mb-6">
        <div className="flex gap-3">
          {user && (
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback>{user.username[0]}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={user ? "Share a tech insight, architecture thought, or lesson learned..." : "Sign in to share your thoughts..."}
              value={content}
              onChange={e => { setContent(e.target.value.substring(0, 500)); setSubmitError(null); setAttempted(false); }}
              disabled={!user || isSubmitting}
              rows={3}
              className={cn("resize-none", attempted && content.trim().length < 10 ? "border-yellow-500/60 focus-visible:ring-yellow-500/40" : "")}
              data-testid="input-thought"
            />
            {attempted && content.trim().length < 10 && (
              <p className="text-xs text-yellow-500">
                At least 10 characters needed ({10 - content.trim().length} more to go)
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground font-mono">
                {content.length}/500 chars
                {content.length > 0 && (
                  <span className={cn("ml-2", content.length >= 480 ? "text-red-400" : "text-muted-foreground")}>
                    {500 - content.length} remaining
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>🔍</span> Perplexity-validated
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !user || !content.trim()}
                  size="sm"
                  data-testid="button-post-thought"
                >
                  {isSubmitting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Validating...</> : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Backend validation error */}
        {submitError && (
          <div className="mt-3 p-3 rounded-lg text-xs border border-red-500/30 bg-red-500/5 text-red-400">
            <div className="font-semibold mb-1">Post rejected</div>
            <div>{submitError}</div>
          </div>
        )}

        {/* AI validation feedback */}
        {lastResult && lastResult.status === "needs_context" && (
          <div className="mt-3 p-3 rounded-lg text-xs border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> Needs more context ({Math.round(lastResult.aiConfidence)}%)
            </div>
            <div>{lastResult.aiReason}</div>
            <div className="text-muted-foreground">Add more technical detail and try again.</div>
          </div>
        )}

        {lastResult && lastResult.status === "blocked" && !appealSent && (
          <div className="mt-3 p-3 rounded-lg text-xs border border-red-500/30 bg-red-500/5 text-red-400 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold">
              <XCircle className="w-3.5 h-3.5" /> AI rejected this post ({Math.round(lastResult.aiConfidence)}%)
            </div>
            <div>{lastResult.aiReason}</div>
            {!showAppealInput ? (
              <Button size="sm" variant="outline" className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 mt-1" onClick={() => setShowAppealInput(true)}>
                <Flag className="w-3 h-3 mr-1.5" /> Request Manual Review
              </Button>
            ) : (
              <div className="space-y-2 pt-1">
                <p className="text-muted-foreground">Tell us why you think this should be published (optional):</p>
                <Textarea
                  placeholder="e.g. This is about distributed systems..."
                  rows={2}
                  value={appealNote}
                  onChange={e => setAppealNote(e.target.value.substring(0, 300))}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowAppealInput(false)} disabled={isAppealing}>Cancel</Button>
                  <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white" onClick={handleAppeal} disabled={isAppealing}>
                    {isAppealing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Submitting...</> : "Submit Appeal"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {appealSent && (
          <div className="mt-3 p-3 rounded-lg text-xs border border-amber-500/30 bg-amber-500/5 text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" /> Appeal submitted
            </div>
            <div>Your appeal has been received. We'll review it and get back to you within 24–48 hours.</div>
          </div>
        )}
      </div>

      {/* Validation guide */}
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3 mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Validation Guide</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-green-400">
            <CheckCircle className="w-3 h-3 shrink-0" />
            <span>80-100: Auto-published</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>50-79: Add context</span>
          </div>
          <div className="flex items-center gap-1.5 text-red-400">
            <XCircle className="w-3 h-3 shrink-0" />
            <span>0-49: Not tech content</span>
          </div>
        </div>
      </div>

      {/* Posts feed */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <span className="text-3xl block mb-3">💬</span>
            No thoughts yet. Be the first to share something.
          </div>
        ) : (
          posts.map((post: any) => (
            <ThoughtPost key={post.id} thought={post} />
          ))
        )}
      </div>
    </div>
  );
}
