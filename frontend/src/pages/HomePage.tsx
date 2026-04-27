import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  PlusCircle, Zap, Star, TrendingUp, TrendingDown, Layers, MessageSquare, FolderGit2,
} from "lucide-react";
import FeedPost, { FeedPostSkeleton } from "@/components/FeedPost";
import ThoughtPost from "@/components/ThoughtPost";
import PostComposer from "@/components/PostComposer";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const FEED_TAGS = [
  "All", "Java", "Python", "JavaScript", "TypeScript", "React",
  "Spring Boot", "Node.js", "AI/ML", "DevOps", "Security",
  "Open Source", "Mobile", "Web3", "Data Engineering", "Infrastructure",
];

const LB_TAGS = [
  "All", "Java", "Python", "JavaScript", "TypeScript", "React",
  "AI/ML", "DevOps", "Security", "Open Source",
];

// ─── Leaderboard rank badge ────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="rank-gold w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#1</div>;
  if (rank === 2) return <div className="rank-silver w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#2</div>;
  if (rank === 3) return <div className="rank-bronze w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg shrink-0">#3</div>;
  return <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-mono text-muted-foreground shrink-0">#{rank}</div>;
}

// ─── Tag filter strip ─────────────────────────────────────────────────────────

function TagStrip({
  tags,
  activeTag,
  onSelect,
}: {
  tags: string[];
  activeTag: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={cn(
            "tag-pill px-3 py-1 rounded-full border text-xs transition-colors",
            activeTag === tag
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Feed tab ─────────────────────────────────────────────────────────────────

function FeedTab() {
  const [feedTab, setFeedTab] = useState<"trending" | "new" | "all">("all");
  const [feedTag, setFeedTag] = useState("All");
  // Content-type filter: all | posts | projects
  const [contentType, setContentType] = useState<"all" | "posts" | "projects">("all");

  // Unified feed (projects + thoughts interleaved)
  const { data: feedItems = [], isLoading: feedLoading } = useQuery<any[]>({
    queryKey: ["/api/feed", { ...(feedTag !== "All" ? { tag: feedTag } : {}) }],
    enabled: feedTab === "all",
  });

  // Trending-only projects feed
  const { data: trendingProjects = [], isLoading: trendingLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", { feed: "trending", ...(feedTag !== "All" ? { tag: feedTag } : {}) }],
    enabled: feedTab === "trending",
  });

  // New projects feed
  const { data: newProjects = [], isLoading: newLoading } = useQuery<any[]>({
    queryKey: ["/api/projects", { feed: "new", ...(feedTag !== "All" ? { tag: feedTag } : {}) }],
    enabled: feedTab === "new",
  });

  const rawItems = feedTab === "all"
    ? feedItems.map((item: any) =>
        item.type === "thought"
          ? { ...item.thought, _type: "thought" }
          : { ...item.project, _type: "project" }
      )
    : feedTab === "trending" ? trendingProjects.map((p: any) => ({ ...p, _type: "project" }))
    : newProjects.map((p: any) => ({ ...p, _type: "project" }));

  // Apply content-type filter
  const items = contentType === "all" ? rawItems
    : contentType === "posts" ? rawItems.filter((i: any) => i._type === "thought")
    : rawItems.filter((i: any) => i._type === "project" || !i._type);

  const isLoading = feedTab === "all" ? feedLoading : feedTab === "trending" ? trendingLoading : newLoading;

  const { data: topGivers = [] } = useQuery<any[]>({
    queryKey: ["/api/diamond-givers"],
  });

  return (
    <div className="flex gap-6 items-start">
      {/* ── Main feed ── */}
      <div className="flex-1 min-w-0">
        {/* ── Post composer ── */}
        <div className="mb-4">
          <PostComposer onPosted={() => {}} />
        </div>

        {/* Content-type filter (All / Posts / Projects) */}
        <div className="flex gap-1.5 mb-3">
          {([
            { key: "all",      label: "All",      icon: Layers },
            { key: "posts",    label: "Posts",    icon: MessageSquare },
            { key: "projects", label: "Projects", icon: FolderGit2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setContentType(key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all",
                contentType === key
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border/70"
              )}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Feed subtabs */}
        <Tabs
          value={feedTab}
          onValueChange={v => setFeedTab(v as "all" | "trending" | "new")}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1.5">
              ✨ All
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Trending
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> New
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tag filter */}
        <div className="mb-5">
          <TagStrip
            tags={FEED_TAGS}
            activeTag={feedTag}
            onSelect={t => setFeedTag(t)}
          />
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <FeedPostSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-4">⚡</span>
            <h3 className="text-lg font-semibold">Nothing here yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Be the first to post a project or thought</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item: any, idx: number) =>
              item._type === "thought" ? (
                <ThoughtPost key={`thought-${item.id}`} thought={item} />
              ) : (
                <FeedPost
                  key={`project-${item.id}`}
                  project={item}
                  rank={feedTab === "trending" ? idx + 1 : undefined}
                />
              )
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-4 sticky top-20">
        {/* Diamond givers */}
        <div className="rounded-xl border border-card-border bg-card p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
            💎 Top Diamond Givers
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Curators who found winners early</p>
          {topGivers.length === 0 ? (
            <div className="text-xs text-muted-foreground">No diamonds given yet</div>
          ) : (
            <div className="space-y-2">
              {topGivers.slice(0, 8).map((giver: any, i: number) => (
                <Link href={`/users/${giver.user?.username}`} key={giver.user?.id}>
                  <div className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-1 py-0.5 transition-colors cursor-pointer">
                    <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                    <img src={giver.user?.avatarUrl} className="w-5 h-5 rounded-full" />
                    <span className="text-xs flex-1 truncate">{giver.user?.username}</span>
                    <span className="text-xs text-cyan-400 font-mono">💎{giver.diamondsGiven}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h3 className="font-semibold text-sm mb-1">Share your project</h3>
          <p className="text-xs text-muted-foreground mb-3">Get AI analysis and community feedback</p>
          <Link href="/submit">
            <Button className="w-full flex items-center gap-1.5" size="sm">
              <PlusCircle className="w-4 h-4" />
              Submit Project
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}

// ─── Leaderboard tab ──────────────────────────────────────────────────────────

function LeaderboardTab() {
  const [period, setPeriod] = useState("weekly");
  const [lbTag, setLbTag] = useState("All");

  const { data: entries = [], isLoading } = useQuery<any[]>({
    queryKey: [
      "/api/leaderboard",
      { period, ...(lbTag !== "All" ? { tag: lbTag } : {}) },
    ],
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        {/* Period tabs */}
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tag filter */}
      <div className="mb-5">
        <TagStrip tags={LB_TAGS} activeTag={lbTag} onSelect={t => setLbTag(t)} />
      </div>

      {/* Leaderboard list */}
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

// ─── Main HomePage ─────────────────────────────────────────────────────────────

interface HomePageProps {
  defaultSection?: "feed" | "leaderboard";
}

export default function HomePage({ defaultSection = "feed" }: HomePageProps) {
  return (
    <div>
      {defaultSection === "feed" ? (
        <FeedTab />
      ) : (
        <LeaderboardTab />
      )}
    </div>
  );
}
