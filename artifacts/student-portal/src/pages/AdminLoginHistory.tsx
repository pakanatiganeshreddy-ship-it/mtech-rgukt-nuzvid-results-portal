import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Monitor, Smartphone, Search, RefreshCw } from "lucide-react";

interface LoginRecord {
  id: number;
  studentId: string;
  studentName: string;
  branch: string;
  batch: string;
  ipAddress: string | null;
  deviceType: string;
  userAgent: string | null;
  loginAt: string;
}

interface LoginHistoryResponse {
  total: number;
  uniqueStudents: number;
  records: LoginRecord[];
}

function getDeviceIcon(deviceType: string) {
  if (deviceType === "Mobile") return <Smartphone className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: true,
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminLoginHistory() {
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery<LoginHistoryResponse>({
    queryKey: ["admin-login-history"],
    queryFn: async () => {
      const res = await fetch("/api/admin/login-history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch login history");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const filtered = (data?.records ?? []).filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      r.studentId.toLowerCase().includes(s) ||
      r.studentName.toLowerCase().includes(s) ||
      (r.branch ?? "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Student Login History</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Total Logins</div>
              <div className="text-2xl font-bold text-gray-900">{isLoading ? "—" : (data?.total ?? 0)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg"><Users className="h-5 w-5 text-green-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Unique Students</div>
              <div className="text-2xl font-bold text-gray-900">{isLoading ? "—" : (data?.uniqueStudents ?? 0)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardContent className="py-5 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-lg"><Clock className="h-5 w-5 text-purple-600" /></div>
            <div>
              <div className="text-sm text-gray-500">Last Login</div>
              <div className="text-base font-semibold text-gray-900">
                {isLoading || !data?.records.length ? "—" : timeAgo(data.records[0].loginAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-lg">Login Records</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, name or branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              {search ? "No records match your search." : "No login history yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[90px]">Branch</TableHead>
                    <TableHead className="w-[80px]">Batch</TableHead>
                    <TableHead className="w-[120px]">Device</TableHead>
                    <TableHead className="w-[130px]">IP Address</TableHead>
                    <TableHead className="w-[200px]">Login Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record, idx) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-gray-400 text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{record.studentName}</div>
                        <div className="text-xs text-gray-500 font-mono">{record.studentId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{record.branch || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{record.batch || "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                          {getDeviceIcon(record.deviceType)}
                          {record.deviceType}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-500">{record.ipAddress || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{formatDate(record.loginAt)}</div>
                        <div className="text-xs text-gray-400">{timeAgo(record.loginAt)}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
