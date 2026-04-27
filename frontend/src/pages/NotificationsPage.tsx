import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, MessageSquare, CheckCheck, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

const NOTIFICATION_ICONS: Record<string, any> = {
  liked: <Heart className="w-4 h-4 text-red-400" />,
  diamond: <span className="text-base">💎</span>,
  commented: <MessageSquare className="w-4 h-4 text-blue-400" />,
  analysis_complete: <Cpu className="w-4 h-4 text-green-400" />,
  post_approved: <span className="text-base">✅</span>,
  post_rejected: <span className="text-base">❌</span>,
  appeal: <span className="text-base">⚖️</span>,
};

function notificationText(n: any): { title: string; body: string; href?: string } {
  const p = (() => { try { return JSON.parse(n.payload || "{}"); } catch { return {}; } })();
  switch (n.type) {
    case "liked": return { title: "Someone liked your project", body: `@${p.fromUser} liked ${p.projectName}`, href: `/projects/${p.projectId}` };
    case "diamond": return { title: "💎 You received a diamond!", body: `@${p.fromUser} gave a diamond to ${p.projectName}${p.note ? ` — "${p.note}"` : ""}`, href: `/projects/${p.projectId}` };
    case "commented": return { title: "New comment on your project", body: `@${p.fromUser} commented on ${p.projectName}`, href: `/projects/${p.projectId}#comments` };
    case "analysis_complete": return { title: "AI analysis complete", body: `${p.projectName} has been analyzed by Perplexity Computer`, href: `/projects/${p.projectId}` };
    case "post_approved": return { title: "Your thought was published", body: "Your thought post passed AI validation" };
    case "post_rejected": return { title: "Your thought was blocked", body: "AI validation: not tech-relevant enough" };
    default: return { title: "Notification", body: n.type };
  }
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAll = async () => {
    await apiRequest("POST", "/api/notifications/read-all", {});
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  if (!user) return (
    <div className="text-center py-20 text-muted-foreground">Sign in to see notifications</div>
  );

  const unread = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} className="flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl border border-card-border bg-card">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const { title, body, href } = notificationText(n);
            const content = (
              <div className={cn(
                "flex gap-3 p-4 rounded-xl border transition-colors",
                n.read ? "border-card-border bg-card" : "border-primary/20 bg-primary/5"
              )} data-testid={`notification-${n.id}`}>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {NOTIFICATION_ICONS[n.type] || <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{title}</div>
                    {!n.read && <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
            return href ? (
              <Link key={n.id} href={href}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
