import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Heart, MessageSquare, Star, Github, Globe, Cpu, Shield, Code2, BookOpen, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DiamondButton from "@/components/DiamondButton";

function ScoreBar({ score, label, icon: Icon, color }: { score: number; label: string; icon: any; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm">
          <Icon className={cn("w-4 h-4", color)} />
          <span className="font-medium">{label}</span>
        </div>
        <span className={cn("font-mono font-bold text-sm", color)}>{Math.round(score)}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color === "text-green-400" ? "bg-green-500" : color === "text-blue-400" ? "bg-blue-500" : color === "text-yellow-400" ? "bg-yellow-500" : "bg-purple-500")}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasDiamondThisWeek } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const { data: project, isLoading, refetch } = useQuery<any>({
    queryKey: [`/api/projects/${id}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    // Poll every 4 s while AI analysis is still running
    refetchInterval: (query: any) => {
      const d = query.state.data;
      return d && (d.analysisStatus === "pending" || d.analysisStatus === "analyzing") ? 4000 : false;
    },
  });

  const { data: comments = [], refetch: refetchComments } = useQuery<any[]>({
    queryKey: [`/api/projects/${id}/comments`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/projects/${id}/comments`);
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="w-full h-64 rounded-xl" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
    </div>
  );

  if (!project) return <div className="text-center py-20"><p>Project not found</p></div>;

  const tags = (() => { try { return JSON.parse(project.tags || "[]"); } catch { return []; } })();
  const analysis = project.analysis;
  const diamondGivers: any[] = Array.isArray(project.diamondGivers) ? project.diamondGivers : [];
  const strengths = (() => { try { return JSON.parse(analysis?.strengths || "[]"); } catch { return []; } })();
  const improvements = (() => { try { return JSON.parse(analysis?.improvements || "[]"); } catch { return []; } })();

  const handleLike = async () => {
    if (!user) { toast({ title: "Sign in to like" }); return; }
    setIsLiking(true);
    await apiRequest("POST", `/api/projects/${id}/like`, {});
    refetch();
    setIsLiking(false);
  };

  const handleComment = async () => {
    if (!user) { toast({ title: "Sign in to comment" }); return; }
    if (!comment.trim()) return;
    setIsCommenting(true);
    const res = await apiRequest("POST", `/api/projects/${id}/comments`, { content: comment });
    if (res.ok) {
      setComment("");
      refetchComments();
      refetch();
    }
    setIsCommenting(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover */}
      <div className="relative rounded-xl overflow-hidden mb-6 bg-muted" style={{ aspectRatio: "21/9" }}>
        {project.coverImageUrl ? (
          <img src={project.coverImageUrl} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f1e3d, #0B1628)" }}>
            <span className="text-6xl opacity-20">⚡</span>
          </div>
        )}
        {project.analysisStatus === "analyzing" && (
          <div className="absolute inset-x-0 bottom-0 h-1 analyzing-gradient" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold tracking-tight mb-1">{project.name}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag: string) => (
                <span key={tag} className="tag-pill text-xs px-2.5 py-1 rounded-lg border bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          </div>

          {/* AI Analysis */}
          {project.analysisStatus === "live" ? (
            <div className="rounded-xl border border-card-border bg-card/50 p-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Live Project</p>
                <p className="text-xs text-muted-foreground">AI code analysis is available for GitHub repos.</p>
              </div>
            </div>
          ) : project.analysisStatus === "pending" || project.analysisStatus === "analyzing" ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full analyzing-gradient analyzing-icon-glow flex items-center justify-center shrink-0 text-base">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">AI Analysis Running</h3>
                    <span className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Scanning repository for patterns…</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {([
                  { label: "Architecture", cls: "analyzing-bar-1" },
                  { label: "Security",     cls: "analyzing-bar-2" },
                  { label: "Code Quality", cls: "analyzing-bar-3" },
                  { label: "Docs / DX",   cls: "analyzing-bar-4" },
                ] as const).map(({ label, cls }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div className={`h-full analyzing-gradient rounded-full ${cls}`} style={{ width: "12%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : analysis ? (
            <div className="rounded-xl border border-card-border bg-card p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <h3 className="font-semibold">AI Repository Analysis</h3>
                <span className="text-xs text-muted-foreground ml-auto font-mono">by Perplexity Computer</span>
              </div>

              {/* Summary */}
              {analysis.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                  {analysis.summary}
                </p>
              )}

              {/* Vibe Check */}
              {analysis.vibeCheck && (
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">Vibe Check</span>
                  <p className="text-sm mt-1">{analysis.vibeCheck}</p>
                </div>
              )}

              {/* Score bars */}
              <div className="space-y-3">
                <ScoreBar score={analysis.architectureScore || 0} label="Architecture" icon={Cpu} color="text-blue-400" />
                <ScoreBar score={analysis.securityScore || 0} label="Security" icon={Shield} color="text-green-400" />
                <ScoreBar score={analysis.qualityScore || 0} label="Code Quality" icon={Code2} color="text-yellow-400" />
                <ScoreBar score={analysis.docsScore || 0} label="Docs / DX" icon={BookOpen} color="text-purple-400" />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {/* Strengths */}
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">✓ Strengths</h4>
                  <ul className="space-y-1.5">
                    {strengths.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-green-400 shrink-0">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Improvements */}
                <div>
                  <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">↑ Improvements</h4>
                  <ul className="space-y-1.5">
                    {improvements.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="text-yellow-400 shrink-0">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {/* Comments */}
          <div id="comments" className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Comments ({project.commentCount})
            </h3>

            {/* Comment input */}
            <div className="space-y-2">
              <Textarea
                placeholder={user ? "Share your thoughts..." : "Sign in to comment..."}
                value={comment}
                onChange={e => setComment(e.target.value)}
                disabled={!user}
                rows={3}
                data-testid="input-comment"
              />
              <Button
                onClick={handleComment}
                disabled={isCommenting || !user || !comment.trim()}
                size="sm"
                data-testid="button-submit-comment"
              >
                {isCommenting ? "Posting..." : "Post Comment"}
              </Button>
            </div>

            {/* Comment list */}
            <div className="space-y-3">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={c.author?.avatarUrl} />
                    <AvatarFallback className="text-xs">{c.author?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/users/${c.author?.username}`}>
                        <span className="text-xs font-semibold hover:text-primary transition-colors">{c.author?.username}</span>
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono">{format(new Date(c.createdAt), "MMM d")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Score card */}
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-center mb-4">
              <div className="forgevibe-score text-3xl font-bold font-mono">
                {Math.round(project.forgevibeScore || 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">ForgeVibe Score</div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">💎 Diamonds</span>
                <span className="font-mono text-[#B9F2FF]">×{project.diamondCount} = {project.diamondCount * 50}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">⭐ GitHub Stars</span>
                <span className="font-mono">×{project.githubStars} = {project.githubStars * 3}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">❤️ Likes</span>
                <span className="font-mono">×{project.likeCount} = {project.likeCount}</span>
              </div>
              {project.aiScore && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">🤖 AI Score</span>
                  <span className="font-mono">{Math.round(project.aiScore)} ×40 = {Math.round(project.aiScore * 40)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <DiamondButton project={project} onSuccess={() => refetch()} />
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  "flex items-center gap-1.5 text-sm flex-1 justify-center py-1.5 rounded-lg border transition-colors",
                  project.hasLiked ? "border-red-500/30 text-red-400 bg-red-500/5" : "border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30"
                )}
              >
                <Heart className={cn("w-4 h-4", project.hasLiked && "fill-current")} />
                {project.hasLiked ? "Liked" : "Like"}
              </button>
            </div>
          </div>

          {/* Developer */}
          <div className="rounded-xl border border-card-border bg-card p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Developer</h4>
            <Link href={`/users/${project.user?.username}`}>
              <div className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1 transition-colors cursor-pointer">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={project.user?.avatarUrl} />
                  <AvatarFallback>{project.user?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">
                    {project.user?.username}
                    {project.user?.verified && <span className="ml-1 text-primary text-xs">✓</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {project.user?.reputationPoints} rep
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Diamond Givers */}
          {diamondGivers.length > 0 && (
            <div className="rounded-xl border border-[#B9F2FF]/20 bg-[#B9F2FF]/5 p-4">
              <h4 className="text-xs font-semibold text-[#B9F2FF] uppercase tracking-wide mb-3">
                💎 Diamond Givers ({diamondGivers.length})
              </h4>
              <div className="space-y-2">
                {diamondGivers.map((d: any) => (
                  <div key={d.id} className="flex items-start gap-2">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarImage src={d.avatarUrl} />
                      <AvatarFallback className="text-xs">{d.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-medium">{d.username}</div>
                      {d.note && <div className="text-xs text-muted-foreground italic">"{d.note}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Link */}
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full flex items-center gap-2">
              <Github className="w-4 h-4" />
              View on GitHub
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
