import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Github, Cpu, Shield, Code2, BookOpen, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

const TAGS = ["Java", "Python", "JavaScript", "TypeScript", "React", "Spring Boot", "Node.js", "AI/ML", "DevOps", "Security", "Open Source", "Mobile", "Web3", "Data Engineering", "Infrastructure"];

export default function SubmitPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { githubUrl: "", name: "", description: "" },
  });

  const descLength = watch("description")?.length || 0;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 3 ? [...prev, tag] : prev
    );
  };

  const onSubmit = async (data: any) => {
    if (!user) { toast({ title: "Sign in to submit a project", variant: "destructive" }); return; }
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
      const project = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "🚀 Project submitted!",
        description: "AI analysis is running in the background. Results in ~30s.",
      });
      setLocation(`/projects/${project.id}`);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <span className="text-4xl block mb-4">🔐</span>
        <h2 className="text-xl font-bold mb-2">Sign in to submit</h2>
        <p className="text-sm text-muted-foreground mb-6">Connect with GitHub to submit your project and get AI analysis</p>
        <p className="text-sm text-muted-foreground">Use the <strong>Sign in</strong> button in the top right to continue</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Submit Your Project</h1>
        <p className="text-sm text-muted-foreground mt-1">
          ForgeVibe will AI-analyze your repo across 4 dimensions and surface it to the community
        </p>
      </div>

      {/* AI Analysis Preview */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Perplexity Computer will analyze your repo for:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Cpu, label: "Architecture", desc: "Modularity & scalability" },
              { icon: Shield, label: "Security", desc: "OWASP risks & CVEs" },
              { icon: Code2, label: "Code Quality", desc: "Complexity & test coverage" },
              { icon: BookOpen, label: "Docs / DX", desc: "README & onboarding" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* GitHub URL */}
        <div className="space-y-1.5">
          <Label htmlFor="githubUrl" className="flex items-center gap-1.5">
            <Github className="w-4 h-4" />
            GitHub Repository URL
          </Label>
          <Input
            id="githubUrl"
            placeholder="https://github.com/username/repo"
            {...register("githubUrl", {
              required: "GitHub URL required",
              pattern: { value: /^https:\/\/github\.com\/.+\/.+/, message: "Must be a valid GitHub URL" }
            })}
            data-testid="input-github-url"
          />
          {errors.githubUrl && <p className="text-xs text-destructive">{errors.githubUrl.message as string}</p>}
        </div>

        {/* Project Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            placeholder="My Awesome Project"
            {...register("name", { required: "Project name required", maxLength: { value: 80, message: "Max 80 chars" } })}
            data-testid="input-project-name"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message as string}</p>}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">
            Description
            <span className="ml-2 text-xs text-muted-foreground font-mono">{descLength}/500</span>
          </Label>
          <Textarea
            id="description"
            placeholder="What does your project do? What problem does it solve?"
            rows={4}
            {...register("description", {
              required: "Description required",
              maxLength: { value: 500, message: "Max 500 chars" }
            })}
            data-testid="input-description"
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message as string}</p>}
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label>
            Tech Stack Tags
            <span className="ml-2 text-xs text-muted-foreground">Choose up to 3</span>
          </Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  "tag-pill px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                  selectedTags.includes(tag)
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : selectedTags.length >= 3
                    ? "border-border text-muted-foreground opacity-50 cursor-not-allowed"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                )}
                data-testid={`tag-${tag}`}
              >
                {selectedTags.includes(tag) && <span className="mr-1">✓</span>}
                {tag}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">AI will also auto-suggest tags based on your repo</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
          data-testid="button-submit"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
          ) : (
            <><CheckCircle className="w-4 h-4 mr-2" /> Submit for Analysis</>
          )}
        </Button>
      </form>
    </div>
  );
}
