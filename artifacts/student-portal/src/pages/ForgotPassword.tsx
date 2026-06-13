import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSend = async () => {
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

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
          Reset Admin Password
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200 font-medium">
          Rajiv Gandhi University of Knowledge Technologies-Nuzvid
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader className="space-y-1 border-b border-white/15 pb-6">
            <CardTitle className="text-xl text-center text-white">Forgot Password</CardTitle>
            <CardDescription className="text-center text-blue-200">
              A reset link will be sent to the registered admin email
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {status === "success" ? (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="h-14 w-14 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Mail className="h-7 w-7 text-green-400" />
                  </div>
                </div>
                <p className="text-white font-medium">Reset link sent!</p>
                <p className="text-sm text-blue-200">
                  Check the admin email inbox. The link expires in 30 minutes.
                </p>
                <Button
                  variant="outline"
                  className="w-full mt-2 border-white/30 text-white hover:bg-white/15"
                  onClick={() => setLocation("/admin")}
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                {status === "error" && errorMsg && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-blue-200 text-center">
                  Click the button below to receive a password reset link at the registered admin email address.
                </p>
                <Button
                  className="w-full h-11 text-base font-medium bg-blue-700 hover:bg-blue-800 text-white"
                  onClick={handleSend}
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-blue-200 hover:text-white hover:bg-white/10"
                  onClick={() => setLocation("/admin")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
