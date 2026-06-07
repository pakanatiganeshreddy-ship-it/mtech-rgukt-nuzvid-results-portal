import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight hidden sm:block">
                RGUKT M.Tech Results Portal
              </span>
              <span className="text-lg font-bold tracking-tight sm:hidden">
                RGUKT Results
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm opacity-90 hidden sm:block">{user.name} ({user.id})</span>
              <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2 text-primary">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t py-6 text-center text-sm text-gray-500 mt-auto">
        <p>&copy; {new Date().getFullYear()} Rajiv Gandhi University of Knowledge Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
