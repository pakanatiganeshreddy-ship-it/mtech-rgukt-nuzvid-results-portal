import { useState } from "react";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, FileText, UploadCloud, KeyRound, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
     const res = await fetch("/api/auth/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to change password");
      return json;
    },
    onSuccess: () => {
      setPasswordSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordError(null);
    },
    onError: (err: Error) => { setPasswordError(err.message); },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match"); return; }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPasswordError(null); setPasswordSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">

      {/* Change Admin Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Change Admin Password</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {passwordSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-600 text-lg font-medium mb-2">Password changed successfully!</div>
                <p className="text-gray-500 text-sm mb-4">Your new admin password is active immediately.</p>
                <Button onClick={closeModal} className="w-full">Close</Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{passwordError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <Input type="password" placeholder="Enter current admin password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <Input type="password" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <Input type="password" placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-10" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={changePasswordMutation.isPending}>Cancel</Button>
                  <Button type="submit" className="flex-1" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Saving..." : "Change Password"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowPasswordModal(true)}>
          <KeyRound className="h-4 w-4" />
          Change Password
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Results Records</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats.totalResults}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Uploads</CardTitle>
            <UploadCloud className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-3xl font-bold text-gray-900">{stats.totalUploads}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Uploads</CardTitle></CardHeader>
          <CardContent>
            {stats.recentUploads.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No recent uploads</p>
            ) : (
              <div className="space-y-4">
                {stats.recentUploads.map((upload) => (
                  <div key={upload.id} className="flex flex-col sm:flex-row justify-between border-b pb-4 last:border-0 last:pb-0 gap-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{upload.filename}</p>
                      <p className="text-xs text-gray-500">{format(new Date(upload.uploadedAt), "MMM d, yyyy h:mm a")}</p>
                    </div>
                    <div className="text-sm flex gap-4 text-gray-600 sm:text-right">
                      <div><span className="block font-medium">{upload.recordsInserted}</span><span className="text-xs">Results</span></div>
                      <div><span className="block font-medium">{upload.studentsCreated}</span><span className="text-xs">Students</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Branches</CardTitle></CardHeader>
          <CardContent>
            {stats.branches.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No branches found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.branches.map((branch) => (
                  <div key={branch} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md border border-gray-200">{branch}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
