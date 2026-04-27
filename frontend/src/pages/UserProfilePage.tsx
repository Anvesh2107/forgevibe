import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Star, Users, BookOpen, Zap, Trophy, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProjectCard from "@/components/ProjectCard";
import { apiRequest } from "@/lib/queryClient";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: [`/api/users/${username}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${username}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: userProjects = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${username}/projects`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${username}/projects`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  if (userLoading) return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 py-8">
      <div className="flex items-start gap-4">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">👤</div>
      <p className="text-muted-foreground font-medium">User not found</p>
      <p className="text-xs text-muted-foreground mt-1">@{username} doesn't exist yet</p>
    </div>
  );

  const totalDiamonds = userProjects.reduce((sum: number, p: any) => sum + (p.diamondCount || 0), 0);
  const joinedAgo = (() => {
    try {
      if (!user.createdAt) return null;
      const s = user.createdAt;
      const d = new Date(s?.endsWith("Z") || s?.includes("+") ? s : s + "Z");
      return formatDistanceToNow(d, { addSuffix: true });
    } catch { return null; }
  })();

  const displayName = user.displayName || user.username;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Profile card ── */}
      <div className="rounded-2xl border border-card-border bg-card p-6 mb-5">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20 ring-2 ring-border">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-2xl">{displayName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {user.verified && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</span>
            )}
          </div>

          {/* Name / bio / meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <a
                href={`https://github.com/${user.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1.5 shrink-0"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>

            {user.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{user.bio}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              {user.followerCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {user.followerCount.toLocaleString()} followers
                </span>
              )}
              {user.publicRepoCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {user.publicRepoCount} repos
                </span>
              )}
              {joinedAgo && (
                <span>Joined {joinedAgo}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { icon: <Zap className="w-4 h-4 text-yellow-400" />, value: user.forgeScore ?? 0, label: "ForgeScore" },
            { icon: <span className="text-base">💎</span>, value: totalDiamonds, label: "Diamonds" },
            { icon: <Star className="w-4 h-4 text-yellow-300" />, value: user.stars ?? 0, label: "Stars" },
            { icon: <span className="text-base">❤️</span>, value: userProjects.length, label: "Projects" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="rounded-xl border border-card-border bg-background p-3 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-lg font-bold font-mono forgevibe-score">{value.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Projects tab ── */}
      <Tabs defaultValue="projects">
        <TabsList className="mb-4">
          <TabsTrigger value="projects">
            Projects <span className="ml-1.5 text-xs text-muted-foreground">({userProjects.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {userProjects.length === 0 ? (
            <div className="rounded-2xl border border-card-border bg-card p-12 text-center">
              <div className="text-3xl mb-2">🛠️</div>
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Projects submitted by {displayName} will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userProjects.map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
