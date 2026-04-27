import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface DiamondButtonProps {
  project: any;
  onSuccess?: (updated: any) => void;
  /** When true, renders a full-width feed-style button (label + icon) instead of the compact counter */
  feedMode?: boolean;
}

export default function DiamondButton({ project, onSuccess, feedMode = false }: DiamondButtonProps) {
  const { user, hasDiamondThisWeek } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isGiving, setIsGiving] = useState(false);

  const isOwnProject = user?.id === project.userId || user?.id === project.author?.id || user?.id === project.user?.id;
  const hasDiamondForThis = project.hasDiamond === true;

  // Toggle: call the endpoint (it adds or removes)
  const callToggle = async (noteText?: string) => {
    setIsGiving(true);
    try {
      const res = await apiRequest("POST", `/api/projects/${project.id}/diamond`, { note: noteText ?? "" });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "Failed", variant: "destructive" });
        setIsGiving(false);
        return;
      }
      const data = await res.json();
      if (hasDiamondForThis) {
        toast({ title: "💎 Diamond removed" });
      } else {
        toast({
          title: `💎 Diamond given to ${project.name || project.title}!`,
          description: hasDiamondThisWeek ? "" : "You won't get another until Monday.",
        });
      }
      onSuccess?.(data);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsGiving(false);
  };

  const handleClick = () => {
    if (!user) { toast({ title: "Sign in to give diamonds" }); return; }
    if (isOwnProject) { toast({ title: "Can't diamond your own project" }); return; }
    if (hasDiamondForThis) {
      // Remove without dialog
      callToggle();
      return;
    }
    if (hasDiamondThisWeek) {
      toast({ title: "💎 Come back Monday for your next diamond", description: "You get 1 diamond per week — choose wisely." });
      return;
    }
    setIsOpen(true);
  };

  const handleGive = async () => {
    setIsOpen(false);
    await callToggle(note);
    setNote("");
  };

  const count = project.diamondCount ?? project.diamonds ?? 0;
  const isDiamondActive = hasDiamondForThis;

  // ── Feed Mode: full-width button matching Like / Comment / View style ──
  if (feedMode) {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isGiving}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-muted/50",
            isDiamondActive
              ? "text-cyan-300 diamond-pulse"
              : "text-muted-foreground hover:text-[#B9F2FF]"
          )}
          data-testid={`button-diamond-${project.id}`}
        >
          <span className={cn("text-base leading-none", isDiamondActive && "diamond-give-anim")}>
            {isDiamondActive ? "💎" : "♦"}
          </span>
          {isDiamondActive ? "Diamonded" : "Diamond"}
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">💎</span>
                Give Diamond
              </DialogTitle>
              <DialogDescription>
                You have <strong>1 diamond per week</strong>. You can take it back any time.
                This will count as your diamond for the week.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="text-sm font-medium mb-1">Give to: <span className="text-primary">{project.name || project.title}</span></div>
              <Input
                placeholder="Optional note (50 chars max)..."
                value={note}
                onChange={e => setNote(e.target.value.substring(0, 50))}
                className="text-sm"
                data-testid="input-diamond-note"
              />
              {note.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1 text-right font-mono">{note.length}/50</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button
                onClick={handleGive}
                disabled={isGiving}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid="button-confirm-diamond"
              >
                {isGiving ? "Giving..." : "💎 Give Diamond"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ── Compact Mode: small inline counter ──
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              disabled={isGiving}
              className={cn(
                "flex items-center gap-1 text-xs font-mono transition-all duration-200",
                isDiamondActive
                  ? "text-cyan-300 diamond-pulse"
                  : count > 0
                  ? "text-[#B9F2FF]"
                  : "text-muted-foreground hover:text-[#B9F2FF]"
              )}
              data-testid={`button-diamond-${project.id}`}
            >
              <span className={cn("text-base leading-none", isDiamondActive && "diamond-give-anim")}>
                {isDiamondActive ? "💎" : "♦"}
              </span>
              ×{count}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isOwnProject
              ? "Cannot diamond your own project"
              : hasDiamondForThis
              ? "Click to remove your 💎"
              : hasDiamondThisWeek
              ? "Come back Monday for your next diamond"
              : !user
              ? "Sign in to give diamonds"
              : `Give your weekly 💎 to ${project.name || project.title}`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              Give Diamond
            </DialogTitle>
            <DialogDescription>
              You have <strong>1 diamond per week</strong>. You can take it back any time.
              This will count as your diamond for the week.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="text-sm font-medium mb-1">Give to: <span className="text-primary">{project.name || project.title}</span></div>
            <Input
              placeholder="Optional note (50 chars max)..."
              value={note}
              onChange={e => setNote(e.target.value.substring(0, 50))}
              className="text-sm"
              data-testid="input-diamond-note"
            />
            {note.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 text-right font-mono">{note.length}/50</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button
              onClick={handleGive}
              disabled={isGiving}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              data-testid="button-confirm-diamond"
            >
              {isGiving ? "Giving..." : "💎 Give Diamond"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
