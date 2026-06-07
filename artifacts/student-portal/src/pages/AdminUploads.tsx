import { useState } from "react";
import { useListUploads, getListUploadsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, UploadCloud, Trash2 } from "lucide-react";
import { Link } from "wouter";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminUploads() {
  const queryClient = useQueryClient();
  const { data: uploads, isLoading } = useListUploads({
    query: { queryKey: getListUploadsQueryKey() },
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; filename: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch(`/api/admin/uploads/${deleteTarget.id}`, { method: "DELETE" });
      await queryClient.invalidateQueries({ queryKey: getListUploadsQueryKey() });
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Uploaded PDFs</h1>
          <p className="text-gray-500 mt-1">History of all result PDFs uploaded by admins.</p>
        </div>
        <Link href="/admin/upload">
          <Button className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Upload New PDF
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="border-b bg-gray-50/50 py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Upload History
          </CardTitle>
          <CardDescription>
            {uploads ? `${uploads.length} file${uploads.length !== 1 ? "s" : ""} uploaded` : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !uploads || uploads.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <FileText className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No PDFs uploaded yet</p>
              <p className="text-sm mt-1">Upload a result PDF to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded At</TableHead>
                    <TableHead className="text-center">Extracted</TableHead>
                    <TableHead className="text-center">Inserted</TableHead>
                    <TableHead className="text-center">New Students</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload, idx) => (
                    <TableRow key={upload.id}>
                      <TableCell className="text-gray-500 text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="font-medium text-sm break-all">{upload.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {formatDate(upload.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{upload.recordsExtracted}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          {upload.recordsInserted}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                          {upload.studentsCreated}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={() => setDeleteTarget({ id: upload.id, filename: upload.filename })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upload Record</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the upload record for <strong>{deleteTarget?.filename}</strong> from history.
              The student results that were inserted from this PDF will <strong>not</strong> be deleted — only the upload log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
