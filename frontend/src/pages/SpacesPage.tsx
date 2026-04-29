import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const EMOJI_OPTIONS = ["🚀", "💡", "🔥", "⚡", "🛠️", "🤖", "🎯", "💎", "🧠", "🌐", "🔐", "📦"];

function SpaceCard({ space, onJoin, onLeave, isActing }: {
  space: any;
  onJoin: (id: number) => void;
  onLeave: (id: number) => void;
  isActing: boolean;
}) {
  return (
    <Link href={`/spaces/${space.id}`}>
      <div className="rounded-2xl border border-card-border bg-card card-elevated p-5 hover:border-primary/30 transition-all cursor-pointer group">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-2xl shrink-0">
            {space.emoji || "🚀"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm group-hover:text-primary transition-colors truncate">{space.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Users className="w-3 h-3" />
              <span>{space.memberCount} {space.memberCount === 1 ? "member" : "members"}</span>
              <span>·</span>
              <span>{space.postCount} posts</span>
            </div>
          </div>
        </div>

        {space.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {space.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">by {space.owner?.username}</span>
          <button
            onClick={e => {
              e.preventDefault();
              space.member ? onLeave(space.id) : onJoin(space.id);
            }}
            disabled={isActing || space.spaceOwner}
            className={cn(
              "text-xs px-3 py-1 rounded-full border font-medium transition-all",
              space.spaceOwner
                ? "border-border text-muted-foreground cursor-default"
                : space.member
                ? "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                : "border-primary/40 text-primary bg-primary/5 hover:bg-primary/10"
            )}
          >
            {space.spaceOwner ? "Owner" : space.member ? "Leave" : "Join"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default function SpacesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🚀");
  const [isCreating, setIsCreating] = useState(false);
  const [actingId, setActingId] = useState<number | null>(null);

  const { data: spaces = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/spaces"],
  });

  const handleCreate = async () => {
    if (!user) { toast({ title: "Sign in to create a space" }); return; }
    if (!name.trim()) { toast({ title: "Name is required" }); return; }
    setIsCreating(true);
    try {
      await apiRequest("POST", "/api/spaces", { name: name.trim(), description: description.trim(), emoji });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
      setShowCreate(false);
      setName(""); setDescription(""); setEmoji("🚀");
      toast({ title: "Space created!" });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setIsCreating(false);
  };

  const handleJoin = async (id: number) => {
    if (!user) { toast({ title: "Sign in to join" }); return; }
    setActingId(id);
    try {
      await apiRequest("POST", `/api/spaces/${id}/join`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
    } catch {
      toast({ title: "Failed to join space", variant: "destructive" });
    }
    setActingId(null);
  };

  const handleLeave = async (id: number) => {
    if (!user) return;
    setActingId(id);
    try {
      await apiRequest("POST", `/api/spaces/${id}/leave`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/spaces"] });
    } catch {
      toast({ title: "Failed to leave space", variant: "destructive" });
    }
    setActingId(null);
  };

  const mySpaces = spaces.filter((s: any) => s.member || s.spaceOwner);
  const discoverSpaces = spaces.filter((s: any) => !s.member && !s.spaceOwner);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Spaces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Communities built around technologies, ideas, and teams.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => { if (!user) { toast({ title: "Sign in to create a space" }); return; } setShowCreate(v => !v); }}
          className="flex items-center gap-1.5"
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? "Cancel" : "Create Space"}
        </Button>
      </div>

      {/* Create Space form */}
      {showCreate && (
        <div className="rounded-2xl border border-primary/20 bg-card card-elevated p-5 mb-6">
          <h2 className="font-semibold text-sm mb-4">Create a new space</h2>
          <div className="space-y-4">
            {/* Emoji picker */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "w-9 h-9 rounded-xl border text-xl transition-all",
                      emoji === e ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/30"
                    )}
                  >{e}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value.slice(0, 60))}
                placeholder="e.g. React Builders, AI/ML Ops, Security Research"
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 300))}
                placeholder="What's this space about?"
                rows={2}
                className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">{description.length}/300</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={isCreating || !name.trim()} size="sm">
                {isCreating ? "Creating…" : "Create Space"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-card-border bg-card p-5">
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <div className="text-5xl mb-4">🚀</div>
          <p className="font-semibold">No spaces yet</p>
          <p className="text-sm mt-1">Be the first to create a community space.</p>
        </div>
      ) : (
        <>
          {mySpaces.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Your Spaces</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mySpaces.map((s: any) => (
                  <SpaceCard key={s.id} space={s} onJoin={handleJoin} onLeave={handleLeave} isActing={actingId === s.id} />
                ))}
              </div>
            </div>
          )}

          {discoverSpaces.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {mySpaces.length > 0 ? "Discover More" : "All Spaces"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {discoverSpaces.map((s: any) => (
                  <SpaceCard key={s.id} space={s} onJoin={handleJoin} onLeave={handleLeave} isActing={actingId === s.id} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
