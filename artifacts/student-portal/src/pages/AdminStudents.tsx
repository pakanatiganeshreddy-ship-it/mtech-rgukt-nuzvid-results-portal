import { useState } from "react";
import { useLocation } from "wouter";
import { useListStudents, getListStudentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminStudents() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: students, isLoading } = useListStudents(
    { search: debouncedSearch || undefined },
    { query: { queryKey: getListStudentsQueryKey({ search: debouncedSearch || undefined }) } }
  );

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: "", name: "", branch: "", batch: "", password: "" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ studentId: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [resetTarget, setResetTarget] = useState<{ studentId: string; name: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListStudentsQueryKey() });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: addForm.studentId.trim().toUpperCase(),
          name: addForm.name.trim(),
          branch: addForm.branch.trim().toUpperCase(),
          batch: addForm.batch.trim(),
          password: addForm.password.trim() || "123456",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add student");
      await invalidate();
      setAddOpen(false);
      setAddForm({ studentId: "", name: "", branch: "", batch: "", password: "" });
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/students/${deleteTarget.studentId}`, { method: "DELETE" });
      await invalidate();
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetSuccess(false);
    try {
      const res = await fetch(`/api/students/${resetTarget.studentId}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Reset failed");
      setResetSuccess(true);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
        <Button className="gap-2" onClick={() => { setAddOpen(true); setAddError(null); }}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by ID or Name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !students || students.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No students found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell
                        className="font-medium text-primary cursor-pointer hover:underline"
                        onClick={() => setLocation(`/admin/students/${student.studentId}`)}
                      >
                        {student.studentId}
                      </TableCell>
                      <TableCell className="cursor-pointer" onClick={() => setLocation(`/admin/students/${student.studentId}`)}>
                        {student.name}
                      </TableCell>
                      <TableCell>{student.branch}</TableCell>
                      <TableCell>{student.batch}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8 p-0"
                            title="Reset password to 123456"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetTarget({ studentId: student.studentId, name: student.name });
                              setResetSuccess(false);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ studentId: student.studentId, name: student.name });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sid">Student ID *</Label>
              <Input id="sid" placeholder="e.g. NM2403CP01" value={addForm.studentId} onChange={(e) => setAddForm((f) => ({ ...f, studentId: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sname">Full Name *</Label>
              <Input id="sname" placeholder="e.g. Ravi Kumar" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sbranch">Branch *</Label>
                <Input id="sbranch" placeholder="e.g. CP" value={addForm.branch} onChange={(e) => setAddForm((f) => ({ ...f, branch: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sbatch">Batch</Label>
                <Input id="sbatch" placeholder="e.g. 2024-26" value={addForm.batch} onChange={(e) => setAddForm((f) => ({ ...f, batch: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spwd">Password <span className="text-gray-400 text-xs">(default: 123456)</span></Label>
              <Input id="spwd" placeholder="Leave blank for 123456" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? "Adding..." : "Add Student"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setResetSuccess(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Student Password</AlertDialogTitle>
            <AlertDialogDescription>
              {resetSuccess
                ? `Password for ${resetTarget?.name} (${resetTarget?.studentId}) has been reset to 123456.`
                : `This will reset the password for ${resetTarget?.name} (${resetTarget?.studentId}) back to the default: 123456.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {resetSuccess ? (
              <AlertDialogAction onClick={() => { setResetTarget(null); setResetSuccess(false); }}>Done</AlertDialogAction>
            ) : (
              <>
                <AlertDialogCancel disabled={resetLoading}>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-amber-600 hover:bg-amber-700" onClick={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? "Resetting..." : "Reset to 123456"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name} ({deleteTarget?.studentId})</strong> and all their result records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
