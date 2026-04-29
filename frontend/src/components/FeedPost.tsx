import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Star, Github, Globe, Share2, Twitter, Linkedin, Link2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import DiamondButton from "./DiamondButton";
import ReactionPicker from "./ReactionPicker";
import CommentThread, { type CommentData } from "./CommentThread";
import { useReactions } from "@/hooks/use-reactions";

const TAG_COLORS: Record<string, string> = {
  "Java":             "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Python":           "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "JavaScript":       "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "TypeScript":       "bg-blue-600/10 text-blue-300 border-blue-600/20",
  "React":            "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Spring Boot":      "bg-green-500/10 text-green-400 border-green-500/20",
  "Node.js":          "bg-green-600/10 text-green-300 border-green-600/20",
  "AI/ML":            "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "DevOps":           "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Security":         "bg-red-500/10 text-red-400 border-red-500/20",
  "Open Source":      "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Mobile":           "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Web3":             "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Data Engineering": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Infrastructure":   "bg-stone-500/10 text-stone-400 border-stone-500/20",
};

interface FeedPostProps {
  project: any;
  rank?: number;
}

export default function FeedPost({ project, rank }: FeedPostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [local, setLocal] = useState(project);
  const [showAllComments, setShowAllComments] = useState(false);
  // Optimistic local comments (replies included)
  const [localComments, setLocalComments] = useState<CommentData[]>([]);

  const tags = (() => { try { return JSON.parse(local.tags || "[]"); } catch { return []; } })();

  // Load comments from API
  const { data: apiComments = [], refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/projects/${local.id}/comments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${local.id}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!local.id,
  });

  // Merge API comments + local (optimistic) ones, then nest replies.
  // Filter out optimistic locals whose content is already confirmed in apiComments
  // to prevent duplicates after a refetch.
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

  // Build tree: replies start with "@username " prefix stored in body
  const threads: CommentData[] = [];
  const byId: Record<string | number, CommentData> = {};
  for (const c of allFlat) { byId[c.id] = { ...c, replies: [] }; }
  for (const c of allFlat) {
    const node = byId[c.id];
    if (c.body.startsWith("__reply__:")) {
      // internal marker: "__reply__:{parentId}:@username actual body"
      const [, parentIdStr, ...rest] = c.body.split(":");
      node.body = rest.join(":"); // strip the marker
      const parent = byId[parseInt(parentIdStr)];
      if (parent) { parent.replies = [...(parent.replies || []), node]; continue; }
    }
    threads.push(node);
  }

  const displayed = showAllComments ? threads : threads.slice(0, 2);

  // Like / reaction
  const likeToggle = useCallback(async () => {
    if (!user) { toast({ title: "Sign in to react" }); return null; }
    const res = await apiRequest("POST", `/api/projects/${local.id}/like`, {});
    const data = await res.json();
    setLocal(data.project);
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    return { liked: data.project.hasLiked, likeCount: data.project.likeCount };
  }, [local.id, user, toast]);

  const { currentReaction, counts, handleReact, isReacting } = useReactions(
    "project", local.id, local.hasLiked, local.likeCount ?? 0, likeToggle
  );

  const handleDiamondSuccess = (updated: any) => {
    setLocal(updated);
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/diamond-givers"] });
  };

  // Post top-level comment
  const handlePost = async (body: string) => {
    if (!user) { toast({ title: "Sign in to weigh in" }); return; }
    try {
      await apiRequest("POST", `/api/projects/${local.id}/comments`, { content: body });
      setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
      refetchComments();
    } catch {}
  };

  // Post reply (1-level)
  const handleReply = async (parent: CommentData, body: string) => {
    if (!user) { toast({ title: "Sign in to reply" }); return; }
    const taggedBody = `@${parent.user?.username} ${body}`;
    const optimisticId = `opt-${Date.now()}`;
    // Add nested under parent via __reply__ marker — don't refetch after posting
    // because the backend stores replies as flat top-level comments (no parentId),
    // so refetching would add a duplicate top-level entry alongside this nested one.
    setLocalComments(prev => [...prev, {
      id: optimisticId,
      body: `__reply__:${parent.id}:${taggedBody}`,
      createdAt: new Date().toISOString(),
      user: { username: user.username, avatarUrl: user.avatarUrl },
      replies: [],
    }]);
    setLocal((p: any) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
    try {
      // Store the __reply__ prefix in the DB so refetches can reconstruct the thread.
      await apiRequest("POST", `/api/projects/${local.id}/comments`, { content: `__reply__:${parent.id}:${taggedBody}` });
    } catch {}
  };

  const timeAgo = (() => {
    try {
      const s = local.createdAt;
      const d = new Date(s?.endsWith("Z") || s?.includes("+") ? s : s + "Z");
      return formatDistanceToNow(d, { addSuffix: true });
    }
    catch { return ""; }
  })();

  return (
    <div
      data-testid={`card-project-${local.id}`}
      className={cn(
        "rounded-2xl border bg-card overflow-hidden transition-all duration-300",
        local.diamondCount > 0 ? "diamond-glow-card" : "border-card-border"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/users/${local.user?.username}`}>
          <Avatar className="w-10 h-10 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
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
            <span className="text-xs text-muted-foreground">shipped a build</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{timeAgo}</span>
            {local.githubStars > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {local.githubStars >= 1000 ? `${(local.githubStars / 1000).toFixed(1)}k` : local.githubStars} stars
                </span>
              </>
            )}
            {rank && (
              <>
                <span>·</span>
                <span className={cn(
                  "font-mono font-bold text-xs",
                  rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : rank === 3 ? "text-amber-600" : "text-muted-foreground"
                )}>#{rank}</span>
              </>
            )}
          </div>
        </div>

        {/* AI score — only show when actually analyzed */}
        {local.aiScore > 0 && (
          <div className={cn(
            "shrink-0 text-xs font-mono font-bold px-2.5 py-1 rounded-full border",
            local.aiScore >= 85 ? "bg-green-500/10 text-green-400 border-green-500/20"
            : local.aiScore >= 70 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            AI {Math.round(local.aiScore)}
          </div>
        )}
      </div>

      {/* ── Cover image (only when one exists) ── */}
      {local.coverImageUrl && (
        <Link href={`/projects/${local.id}`}>
          <div className="relative mx-4 rounded-xl overflow-hidden mb-3 cursor-pointer" style={{ aspectRatio: "16/7" }}>
            {local.analysisStatus === "analyzing" && (
              <div className="absolute inset-x-0 top-0 h-0.5 analyzing-gradient z-10" />
            )}
            <img
              src={local.coverImageUrl}
              alt={local.name}
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          </div>
        </Link>
      )}

      {/* ── Project info ── */}
      <div className="px-4 mb-3 space-y-2">
        {/* Title */}
        <Link href={`/projects/${local.id}`}>
          <h2 className="font-bold text-lg leading-tight hover:text-primary transition-colors cursor-pointer">
            {local.name}
          </h2>
        </Link>

        {/* GitHub repo chip — styled like a terminal path */}
        {local.githubUrl?.includes("github.com") && (
          <a
            href={local.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#58a6ff] hover:border-[#58a6ff]/60 hover:bg-[#161b22] transition-all group max-w-full"
          >
            <Github className="w-3.5 h-3.5 text-[#8b949e] group-hover:text-[#58a6ff] shrink-0 transition-colors" />
            <span className="truncate">
              {(() => {
                try {
                  return new URL(local.githubUrl).pathname.replace(/^\//, "").replace(/\.git$/, "");
                } catch { return local.githubUrl; }
              })()}
            </span>
          </a>
        )}

        {/* Description — skip if identical to title */}
        {local.description &&
          local.description.trim().toLowerCase() !== (local.name || "").trim().toLowerCase() && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {local.description}
          </p>
        )}

        {/* AI vibe check */}
        {local.analysis?.vibeCheck && (
          <div className="border-l-2 border-primary/50 pl-3">
            <p className="text-xs text-muted-foreground/80 italic leading-relaxed">
              {local.analysis.vibeCheck}
            </p>
          </div>
        )}

        {/* Analyzing indicator */}
        {(local.analysisStatus === "pending" || local.analysisStatus === "analyzing") && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            AI analysis in progress…
          </div>
        )}

        {/* External URL chip (non-GitHub links — e.g. Medium, blog, live site) */}
        {local.githubUrl && !local.githubUrl.includes("github.com") && (
          <a
            href={local.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:border-border transition-all max-w-full"
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {(() => { try { return new URL(local.githubUrl).hostname.replace(/^www\./, "") + new URL(local.githubUrl).pathname.replace(/\/$/, ""); } catch { return local.githubUrl; } })()}
            </span>
          </a>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag: string) => (
              <span key={tag} className={cn(
                "px-2 py-0.5 rounded-full border text-xs font-medium",
                TAG_COLORS[tag] || "bg-muted text-muted-foreground border-border"
              )}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Score bar ── */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help">
                <span className="forgevibe-score text-lg font-bold font-mono">
                  {Math.round(local.forgevibeScore || 0).toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="text-xs space-y-1">
              <div>💎 ×{local.diamondCount} = {local.diamondCount * 50}</div>
              <div>⭐ ×{local.githubStars} = {local.githubStars * 3}</div>
              <div>✅ ×{local.likeCount} = {local.likeCount}</div>
              {local.aiScore && <div>🤖 AI {Math.round(local.aiScore)} ×40 = {Math.round(local.aiScore * 40)}</div>}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>💎 ×{local.diamondCount}</span>
          <span>·</span>
          <span>✅ {local.likeCount}</span>
          <span>·</span>
          <span>💬 {local.commentCount}</span>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="border-t border-border/50 mx-4" />
      <div className="flex items-stretch px-2 py-1">
        {/* Reaction picker */}
        <ReactionPicker
          currentReaction={currentReaction}
          counts={counts}
          onReact={handleReact}
          disabled={isReacting}
          testIdPrefix={`project-${local.id}-`}
        />

        {/* Diamond */}
        <div className="flex-1 flex items-center justify-center">
          <DiamondButton project={local} onSuccess={handleDiamondSuccess} feedMode />
        </div>

        {/* Share */}
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
                onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent((local.name || local.title) + " — " + window.location.origin + "/projects/" + local.id)}`, "_blank")}
                className="gap-2 cursor-pointer"
              >
                <Twitter className="w-4 h-4" /> Share on X
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/projects/" + local.id)}`, "_blank")}
                className="gap-2 cursor-pointer"
              >
                <Linkedin className="w-4 h-4" /> Share on LinkedIn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/projects/${local.id}`);
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
          inputTestId={`input-comment-${local.id}`}
          submitTestId={`button-post-comment-${local.id}`}
        />
      </div>
    </div>
  );
}

export function FeedPostSkeleton() {
  return (
    <div className="rounded-2xl border border-card-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="px-4 space-y-2 mb-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <div className="mx-4 mb-3 h-10 rounded-xl bg-muted/30" />
      <div className="border-t border-border/50 mx-4" />
      <div className="flex px-2 py-1 gap-1">
        {[0,1,2,3].map(i => <Skeleton key={i} className="flex-1 h-10 rounded-xl" />)}
      </div>
    </div>
  );
}
