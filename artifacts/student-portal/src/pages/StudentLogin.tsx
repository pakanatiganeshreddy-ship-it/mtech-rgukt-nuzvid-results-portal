import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useStudentLogin, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{
  background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">

        <div className="flex flex-col items-center gap-3">
          <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight text-center drop-shadow-lg">
            RGUKT M.Tech Results
          </h1>
          <p className="text-sm text-blue-200 font-medium text-center">
            Rajiv Gandhi University of Knowledge Technologies
          </p>
        </div>

        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="border-b bg-gray-50/80 pb-5">
            <CardTitle className="text-xl text-center text-gray-900">Student Sign In</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Default password for all students: <span className="font-semibold text-gray-800">123456</span>
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
                      <FormLabel className="text-gray-700 font-medium">Student ID</FormLabel>
                      <FormControl>
                        <Input data-testid="input-student-id" placeholder="e.g. NM2403CP01" {...field} className="h-11" />
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
                      <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                      <FormControl>
                        <Input data-testid="input-password" type="password" placeholder="••••••••" {...field} className="h-11" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  data-testid="button-signin"
                  type="submit"
                  className="w-full h-11 text-base font-medium"
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
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-lg px-5 py-3 text-sm font-semibold backdrop-blur-sm transition-all w-full justify-center"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Login
          </button>
        </Link>

      </div>
    </div>
  );
}
