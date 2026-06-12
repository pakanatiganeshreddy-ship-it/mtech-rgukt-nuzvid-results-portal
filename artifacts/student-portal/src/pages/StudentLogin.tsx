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
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  password: z.string().min(1, "Password is required"),
});

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
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

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">

        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 bg-blue-700 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-center drop-shadow-lg">
            RGUKT M.Tech Results
          </h1>
          <p className="text-sm text-blue-200 font-medium text-center">
            Rajiv Gandhi University of Knowledge Technologies
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
                      <FormLabel className="text-blue-100 font-medium">Password</FormLabel>
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
