import { useState, useMemo } from "react";
import { useListResults, getListResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function computeSpecialization(subjectNames: string[]): string {
  if (subjectNames.length < 2) return "";
  const tokens = subjectNames.map(n => n.split(" "));
  const minLen = Math.min(...tokens.map(t => t.length));
  let prefixLen = 0;
  for (let i = 0; i < minLen; i++) {
    if (tokens.every(t => t[i] === tokens[0][i])) prefixLen = i + 1;
    else break;
  }
  if (prefixLen < 2) return "";
  return tokens[0].slice(0, prefixLen).join(" ");
}

function stripSpec(name: string, spec: string): string {
  if (!spec) return name;
  const prefix = spec + " ";
  return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

export default function AdminResults() {
  const [studentId, setStudentId] = useState("");
  const [semesterStr, setSemesterStr] = useState("");
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const debouncedStudentId = useDebounce(studentId, 300);
  const debouncedSemester = useDebounce(semesterStr, 300);
  const semester = debouncedSemester ? parseInt(debouncedSemester, 10) : undefined;
  const params = {
    studentId: debouncedStudentId || undefined,
    semester: isNaN(semester as number) ? undefined : semester,
  };

  const queryClient = useQueryClient();
  const { data: results, isLoading } = useListResults(params, {
    query: { queryKey: getListResultsQueryKey(params) },
  });

  // Compute specialization per student so multiple students work correctly
  const studentSpecializations = useMemo(() => {
    if (!results) return {} as Record<string, string>;
    const byStudent: Record<string, string[]> = {};
    results.forEach(r => {
      if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
      byStudent[r.studentId].push(r.subjectName);
    });
    const specs: Record<string, string> = {};
    Object.entries(byStudent).forEach(([sid, names]) => {
      specs[sid] = computeSpecialization(names);
    });
    return specs;
  }, [results]);

  const deleteOneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/results/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete result");
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/results/", { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete all results");
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Results</h1>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          disabled={deleteAllMutation.isPending || !results || results.length === 0}
          onClick={() => setShowDeleteAllDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete All Results
        </Button>
      </div>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Results?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>all {results?.length ?? 0} result records</strong> from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { setShowDeleteAllDialog(false); deleteAllMutation.mutate(); }}
            >
              Yes, Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Confirmation */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete This Result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this result record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteTargetId !== null) {
                  deleteOneMutation.mutate(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader className="bg-gray-50 border-b pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="search-student">Filter by Student ID</Label>
              <Input
                id="search-student"
                placeholder="e.g. M230001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 space-y-1">
              <Label htmlFor="search-semester">Filter by Semester</Label>
              <Input
                id="search-semester"
                type="number"
                min="1"
                placeholder="e.g. 1"
                value={semesterStr}
                onChange={(e) => setSemesterStr(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !results || results.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No results found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Subject Code</TableHead>
                    <TableHead>Subject Name</TableHead>
                    <TableHead className="text-center">Credits</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead className="text-center">Points</TableHead>
                    <TableHead className="text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.studentId}</TableCell>
                      <TableCell>Semester {result.semester}</TableCell>
                      <TableCell className="text-gray-600">{result.subjectCode}</TableCell>
                      <TableCell>{stripSpec(result.subjectName, studentSpecializations[result.studentId] || "")}</TableCell>
                      <TableCell className="text-center">{result.credits}</TableCell>
                      <TableCell className="text-center font-semibold">{result.grade}</TableCell>
                      <TableCell className="text-center">{result.gradePoint}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => setDeleteTargetId(result.id)}
                          disabled={deleteOneMutation.isPending}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                          title="Delete this result"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
