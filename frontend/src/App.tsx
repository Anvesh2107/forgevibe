import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import SubmitPage from "@/pages/SubmitPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ThoughtsPage from "@/pages/ThoughtsPage";
import UserProfilePage from "@/pages/UserProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminPage from "@/pages/AdminPage";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router hook={useHashLocation}>
          <Layout>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/new" component={HomePage} />
              <Route path="/leaderboard" component={() => <HomePage defaultSection="leaderboard" />} />
              <Route path="/submit" component={SubmitPage} />
              <Route path="/projects/:id" component={ProjectDetailPage} />
              <Route path="/thoughts" component={ThoughtsPage} />
              <Route path="/users/:username" component={UserProfilePage} />
              <Route path="/notifications" component={NotificationsPage} />
              <Route path="/admin" component={AdminPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </Layout>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
