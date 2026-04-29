import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, MessageSquare, Send, ChevronLeft, Loader2, CheckCircle, CreditCard, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

function SpacePostCard({ post, onLike }: { post: any; onLike: (id: number) => void }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: comments = [], refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/spaces/posts/${post.id}/comments`],
    enabled: showComments,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/spaces/posts/${post.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const timeAgo = (() => {
    try {
      const s = post.createdAt;
      const d = new Date(s?.endsWith("Z") || s?.includes("+") ? s : s + "Z");
      return formatDistanceToNow(d, { addSuffix: true });
    } catch { return ""; }
  })();

  const handleComment = async () => {
    if (!user) { toast({ title: "Sign in to comment" }); return; }
    if (!commentText.trim()) return;
    setIsPosting(true);
    await apiRequest("POST", `/api/spaces/posts/${post.id}/comments`, { content: commentText });
    setCommentText("");
    refetchComments();
    queryClient.invalidateQueries({ queryKey: [`/api/spaces/${post.spaceId}/posts`] });
    setIsPosting(false);
  };

  return (
    <div className="rounded-2xl border border-card-border bg-card card-elevated overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Link href={`/users/${post.author?.username}`}>
            <Avatar className="w-9 h-9 shrink-0 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
              <AvatarImage src={post.author?.avatarUrl} />
              <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/users/${post.author?.username}`}>
                <span className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer">
                  {post.author?.username}
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            <p className="text-sm leading-relaxed mt-1.5 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>

        {/* Reaction counts */}
        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="flex gap-3 text-xs text-muted-foreground mb-2 pl-12">
            {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
            {post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-border/50 mx-4" />
      <div className="flex items-stretch px-2 py-1">
        <button
          onClick={() => onLike(post.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-muted/50",
            post.hasLiked ? "text-red-400" : "text-muted-foreground/50 hover:text-muted-foreground/80"
          )}
        >
          <Heart className={cn("w-4 h-4 transition-all", post.hasLiked ? "fill-current" : "opacity-40")} />
          Like
          {post.likeCount > 0 && <span className="text-xs font-mono opacity-70">·{post.likeCount}</span>}
        </button>
        <button
          onClick={() => setShowComments(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/50 transition-all"
        >
          <MessageSquare className="w-4 h-4 opacity-40" />
          Comment
          {post.commentCount > 0 && <span className="text-xs font-mono opacity-70">·{post.commentCount}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border/50 px-4 pt-3 pb-4 space-y-3">
          {comments.map((c: any) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={c.author?.avatarUrl} />
                <AvatarFallback className="text-xs">{c.author?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
                <span className="text-xs font-semibold mr-2">{c.author?.username}</span>
                <span className="text-xs text-muted-foreground">{c.content}</span>
              </div>
            </div>
          ))}
          {user && (
            <div className="flex gap-2.5 items-end">
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-xs">{user.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value.slice(0, 300))}
                  placeholder="Write a comment…"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                  className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-1.5 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleComment}
                  disabled={isPosting || !commentText.trim()}
                  className="text-primary hover:text-primary/80 disabled:opacity-40 transition-opacity"
                >
                  {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const { data: space, isLoading: spaceLoading } = useQuery<any>({
    queryKey: [`/api/spaces/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/spaces/${id}`);
      if (!res.ok) throw new Error("Space not found");
      return res.json();
    },
  });

  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<any[]>({
    queryKey: [`/api/spaces/${id}/posts`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/spaces/${id}/posts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const handleJoinLeave = async () => {
    if (!user) { toast({ title: "Sign in to join" }); return; }
    setIsActing(true);
    const endpoint = space.member ? "leave" : "join";
    await apiRequest("POST", `/api/spaces/${id}/${endpoint}`, {});
    queryClient.invalidateQueries({ queryKey: [`/api/spaces/${id}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
    setIsActing(false);
  };

  const handlePost = async () => {
    if (!user) { toast({ title: "Sign in to post" }); return; }
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      await apiRequest("POST", `/api/spaces/${id}/posts`, { content: postContent.trim() });
      setPostContent("");
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: [`/api/spaces/${id}`] });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsPosting(false);
  };

  const handleLike = async (postId: number) => {
    if (!user) { toast({ title: "Sign in to like" }); return; }
    await apiRequest("POST", `/api/spaces/posts/${postId}/like`, {});
    refetchPosts();
  };

  if (spaceLoading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );

  if (!space) return (
    <div className="text-center py-20 text-muted-foreground">
      <p>Space not found</p>
      <Link href="/spaces"><Button variant="link" className="mt-2">Back to Spaces</Button></Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/spaces">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> All Spaces
        </button>
      </Link>

      {/* Space header */}
      <div className="rounded-2xl border border-card-border bg-card card-elevated p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl shrink-0">
            {space.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{space.name}</h1>
            {space.description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{space.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {space.memberCount} members</span>
              <span>·</span>
              <span>{space.postCount} posts</span>
              <span>·</span>
              <span>by {space.owner?.username}</span>
            </div>
          </div>
          {!space.spaceOwner && !(space.isPaid && !space.member) && (
            <Button
              size="sm"
              variant={space.member ? "outline" : "default"}
              onClick={handleJoinLeave}
              disabled={isActing}
              className="shrink-0"
            >
              {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : space.member ? "Leave" : "Join Space"}
            </Button>
          )}
          {space.isPaid && !space.member && !space.spaceOwner && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-base font-bold text-primary">${space.priceMonthly}</span>
              <span className="text-xs text-muted-foreground">/mo</span>
            </div>
          )}
          {space.spaceOwner && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium shrink-0">
              Owner
            </span>
          )}
        </div>
      </div>

      {/* Post composer — members only */}
      {(space.member || space.spaceOwner) ? (
        <div className="rounded-2xl border border-card-border bg-card card-elevated p-4 mb-5">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value.slice(0, 1000))}
                placeholder={`Post something in ${space.name}…`}
                rows={3}
                className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">{postContent.length}/1000</span>
                <Button size="sm" onClick={handlePost} disabled={isPosting || !postContent.trim()}>
                  {isPosting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Posting…</> : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : space.isPaid ? (
        /* ── Payment gateway for paid spaces ── */
        <div className="rounded-2xl border border-primary/20 bg-card card-elevated p-6 mb-5">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{space.emoji}</div>
            <h2 className="text-lg font-bold">{space.name}</h2>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">Premium Space</p>
            <div className="mt-3 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">${space.priceMonthly}</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-6">
            {[
              "Full access to all posts and discussions",
              "Direct interaction with the creator",
              "Exclusive content and project updates",
              "Grandfathered pricing when paid access launches",
            ].map(feature => (
              <div key={feature} className="flex items-center gap-2.5 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Grayed-out payment form — visual only */}
          <div className="space-y-2.5 mb-5 opacity-35 select-none pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Payment Details</span>
            </div>
            <input
              readOnly
              placeholder="•••• •••• •••• ••••"
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-3">
              <input readOnly placeholder="MM / YY" className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60" />
              <input readOnly placeholder="CVC" className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60" />
            </div>
          </div>

          {/* Beta notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-4 text-center">
            <p className="text-xs text-amber-400 leading-relaxed">
              <span className="font-semibold">Payment processing coming soon!</span> We're still setting up our payment system — no card required yet. Click below to join for free during beta. Early members get grandfathered pricing when subscriptions launch.
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={handleJoinLeave} disabled={isActing}>
            {isActing
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Heart className="w-4 h-4 mr-2" />}
            I'm Interested — Join Free During Beta
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 mb-5 text-center text-sm text-muted-foreground">
          <span>Join this space to post and interact</span>
        </div>
      )}

      {/* Posts feed */}
      <div className="space-y-4">
        {postsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-card-border bg-card p-4">
              <div className="flex gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">
              {space.member || space.spaceOwner ? "Be the first to post something!" : "Join the space to start posting."}
            </p>
          </div>
        ) : (
          posts.map((post: any) => (
            <SpacePostCard key={post.id} post={post} onLike={handleLike} />
          ))
        )}
      </div>
    </div>
  );
}
