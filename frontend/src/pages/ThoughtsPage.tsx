import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 80) return (
    <div className="flex items-center gap-1 text-green-400 text-xs font-mono">
      <CheckCircle className="w-3 h-3" /> {confidence}% tech
    </div>
  );
  if (confidence >= 50) return (
    <div className="flex items-center gap-1 text-yellow-400 text-xs font-mono">
      <AlertTriangle className="w-3 h-3" /> {confidence}% tech
    </div>
  );
  return (
    <div className="flex items-center gap-1 text-red-400 text-xs font-mono">
      <XCircle className="w-3 h-3" /> {confidence}% tech
    </div>
  );
}

export default function ThoughtsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const { data: posts = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/thoughts"],
  });

  const handleSubmit = async () => {
    if (!user) { toast({ title: "Sign in to post" }); return; }
    if (!content.trim()) return;
    setIsSubmitting(true);
    setLastResult(null);
    try {
      const res = await apiRequest("POST", "/api/thoughts", { content });
      const data = await res.json();
      setLastResult(data);
      if (data.status === "published") {
        toast({ title: "✅ Thought published!", description: "AI validated your post as tech-relevant." });
        setContent("");
        queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
      } else if (data.status === "needs_context") {
        toast({ title: "⚠️ Needs more context", description: "Add technical details and resubmit.", variant: "destructive" });
      } else {
        toast({ title: "❌ Post blocked", description: data.aiReason || "Not tech-relevant enough.", variant: "destructive" });
        setContent("");
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
              onChange={e => setContent(e.target.value.substring(0, 500))}
              disabled={!user || isSubmitting}
              rows={3}
              className="resize-none"
              data-testid="input-thought"
            />
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
                  <span>🤖</span> AI-validated
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

        {/* Last result feedback */}
        {lastResult && lastResult.status !== "published" && (
          <div className={cn(
            "mt-3 p-3 rounded-lg text-xs border",
            lastResult.status === "needs_context" ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-400" : "border-red-500/30 bg-red-500/5 text-red-400"
          )}>
            <div className="font-semibold mb-1">
              AI confidence: {Math.round(lastResult.aiConfidence)}% tech relevance
            </div>
            <div>{lastResult.aiReason}</div>
            {lastResult.status === "needs_context" && (
              <div className="mt-1 text-muted-foreground">Add more technical details and try again.</div>
            )}
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
            <div key={post.id} className="rounded-xl border border-card-border bg-card p-4" data-testid={`card-thought-${post.id}`}>
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={post.user?.avatarUrl} />
                  <AvatarFallback>{post.user?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${post.user?.username}`}>
                        <span className="text-sm font-semibold hover:text-primary transition-colors">
                          {post.user?.username}
                          {post.user?.verified && <span className="ml-1 text-primary text-xs">✓</span>}
                        </span>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {post.aiConfidence !== null && post.aiConfidence !== undefined && (
                      <ConfidenceBadge confidence={Math.round(post.aiConfidence)} />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{post.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
