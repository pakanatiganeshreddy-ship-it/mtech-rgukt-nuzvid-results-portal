import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      setStatus("error");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      setStatus("error");
      return;
    }
    if (!token) {
      setErrorMsg("Invalid reset link. Please request a new one.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
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
          Set New Password
        </h2>
        <p className="mt-2 text-center text-sm text-blue-200 font-medium">
          Rajiv Gandhi University of Knowledge Technologies-Nuzvid
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md">
          <CardHeader className="space-y-1 border-b border-white/15 pb-6">
            <CardTitle className="text-xl text-center text-white">Create New Password</CardTitle>
            <CardDescription className="text-center text-blue-200">
              Enter and confirm your new admin password
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {status === "success" ? (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                  <div className="h-14 w-14 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-green-400" />
                  </div>
                </div>
                <p className="text-white font-medium">Password updated successfully!</p>
                <p className="text-sm text-blue-200">You can now sign in with your new password.</p>
                <Button
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white mt-2"
                  onClick={() => setLocation("/admin")}
                >
                  Go to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                {!token && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Invalid or missing reset token. Please request a new reset link.
                    </AlertDescription>
                  </Alert>
                )}
                {status === "error" && errorMsg && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMsg}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="newpwd" className="text-blue-100 font-medium">New Password</Label>
                  <PasswordInput
                    id="newpwd"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 bg-white/90 text-gray-800 placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmpwd" className="text-blue-100 font-medium">Confirm New Password</Label>
                  <PasswordInput
                    id="confirmpwd"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 bg-white/90 text-gray-800 placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium bg-blue-700 hover:bg-blue-800 text-white"
                  disabled={status === "loading" || !token}
                >
                  {status === "loading" ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2 text-blue-200 hover:text-white hover:bg-white/10"
                  onClick={() => setLocation("/admin")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
