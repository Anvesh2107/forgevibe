import { useState } from "react";
import { Check, Copy, Twitter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShareCardModalProps {
  project: any;
  onClose: () => void;
}

function ScorePill({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("text-xl font-bold font-mono", color)}>{Math.round(score)}</div>
      <div className="text-[10px] text-white/50 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function ShareCardModal({ project, onClose }: ShareCardModalProps) {
  const [copied, setCopied] = useState(false);
  const analysis = project.analysis;
  const projectUrl = `https://forgevibeapp.com/projects/${project.id}`;

  const tweetText = `🔍 Just analyzed ${project.name} on @ForgeVibeApp\n\nForgeVibe Score: ${Math.round(project.forgevibeScore || 0)}\nAI Score: ${Math.round(project.aiScore || 0)}/100\n\n${analysis?.vibeCheck || ""}\n\n${projectUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(projectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>

        {/* The shareable card */}
        <div
          id="share-card"
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f1117 0%, #131720 50%, #0a0f1a 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #1d4ed8, #06B6D4, #7c3aed)" }} />

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">ForgeVibe Analysis</p>
                <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
                <p className="text-xs text-white/50 mt-0.5">by {project.user?.username}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-3xl font-bold font-mono" style={{ color: "#06B6D4" }}>
                  {Math.round(project.forgevibeScore || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide">ForgeVibe Score</div>
              </div>
            </div>

            {/* Score grid */}
            {analysis && (
              <div className="grid grid-cols-4 gap-2 py-4 border-y border-white/8">
                <ScorePill label="Architecture" score={analysis.architectureScore || 0} color="text-blue-400" />
                <ScorePill label="Security" score={analysis.securityScore || 0} color="text-green-400" />
                <ScorePill label="Quality" score={analysis.qualityScore || 0} color="text-yellow-400" />
                <ScorePill label="Docs" score={analysis.docsScore || 0} color="text-purple-400" />
              </div>
            )}

            {/* Vibe check */}
            {analysis?.vibeCheck && (
              <p className="text-sm text-white/70 italic leading-relaxed">
                "{analysis.vibeCheck}"
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-white/30">Powered by Perplexity AI</span>
              <span className="text-xs font-semibold" style={{ color: "#06B6D4" }}>forgevibeapp.com</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 gap-2"
            style={{ background: "#1d9bf0" }}
            onClick={() => window.open(twitterUrl, "_blank")}
          >
            <Twitter className="w-4 h-4" />
            Share on X
          </Button>
          <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
