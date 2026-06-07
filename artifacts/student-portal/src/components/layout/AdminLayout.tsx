import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LogOut, GraduationCap, LayoutDashboard, FileUp, Users, FileText, History } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logout = useLogout();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      setLocation("/admin");
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

  if (!user || user.role !== "admin") {
    return null;
  }

  const navItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/upload", icon: FileUp, label: "Upload Results" },
    { href: "/admin/uploads", icon: History, label: "Uploaded PDFs" },
    { href: "/admin/students", icon: Users, label: "Students" },
    { href: "/admin/results", icon: FileText, label: "All Results" },
  ];

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
                RGUKT
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm opacity-90 hidden sm:block">Admin: {user.name}</span>
              <Button variant="secondary" size="sm" onClick={handleLogout} className="gap-2 text-primary">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = location === href || (href !== "/admin/dashboard" && location.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
