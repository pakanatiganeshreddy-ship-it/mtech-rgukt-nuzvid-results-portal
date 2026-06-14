import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, ArrowLeft, Clock, CheckCircle } from "lucide-react";
import campusBg from "@assets/RGUKTN_1780635783963.jpg";

function formatTime(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

export default function StudentForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"enterid" | "waiting" | "ready" | "done">("enterid");
  const [studentId, setStudentId] = useState("");
  const [readyAt, setReadyAt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (readyAt) {
      const update = () => {
        const diff = new Date(readyAt).getTime() - Date.now();
        if (diff <= 0) {
          setTimeLeft(0);
          setStep("ready");
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setTimeLeft(diff);
        }
      };
      update();
      timerRef.current = setInterval(update, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [readyAt]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/student/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setReadyAt(data.readyAt);
      setStep("waiting");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/student/reset-status/${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      if (data.status === "done") {
        setNewPassword(data.newPassword);
        setStep("done");
      } else if (data.status === "waiting") {
        setReadyAt(data.readyAt);
        setStep("waiting");
        setError("Not ready yet. Please wait for the timer to finish.");
      } else {
        setError("No reset request found. Please start over.");
        setStep("enterid");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative"
      style={{
        backgroundImage: `url(${campusBg})`,
        backgroundSize: "cover",
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
            Forgot Password
          </h1>
          <p className="text-sm text-blue-200 font-medium text-center">
            Rajiv Gandhi University of Knowledge Technologies
          </p>
        </div>

        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="border-b bg-gray-50/80 pb-5">
            <CardTitle className="text-xl text-center text-gray-900">Password Reset</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Your password resets to <span className="font-semibold text-gray-800">123456</span> after 1 hour wait
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">

            {step === "enterid" && (
              <form onSubmit={handleRequest} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="sid">Your Student ID</Label>
                  <Input
                    id="sid"
                    placeholder="e.g. NM2403CP01"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enter your Student ID to start a 1-hour timer. After it ends, your password resets to <strong>123456</strong>.
                </p>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Submitting..." : "Start Reset Timer"}
                </Button>
              </form>
            )}

            {step === "waiting" && (
              <div className="space-y-5 text-center">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center border-2 border-amber-200">
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Time remaining</p>
                  <div className="text-5xl font-bold text-gray-900 tabular-nums tracking-widest">
                    {formatTime(timeLeft)}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Come back when the timer hits <strong>00:00</strong> and click the button below.
                </p>
                <Button
                  className="w-full h-11"
                  onClick={handleCheckStatus}
                  disabled={loading || timeLeft > 0}
                >
                  {loading ? "Checking..." : timeLeft > 0 ? `Wait ${formatTime(timeLeft)}` : "Claim My Reset"}
                </Button>
              </div>
            )}

            {step === "ready" && (
              <div className="space-y-4 text-center">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-200">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <p className="text-sm text-gray-600">Your 1 hour is up! Click below to complete the reset.</p>
                <Button className="w-full h-11" onClick={handleCheckStatus} disabled={loading}>
                  {loading ? "Resetting..." : "Reset My Password Now"}
                </Button>
              </div>
            )}

            {step === "done" && (
              <div className="text-center space-y-4 py-2">
                <div className="flex justify-center">
                  <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                </div>
                <p className="font-semibold text-gray-900">Password reset successfully!</p>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 font-medium mb-1">Your new password is:</p>
                  <p className="text-3xl font-bold text-green-800 tracking-widest">{newPassword}</p>
                </div>
                <p className="text-xs text-gray-500">Please change this password after logging in.</p>
                <Button className="w-full" onClick={() => setLocation("/")}>
                  Go to Login
                </Button>
              </div>
            )}

            {step !== "done" && (
              <Button
                type="button"
                variant="ghost"
                className="w-full mt-3 gap-2 text-gray-500 hover:text-gray-700"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
