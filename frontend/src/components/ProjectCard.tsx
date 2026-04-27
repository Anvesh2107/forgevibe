import { useState } from "react";
import { Link } from "wouter";
import { Heart, MessageSquare, ExternalLink, Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import DiamondButton from "./DiamondButton";

interface ProjectCardProps {
  project: any;
  rank?: number;
  showRank?: boolean;
}

const TAG_COLORS: Record<string, string> = {
  "Java": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Python": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "JavaScript": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "TypeScript": "bg-blue-600/10 text-blue-300 border-blue-600/20",
  "React": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Spring Boot": "bg-green-500/10 text-green-400 border-green-500/20",
  "Node.js": "bg-green-600/10 text-green-300 border-green-600/20",
  "AI/ML": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "DevOps": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Security": "bg-red-500/10 text-red-400 border-red-500/20",
  "Open Source": "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "Mobile": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Web3": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Data Engineering": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Infrastructure": "bg-stone-500/10 text-stone-400 border-stone-500/20",
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="rank-gold w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">#1</div>;
  if (rank === 2) return <div className="rank-silver w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">#2</div>;
  if (rank === 3) return <div className="rank-bronze w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">#3</div>;
  return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">#{rank}</div>;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-xs font-mono font-bold", color)}>{Math.round(score)}</span>
      <span className="text-xs text-muted-foreground" style={{ fontSize: "0.6rem" }}>{label}</span>
    </div>
  );
}

export default function ProjectCard({ project, rank, showRank = false }: ProjectCardProps) {
  const { user, hasDiamondThisWeek } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [localProject, setLocalProject] = useState(project);

  const tags = (() => { try { return JSON.parse(localProject.tags || "[]"); } catch { return []; } })();
  const hasDiamonds = localProject.diamondCount > 0;

  const handleLike = async () => {
    if (!user) { toast({ title: "Sign in to like projects" }); return; }
    setIsLiking(true);
    try {
      const res = await apiRequest("POST", `/api/projects/${localProject.id}/like`, {});
      const data = await res.json();
      setLocalProject(data.project);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    } catch {}
    setIsLiking(false);
  };

  const handleDiamondSuccess = (updated: any) => {
    setLocalProject(updated);
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  };

  const rankChange = localProject.weeklyRankChange || 0;

  return (
    <div
      data-testid={`card-project-${localProject.id}`}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-card transition-all duration-300",
        hasDiamonds ? "diamond-glow-card" : "border-card-border hover:border-border",
      )}
    >
      {/* Cover image */}
      <div className="relative overflow-hidden rounded-t-xl" style={{ aspectRatio: "16/9" }}>
        {localProject.analysisStatus === "analyzing" && (
          <div className="absolute inset-x-0 top-0 h-0.5 analyzing-gradient z-10" />
        )}
        {localProject.coverImageUrl ? (
          <img
            src={localProject.coverImageUrl}
            alt={localProject.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {/* Fallback gradient */}
        <div className={cn(
          "w-full h-full flex items-center justify-center",
          localProject.coverImageUrl ? "hidden" : "flex",
        )} style={{ background: "linear-gradient(135deg, #0f1e3d 0%, #0B1628 50%, #071020 100%)" }}>
          <span className="text-4xl opacity-30">⚡</span>
        </div>

        {/* Rank badge overlay */}
        {showRank && rank && (
          <div className="absolute top-2 left-2">
            <RankBadge rank={rank} />
          </div>
        )}

        {/* Analysis status */}
        {localProject.analysisStatus === "pending" || localProject.analysisStatus === "analyzing" ? (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-xs text-cyan-400 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            AI Analyzing...
          </div>
        ) : localProject.aiScore !== null && localProject.aiScore !== undefined ? (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ color: localProject.aiScore >= 80 ? "#4ade80" : localProject.aiScore >= 60 ? "#facc15" : "#f87171" }}>
            AI {Math.round(localProject.aiScore)}
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/projects/${localProject.id}`}>
              <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors truncate" data-testid={`text-project-name-${localProject.id}`}>
                {localProject.name}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {localProject.description}
            </p>
          </div>
          {rankChange !== 0 && (
            <div className={cn("flex items-center gap-0.5 text-xs font-mono shrink-0",
              rankChange > 0 ? "text-green-400" : "text-red-400")}>
              {rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(rankChange)}
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag: string) => (
              <span key={tag} className={cn(
                "tag-pill px-2 py-0.5 rounded border text-xs",
                TAG_COLORS[tag] || "bg-muted text-muted-foreground border-border"
              )}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Developer row */}
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5 shrink-0">
            <AvatarImage src={localProject.user?.avatarUrl} />
            <AvatarFallback className="text-xs">{localProject.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <Link href={`/users/${localProject.user?.username}`}>
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {localProject.user?.username}
              {localProject.user?.verified && <span className="ml-1 text-primary">✓</span>}
            </span>
          </Link>
          {localProject.githubStars > 0 && (
            <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground font-mono">
              <Star className="w-3 h-3" />
              {localProject.githubStars >= 1000 ? `${(localProject.githubStars / 1000).toFixed(1)}k` : localProject.githubStars}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/50">
          {/* Diamond button */}
          <DiamondButton
            project={localProject}
            onSuccess={handleDiamondSuccess}
          />

          {/* Like */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              localProject.hasLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"
            )}
            data-testid={`button-like-${localProject.id}`}
          >
            <Heart className={cn("w-3.5 h-3.5", localProject.hasLiked && "fill-current")} />
            {localProject.likeCount}
          </button>

          {/* Comments */}
          <Link href={`/projects/${localProject.id}#comments`}>
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {localProject.commentCount}
            </button>
          </Link>

          {/* ForgeVibe Score */}
          <div className="ml-auto flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="forgevibe-score text-sm font-bold font-mono">
                    {Math.round(localProject.forgevibeScore || 0).toLocaleString()}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <div className="space-y-1">
                    <div>💎 ×{localProject.diamondCount} = {localProject.diamondCount * 50}</div>
                    <div>⭐ ×{localProject.githubStars} = {localProject.githubStars * 3}</div>
                    <div>❤️ ×{localProject.likeCount} = {localProject.likeCount}</div>
                    <div>🤖 AI {Math.round(localProject.aiScore || 0)} ×40 = {Math.round((localProject.aiScore || 0) * 40)}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      <Skeleton className="w-full" style={{ aspectRatio: "16/9" }} />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
