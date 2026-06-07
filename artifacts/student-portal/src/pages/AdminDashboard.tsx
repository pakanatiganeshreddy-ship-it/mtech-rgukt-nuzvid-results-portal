import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UploadCloud } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: {
      queryKey: getGetAdminStatsQueryKey()
    }
  });

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
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Results Records</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalResults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Uploads</CardTitle>
            <UploadCloud className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUploads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUploads.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No recent uploads</p>
            ) : (
              <div className="space-y-4">
                {stats.recentUploads.map((upload) => (
                  <div key={upload.id} className="flex flex-col sm:flex-row justify-between border-b pb-4 last:border-0 last:pb-0 gap-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{upload.filename}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(upload.uploadedAt), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                    <div className="text-sm flex gap-4 text-gray-600 sm:text-right">
                      <div>
                        <span className="block font-medium">{upload.recordsInserted}</span>
                        <span className="text-xs">Results</span>
                      </div>
                      <div>
                        <span className="block font-medium">{upload.studentsCreated}</span>
                        <span className="text-xs">Students</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branches</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.branches.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No branches found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.branches.map((branch) => (
                  <div key={branch} className="px-3 py-1.5 bg-gray-100 text-gray-800 text-sm rounded-md border border-gray-200">
                    {branch}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
