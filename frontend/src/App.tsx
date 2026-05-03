import { Component, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import SubmitPage from "@/pages/SubmitPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ThoughtsPage from "@/pages/ThoughtsPage";
import UserProfilePage from "@/pages/UserProfilePage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminPage from "@/pages/AdminPage";
import SpacesPage from "@/pages/SpacesPage";
import SpaceDetailPage from "@/pages/SpaceDetailPage";
import ContactPage from "@/pages/ContactPage";
import NotFoundPage from "@/pages/not-found";

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.error("[RouteErrorBoundary]", e); }
  render() {
    if (this.state.hasError) return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-2xl mb-2">⚡</p>
        <p className="font-semibold">Something went wrong on this page.</p>
        <button
          onClick={() => { this.setState({ hasError: false }); window.history.back(); }}
          className="mt-4 text-sm text-primary hover:underline"
        >Go back</button>
      </div>
    );
    return this.props.children;
  }
}

function Routes() {
  return (
    <RouteErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/new" component={HomePage} />
        <Route path="/leaderboard" component={() => <HomePage defaultSection="leaderboard" />} />
        <Route path="/submit" component={SubmitPage} />
        <Route path="/projects/:id" component={ProjectDetailPage} />
        <Route path="/thoughts" component={ThoughtsPage} />
        <Route path="/users/:username" component={UserProfilePage} />
        <Route path="/profile/:username" component={UserProfilePage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/spaces" component={SpacesPage} />
        <Route path="/spaces/:id" component={SpaceDetailPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/contact" component={ContactPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </RouteErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router hook={useHashLocation}>
            <Layout>
              <Routes />
            </Layout>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
