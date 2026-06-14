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

  const sortedUploads = [...uploads].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  const newest = sortedUploads[0];
  const older = sortedUploads.slice(1);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/RGUKTN_1781280367364.jpg')" }}
    >
      <style>{`
        @keyframes marquee-rtl {
          0%   { transform: translateX(110%); }
          100% { transform: translateX(-110%); }
        }
        .marquee-rtl {
          display: inline-block;
          animation: marquee-rtl 12s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      <div className="absolute inset-0 bg-black/55" />

      {/* LEFT-SIDE RESULTS PANEL — wider (w-96 ≈ 10 cm) and shifted down */}
      {sortedUploads.length > 0 && (
        <div className="absolute left-4 top-[62%] -translate-y-1/2 z-10 w-96 flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center gap-2 mb-0.5">
            <Bell className="h-4 w-4 text-yellow-400 flex-shrink-0" />
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Results Available
            </p>
          </div>

          {/* Newest — scrolling ticker */}
          <div className="rounded-lg border border-yellow-400/50 bg-black/55 backdrop-blur-md px-3 py-2.5 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full leading-none flex-shrink-0">
                NEW
              </span>
              <span className="text-[10px] text-yellow-300 flex-shrink-0">
                {timeAgo(newest.uploadedAt)}
              </span>
            </div>
            <div className="overflow-hidden w-full">
              <span className="marquee-rtl text-sm text-white font-semibold">
                {formatUploadName(newest.filename)}
              </span>
            </div>
          </div>

          {/* Older results — static */}
          {older.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-white/15 bg-black/45 backdrop-blur-md px-3 py-2.5"
            >
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-200 leading-snug">
                  {formatUploadName(u.filename)}
                </p>
              </div>
              <p className="text-[10px] text-gray-500 mt-1 ml-5">{timeAgo(u.uploadedAt)}</p>
            </div>
          ))}
        </div>
      )}

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

      {/* CENTER LOGIN CARD */}
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
