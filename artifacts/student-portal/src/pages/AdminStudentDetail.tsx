import { useRoute } from "wouter";
import { useGetStudent, useGetStudentResults, getGetStudentQueryKey, getGetStudentResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

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

export default function AdminStudentDetail() {
  const [, params] = useRoute("/admin/students/:id");
  const studentId = params?.id || "";

  const { data: student, isLoading: isStudentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) }
  });

  const { data: resultsSummary, isLoading: isResultsLoading } = useGetStudentResults(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentResultsQueryKey(studentId) }
  });

  if (isStudentLoading || isResultsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student || !resultsSummary) {
    return <div className="py-12 text-center text-gray-500">Student not found or error loading data.</div>;
  }

  const { semesters, cgpa } = resultsSummary;
  const allSubjectNames = semesters.flatMap(s => s.results.map(r => r.subjectName));
  const specialization = computeSpecialization(allSubjectNames);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>

      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="bg-white border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription className="text-base mt-1">Student ID: {student.studentId}</CardDescription>
            </div>
            <div className="bg-primary/5 px-6 py-3 rounded-lg border border-primary/10 text-center">
              <div className="text-sm text-primary font-medium uppercase tracking-wider mb-1">Cumulative GPA</div>
              <div className="text-3xl font-bold text-primary">{cgpa.toFixed(2)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 bg-gray-50/50">
          <div>
            <div className="text-sm text-gray-500 mb-1">Branch</div>
            <div className="font-medium">{student.branch}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Batch</div>
            <div className="font-medium">{student.batch}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Program</div>
            <div className="font-medium">M.Tech</div>
          </div>
          {specialization && (
            <div className="col-span-2 md:col-span-4">
              <div className="text-sm text-gray-500 mb-1">Specialization</div>
              <div className="font-medium">{specialization}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Academic Record</h2>

      {semesters.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            No results found for this student.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {semesters.map((semester) => (
            <Card key={semester.semester} className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
              <CardHeader className="bg-gray-50 border-b py-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Semester {semester.semester}</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Credits: <span className="font-medium text-gray-900">{semester.totalCredits}</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-base px-3 py-1 border-primary/20 text-primary">
                      SGPA: {semester.sgpa.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white">
                      <TableRow>
                        <TableHead className="w-[120px]">Subject Code</TableHead>
                        <TableHead>Subject Name</TableHead>
                        <TableHead className="text-center w-[100px]">Credits</TableHead>
                        <TableHead className="text-center w-[100px]">Grade</TableHead>
                        <TableHead className="text-center w-[100px]">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semester.results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium text-gray-600">{result.subjectCode}</TableCell>
                          <TableCell>{stripSpec(result.subjectName, specialization)}</TableCell>
                          <TableCell className="text-center">{result.credits}</TableCell>
                          <TableCell className="text-center">
                            <span className={`font-semibold ${result.grade === 'Fail' ? 'text-destructive' : 'text-gray-900'}`}>
                              {result.grade}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{result.gradePoint}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
