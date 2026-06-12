import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin, useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/password-input";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });

  const loginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (!isLoading && user && user.role === "admin") {
      setLocation("/admin/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setError(null);
    loginMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setLocation("/admin/dashboard");
      },
      onError: (err: any) => {
        setError(err?.error || "Login failed. Please check your credentials.");
      }
    });
  };

  if (isLoading) return null;

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/RGUKTN_1781280367364.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-900 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
          Portal Administration
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200 font-medium">
          Rajiv Gandhi University of Knowledge Technologies
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader className="space-y-1 border-b border-white/15 pb-6">
            <CardTitle className="text-xl text-center text-white">Admin Sign In</CardTitle>
            <CardDescription className="text-center text-blue-200">
              Restricted access only
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-100 font-medium">Username</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-username"
                          placeholder="admin"
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
                  data-testid="button-admin-signin"
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-blue-700 hover:bg-blue-800 text-white"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Authenticating..." : "Sign in to Admin"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white/80 border border-white/30 rounded-full hover:bg-white/15 hover:text-white transition-colors backdrop-blur-sm"
          >
            <User className="h-4 w-4" />
            Student Login
          </button>
        </div>
      </div>
    </div>
  );
}
