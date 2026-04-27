import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Star, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const TAGS = ["All", "Java", "Python", "JavaScript", "TypeScript", "React", "AI/ML", "DevOps", "Security", "Open Source"];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="rank-gold w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#1</div>;
  if (rank === 2) return <div className="rank-silver w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#2</div>;
  if (rank === 3) return <div className="rank-bronze w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#3</div>;
  return <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-mono text-muted-foreground shrink-0">#{rank}</div>;
}

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("weekly");
  const [activeTag, setActiveTag] = useState("All");

  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard", { period, ...(activeTag !== "All" ? { tag: activeTag } : {}) }],
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          🏆 Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ranked by ForgeVibe Score: (💎×50) + (⭐×3) + (❤️×1) + (AI×40)
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={cn(
                "tag-pill px-3 py-1 rounded-full border text-xs transition-colors",
                activeTag === tag ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-card-border bg-card">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <span className="text-4xl block mb-4">🏆</span>
            No projects in this period yet
          </div>
        ) : (
          entries.map((entry: any) => {
            const tags = (() => { try { return JSON.parse(entry.tags || "[]"); } catch { return []; } })();
            const hasDiamonds = entry.diamondCount > 0;
            const rankChange = entry.weeklyRankChange || 0;

            return (
              <div
                key={entry.id}
                data-testid={`row-leaderboard-${entry.id}`}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                  hasDiamonds
                    ? "diamond-glow-card"
                    : "border-card-border bg-card hover:border-border",
                  entry.rank <= 3 && "bg-card"
                )}
              >
                <RankBadge rank={entry.rank} />

                {/* Cover thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {entry.coverImageUrl ? (
                    <img src={entry.coverImageUrl} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">⚡</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${entry.id}`}>
                      <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate">
                        {entry.name}
                      </h3>
                    </Link>
                    {rankChange !== 0 && (
                      <span className={cn("text-xs font-mono flex items-center gap-0.5",
                        rankChange > 0 ? "text-green-400" : "text-red-400")}>
                        {rankChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(rankChange)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={entry.user?.avatarUrl} />
                      <AvatarFallback className="text-xs">{entry.user?.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <Link href={`/users/${entry.user?.username}`}>
                      <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        {entry.user?.username}
                      </span>
                    </Link>
                    <div className="flex flex-wrap gap-1 ml-2">
                      {tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="tag-pill text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-center">
                          <div className={cn("text-sm font-mono font-bold", entry.diamondCount > 0 ? "text-[#B9F2FF]" : "text-muted-foreground")}>
                            💎 ×{entry.diamondCount}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <div>💎 ×{entry.diamondCount} = {entry.diamondCount * 50} pts</div>
                          <div>⭐ ×{entry.githubStars} = {entry.githubStars * 3} pts</div>
                          <div>❤️ ×{entry.likeCount} = {entry.likeCount} pts</div>
                          {entry.aiScore && <div>🤖 AI {Math.round(entry.aiScore)} ×40 = {Math.round(entry.aiScore * 40)} pts</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="text-right hidden sm:block">
                    <div className="forgevibe-score text-lg font-bold font-mono">
                      {Math.round(entry.forgevibeScore || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
