import { useState } from "react";
import { useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  Github, Cpu, Shield, Code2, BookOpen, Loader2, CheckCircle,
  PlusCircle, Brain, XCircle, AlertTriangle, MessageSquare, Flag,
} from "lucide-react";

const TAGS = [
  "Java", "Python", "JavaScript", "TypeScript", "React", "Spring Boot",
  "Node.js", "AI/ML", "DevOps", "Security", "Open Source", "Mobile",
  "Web3", "Data Engineering", "Infrastructure",
];

// ── Thought submission result states ──────────────────────────────────────────
type ThoughtResult =
  | { kind: "published" }
  | { kind: "needs_context"; reason: string }
  | { kind: "blocked"; reason: string; thoughtId: number }
  | { kind: "appeal_sent" };

export default function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  // "idea" = unified thought box | "project" = GitHub form
  const [mode, setMode] = useState<"idea" | "project">("idea");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thought / idea
  const [ideaText, setIdeaText] = useState("");
  const [thoughtResult, setThoughtResult] = useState<ThoughtResult | null>(null);
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealNote, setAppealNote] = useState("");
  const [showAppealInput, setShowAppealInput] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { githubUrl: "", name: "", description: "" },
  });
  const descLength = watch("description")?.length || 0;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  const handleOpen = (openMode?: "idea" | "project") => {
    if (!user) {
      toast({ title: "Sign in to post", description: "Use the Sign in button in the top right." });
      return;
    }
    if (openMode) setMode(openMode);
    setThoughtResult(null);
    setShowAppealInput(false);
    setAppealNote("");
    setOpen(true);
  };

  const closeAndReset = () => {
    setOpen(false);
    setIdeaText("");
    setThoughtResult(null);
    setShowAppealInput(false);
    setAppealNote("");
    reset();
    setSelectedTags([]);
  };

  // ── Submit a thought / idea ────────────────────────────────────────────────
  const onSubmitIdea = async () => {
    if (!ideaText.trim()) return;
    setIsSubmitting(true);
    setThoughtResult(null);
    try {
      const res = await apiRequest("POST", "/api/thoughts", { content: ideaText.trim() });
      const initial = await res.json();

      // Backend saves as "pending" and hands off to AI worker via Kafka.
      // Poll until the worker sets a final status (max 15s).
      let finalData = initial;
      if (initial.status === "pending" && initial.id) {
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 1000));
          try {
            const poll = await apiRequest("GET", `/api/thoughts/${initial.id}`);
            if (poll.ok) {
              const polled = await poll.json();
              if (polled.status !== "pending") { finalData = polled; break; }
            }
          } catch {}
        }
      }

      if (finalData.status === "published") {
        await queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
        setThoughtResult({ kind: "published" });
        onPosted?.();
        setTimeout(() => closeAndReset(), 1500);
      } else if (finalData.status === "needs_context") {
        setThoughtResult({ kind: "needs_context", reason: finalData.aiReason || "Add more technical context and try again." });
      } else if (finalData.status === "blocked") {
        setThoughtResult({ kind: "blocked", reason: finalData.aiReason || "AI determined this is not tech-relevant enough.", thoughtId: finalData.id });
      } else {
        // Still pending after timeout — optimistically publish
        await queryClient.invalidateQueries({ queryKey: ["/api/thoughts"] });
        await queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
        setThoughtResult({ kind: "published" });
        onPosted?.();
        setTimeout(() => closeAndReset(), 1500);
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  // ── Appeal an AI rejection ─────────────────────────────────────────────────
  const onAppeal = async (thoughtId: number) => {
    setIsAppealing(true);
    try {
      const res = await apiRequest("POST", `/api/thoughts/${thoughtId}/appeal`, { notes: appealNote.trim() });
      const data = await res.json();
      if (data.ok) {
        setThoughtResult({ kind: "appeal_sent" });
      } else {
        toast({ title: data.error || "Appeal failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsAppealing(false);
  };

  // ── Submit a project ───────────────────────────────────────────────────────
  const onSubmitProject = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/projects", {
        title: data.name,
        description: data.description,
        repoUrl: data.githubUrl,
        stack: selectedTags.join(", "),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "Submission failed", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ title: "🚀 Project posted!", description: "AI analysis is running in the background. Results in ~30s." });
      closeAndReset();
      onPosted?.();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* ── Composer trigger bar ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl border border-card-border bg-card px-4 py-3 flex items-center gap-3"
        data-testid="composer-trigger"
      >
        {user ? (
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div
          className="flex-1 bg-muted/50 hover:bg-muted/70 rounded-full px-4 py-2.5 text-sm text-muted-foreground transition-colors select-none cursor-pointer"
          onClick={() => handleOpen("idea")}
        >
          {user ? `What's on your mind, ${user.username.split("_")[0]}?` : "Share an idea..."}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm" variant="outline"
            className="gap-1.5 rounded-full px-3"
            onClick={() => handleOpen("idea")}
          >
            <Brain className="w-3.5 h-3.5" />
            Idea
          </Button>
          <Button
            size="sm"
            className="gap-1.5 rounded-full px-3"
            onClick={() => handleOpen("project")}
          >
            <Github className="w-3.5 h-3.5" />
            Project
          </Button>
        </div>
      </div>

      {/* ── Full submit dialog ───────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={v => { if (!v) closeAndReset(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {user && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              {mode === "idea" ? "Share an Idea" : "Submit a Project"}
            </DialogTitle>
          </DialogHeader>

          {/* ── IDEA / THOUGHT MODE ── */}
          {mode === "idea" && (
            <div className="space-y-4">
              {/* AI info banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 flex items-start gap-2">
                <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share <strong className="text-foreground">any tech idea</strong> — architecture opinions, lessons learned, AI insights, hot takes, questions, or project updates.
                  Our AI checks for tech relevance. Most posts from builders get through.
                </p>
              </div>

              {/* ── Result: Published ── */}
              {thoughtResult?.kind === "published" && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-300">Published!</p>
                    <p className="text-xs text-muted-foreground">AI validated your post as tech-relevant.</p>
                  </div>
                </div>
              )}

              {/* ── Result: Needs context ── */}
              {thoughtResult?.kind === "needs_context" && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                    <p className="text-sm font-semibold text-yellow-300">Needs more context</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{thoughtResult.reason}</p>
                  <p className="text-xs text-muted-foreground">Add more technical detail to your post and try again.</p>
                  <Button
                    size="sm" variant="outline"
                    className="w-full mt-1"
                    onClick={() => setThoughtResult(null)}
                  >
                    Edit & Retry
                  </Button>
                </div>
              )}

              {/* ── Result: Blocked ── */}
              {thoughtResult?.kind === "blocked" && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm font-semibold text-red-300">AI rejected this post</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{thoughtResult.reason}</p>

                  {/* Appeal section */}
                  {!showAppealInput ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm" variant="outline"
                        className="flex-1"
                        onClick={() => setThoughtResult(null)}
                      >
                        Edit Post
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                        onClick={() => setShowAppealInput(true)}
                      >
                        <Flag className="w-3.5 h-3.5 mr-1.5" />
                        Request Manual Review
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Tell us why you think this should be published (optional):
                      </p>
                      <Textarea
                        placeholder="e.g. This is about distributed systems architecture..."
                        rows={2}
                        value={appealNote}
                        onChange={e => setAppealNote(e.target.value.substring(0, 300))}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          className="flex-1"
                          onClick={() => setShowAppealInput(false)}
                          disabled={isAppealing}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                          onClick={() => onAppeal((thoughtResult as any).thoughtId)}
                          disabled={isAppealing}
                        >
                          {isAppealing ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Submitting...</>
                          ) : (
                            "Submit Appeal"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Result: Appeal sent ── */}
              {thoughtResult?.kind === "appeal_sent" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-sm font-semibold text-amber-300">Appeal submitted</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Our moderators will manually review your post. We'll update you on the outcome.</p>
                  <Button size="sm" variant="outline" className="w-full mt-1" onClick={closeAndReset}>
                    Close
                  </Button>
                </div>
              )}

              {/* ── Idea textarea (hidden after result) ── */}
              {!thoughtResult && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Your idea or insight</Label>
                      <span className="text-xs text-muted-foreground font-mono">{ideaText.length}/500</span>
                    </div>
                    <Textarea
                      placeholder="e.g. Why I think monoliths are making a comeback, or what I learned building a distributed cache..."
                      rows={5}
                      value={ideaText}
                      onChange={e => setIdeaText(e.target.value.substring(0, 500))}
                      data-testid="composer-thought"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={closeAndReset}>
                      Cancel
                    </Button>
                    <Button
                      onClick={onSubmitIdea}
                      disabled={isSubmitting || !ideaText.trim()}
                      className="flex-1"
                      data-testid="composer-submit-thought"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Brain className="w-4 h-4 mr-2" /> Post Idea</>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── PROJECT MODE ── */}
          {mode === "project" && (
            <>
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 mb-1">
                <p className="text-xs text-muted-foreground mb-2 font-medium">AI will analyze your repo for:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: Cpu, label: "Architecture" },
                    { icon: Shield, label: "Security" },
                    { icon: Code2, label: "Code Quality" },
                    { icon: BookOpen, label: "Docs / DX" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm">
                    <Github className="w-3.5 h-3.5" /> Project URL
                    <span className="text-muted-foreground font-normal text-xs">(GitHub or any web link)</span>
                  </Label>
                  <Input
                    placeholder="https://github.com/username/repo or https://myapp.com"
                    {...register("githubUrl", {
                      required: "Project URL required",
                      pattern: { value: /^https?:\/\/.+/, message: "Must be a valid URL starting with https://" },
                    })}
                    data-testid="composer-github-url"
                  />
                  {errors.githubUrl && <p className="text-xs text-destructive">{errors.githubUrl.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Project Name</Label>
                  <Input
                    placeholder="My Awesome Project"
                    {...register("name", { required: "Project name required", maxLength: { value: 80, message: "Max 80 chars" } })}
                    data-testid="composer-name"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-2">
                    Description <span className="text-xs text-muted-foreground font-mono">{descLength}/500</span>
                  </Label>
                  <Textarea
                    placeholder="What does your project do? What problem does it solve?"
                    rows={3}
                    {...register("description", { required: "Description required", maxLength: { value: 500, message: "Max 500 chars" } })}
                    data-testid="composer-description"
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message as string}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tech Stack <span className="text-muted-foreground font-normal">(up to 3)</span></Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TAGS.map(tag => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className={cn(
                          "tag-pill px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
                          selectedTags.includes(tag) ? "bg-primary/10 border-primary/50 text-primary"
                          : selectedTags.length >= 3 ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                        )}>
                        {selectedTags.includes(tag) && "✓ "}{tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={closeAndReset}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1" data-testid="composer-submit">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Post Project</>}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
