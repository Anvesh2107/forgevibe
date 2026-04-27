import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">⚡</div>
      <h1 className="text-xl font-bold mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-muted-foreground mb-6">This page doesn't exist in the ForgeVibe leaderboard</p>
      <Link href="/">
        <Button className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
