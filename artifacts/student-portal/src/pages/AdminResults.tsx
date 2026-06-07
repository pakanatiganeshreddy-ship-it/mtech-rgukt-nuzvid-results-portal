import { useState } from "react";
import { useListResults, getListResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminResults() {
  const [studentId, setStudentId] = useState("");
  const [semesterStr, setSemesterStr] = useState("");
  
  const debouncedStudentId = useDebounce(studentId, 300);
  const debouncedSemester = useDebounce(semesterStr, 300);

  const semester = debouncedSemester ? parseInt(debouncedSemester, 10) : undefined;
  
  const params = {
    studentId: debouncedStudentId || undefined,
    semester: isNaN(semester as number) ? undefined : semester
  };

  const { data: results, isLoading } = useListResults(
    params,
    { query: { queryKey: getListResultsQueryKey(params) } }
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Results</h1>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.studentId}</TableCell>
                      <TableCell>Semester {result.semester}</TableCell>
                      <TableCell className="text-gray-600">{result.subjectCode}</TableCell>
                      <TableCell>{result.subjectName}</TableCell>
                      <TableCell className="text-center">{result.credits}</TableCell>
                      <TableCell className="text-center font-semibold">{result.grade}</TableCell>
                      <TableCell className="text-center">{result.gradePoint}</TableCell>
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
