import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStudentLogin, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, Menu, X, User, Mail, FileText, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  password: z.string().min(1, "Password is required"),
});

interface UploadNotice {
  id: number;
  filename: string;
  uploadedAt: string;
}

function formatUploadName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadNotice[]>([]);
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });

  const loginMutation = useStudentLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { studentId: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && user && user.role === "student") {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  useEffect(() => {
    fetch("/api/admin/public-uploads")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setUploads(data); })
      .catch(() => {});
  }, []);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setError(null);
    loginMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.error || "Login failed. Please check your credentials.");
      },
    });
  };

  if (isLoading) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/RGUKTN_1781280367364.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/55" />

      {/* Hamburger button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm transition-all"
        aria-label="Menu"
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Info panel */}
      {menuOpen && (
        <div className="absolute top-14 right-4 z-50 w-72 rounded-xl border border-white/20 bg-black/70 backdrop-blur-md p-4 shadow-2xl">
          <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-3">Portal Info</p>
          <div className="flex items-start gap-3 py-2 border-b border-white/10">
            <div className="h-8 w-8 rounded-full bg-blue-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="h-4 w-4 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-blue-300">Admin</p>
              <p className="text-sm font-semibold text-white">Pakanati Ganesh (MTech)</p>
              <p className="text-xs text-blue-300">Department of ECE, RGUKT-NUZVID</p>
            </div>
          </div>
          <div className="flex items-start gap-3 py-2">
            <div className="h-8 w-8 rounded-full bg-blue-600/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Mail className="h-4 w-4 text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-blue-300">For any help, contact</p>
              <a
                href="mailto:pakanatiganeshreddy@gmail.com"
                className="text-sm text-blue-200 hover:text-white break-all transition-colors"
              >
                pakanatiganeshreddy@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5">

        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 bg-blue-700 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-center drop-shadow-lg">
            RGUKT M.Tech Results
          </h1>
          <p className="text-sm text-blue-200 font-medium text-center">
            Rajiv Gandhi University of Knowledge Technologies-Nuzvid
          </p>
        </div>

        {/* Results notice banner */}
        {uploads.length > 0 && (
          <div className="w-full rounded-xl border border-blue-400/30 bg-blue-900/40 backdrop-blur-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-blue-300 flex-shrink-0" />
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Results Available</p>
            </div>
            <div className="space-y-1.5">
              {uploads.map((u) => (
                <div key={u.id} className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{formatUploadName(u.filename)}</p>
                  </div>
                  <span className="text-xs text-blue-400 flex-shrink-0 whitespace-nowrap">{timeAgo(u.uploadedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Card className="w-full shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader className="border-b border-white/15 pb-5">
            <CardTitle className="text-xl text-center text-white">Student Sign In</CardTitle>
            <CardDescription className="text-center text-blue-200">
              Default password for all students:{" "}
              <span className="font-semibold text-white">123456</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-100 font-medium">Student ID</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-student-id"
                          placeholder="e.g. NM2403CP01"
                          {...field}
                          className="h-11 bg-white/90 text-gray-800 placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-blue-100 font-medium">Password</FormLabel>
                        <button
                          type="button"
                          onClick={() => setLocation("/forgot-password")}
                          className="text-xs text-blue-300 hover:text-white hover:underline font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <FormControl>
                        <PasswordInput
                          data-testid="input-password"
                          placeholder="••••••••"
                          {...field}
                          className="h-11 bg-white/90 text-gray-800 placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  data-testid="button-signin"
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-blue-700 hover:bg-blue-800"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Link href="/admin">
          <button
            data-testid="link-admin-login"
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-full px-5 py-3 text-sm font-semibold backdrop-blur-sm transition-all w-full justify-center"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Login
          </button>
        </Link>

      </div>
    </div>
  );
}
