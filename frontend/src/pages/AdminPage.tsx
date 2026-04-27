import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle, XCircle, AlertTriangle, Flag } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/reports", { status: "pending" }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/reports?status=pending");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: allReports = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/reports"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/reports");
      return res.json();
    },
    enabled: !!user,
  });

  const handleDecide = async (id: number, status: "approved" | "rejected") => {
    await apiRequest("POST", `/api/admin/reports/${id}/decide`, { status });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    toast({ title: status === "approved" ? "Report approved — content removed" : "Report rejected" });
  };

  if (!user) return <div className="text-center py-20 text-muted-foreground">Sign in to access admin</div>;

  const pending = reports.length;
  const approved = allReports.filter((r: any) => r.status === "approved").length;
  const rejected = allReports.filter((r: any) => r.status === "rejected").length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Moderation Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Review community reports and manage content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", value: pending, icon: <Flag className="w-5 h-5 text-yellow-400" />, color: "text-yellow-400" },
          { label: "Approved", value: approved, icon: <CheckCircle className="w-5 h-5 text-green-400" />, color: "text-green-400" },
          { label: "Rejected", value: rejected, icon: <XCircle className="w-5 h-5 text-red-400" />, color: "text-red-400" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <div className={cn("text-2xl font-bold font-mono", color)}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5" /> Pending ({pending})
          </TabsTrigger>
          <TabsTrigger value="all">All Reports ({allReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-card-border bg-card p-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pending reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div key={r.id} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {r.contentType === "project" ? "📦 Project" : "💬 Thought Post"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">ID #{r.contentId}</span>
                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                          {format(new Date(r.createdAt), "MMM d HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={r.reporter?.avatarUrl} />
                          <AvatarFallback className="text-xs">{r.reporter?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">Reported by <strong>{r.reporter?.username}</strong></span>
                      </div>
                      <div className="text-sm font-medium mb-1">Reason: {r.reason}</div>
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => handleDecide(r.id, "approved")}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve (Remove Content)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleDecide(r.id, "rejected")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-2">
            {allReports.map((r: any) => (
              <div key={r.id} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-sm",
                r.status === "pending" ? "border-yellow-500/20" : r.status === "approved" ? "border-green-500/20" : "border-border"
              )}>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.reason}</span>
                  <span className="text-muted-foreground ml-2 text-xs">on {r.contentType} #{r.contentId}</span>
                </div>
                <Badge variant={r.status === "pending" ? "outline" : r.status === "approved" ? "secondary" : "outline"} className="text-xs capitalize shrink-0">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
