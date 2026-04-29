import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  username: string;
  avatarUrl: string;
  bio?: string;
  reputationPoints: number;
  forgeScore: number;
  verified: boolean;
  publicRepoCount: number;
  followerCount: number;
  diamonds: number;
  stars: number;
  totalLikes: number;
}

interface AuthContextType {
  user: AuthUser | null;
  hasDiamondThisWeek: boolean;
  isLoading: boolean;
  loginWithGitHub: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  hasDiamondThisWeek: false,
  isLoading: true,
  loginWithGitHub: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: authData, isLoading, refetch } = useQuery<{ user: AuthUser; hasDiamondThisWeek: boolean }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const loginWithGitHub = () => {
    window.location.href = "/oauth2/authorization/github";
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout", {});
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.invalidateQueries();
  };

  return (
    <AuthContext.Provider value={{
      user: authData?.user ?? null,
      hasDiamondThisWeek: authData?.hasDiamondThisWeek ?? false,
      isLoading,
      loginWithGitHub,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
