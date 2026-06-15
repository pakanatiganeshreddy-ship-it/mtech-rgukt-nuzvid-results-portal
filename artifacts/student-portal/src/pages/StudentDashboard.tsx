import { useState } from "react";
import { useGetMe, useGetStudentResults, getGetStudentResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Download, KeyRound, X, Pencil, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SemesterResult {
  semester: number;
  sgpa: number;
  totalCredits: number;
  results: {
    id: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    grade: string;
    gradePoint: number;
  }[];
}

function buildPrintHTML(
  student: { studentId: string; name: string; branch: string; batch: string },
  semesters: SemesterResult[],
  cgpa: number,
  specialization: string
): string {
  const logoUrl = window.location.origin + "/rgukt-logo.png";

  const semRows = semesters.map((sem) => `
    <div class="semester">
      <div class="sem-header">
        <strong>Semester ${sem.semester}</strong>
        <span>Credits: ${sem.totalCredits} &nbsp;|&nbsp; <strong>SGPA: ${sem.sgpa.toFixed(2)}</strong></span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Subject Code</th><th>Subject Name</th>
            <th class="center">Credits</th><th class="center">Grade</th><th class="center">Points</th>
          </tr>
        </thead>
        <tbody>
          ${sem.results.map((r) => `
            <tr>
              <td>${r.subjectCode}</td>
              <td>${stripSpec(r.subjectName, specialization)}</td>
              <td class="center">${r.credits}</td>
              <td class="center"><strong>${r.grade}</strong></td>
              <td class="center">${r.gradePoint}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Results – ${student.studentId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1a56db;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 24px;
      z-index: 999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      font-family: Arial, sans-serif;
    }
    .print-bar-title { font-size: 14px; font-weight: 600; letter-spacing: 0.3px; }
    .print-bar-hint { font-size: 11px; opacity: 0.8; margin-top: 2px; }
    .print-bar-btn {
      background: white;
      color: #1a56db;
      border: none;
      padding: 8px 22px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .print-bar-btn:hover { background: #e8f0fe; }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      height: 400px;
      background-image: url('${logoUrl}');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      opacity: 0.10;
      pointer-events: none;
      z-index: 0;
    }

    .content {
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: #111;
      padding: 24px;
      margin-top: 56px;
      position: relative;
      z-index: 1;
    }
    h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #555; margin-bottom: 20px; font-size: 13px; }
    .info-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 20px; }
    .info-grid .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .info-grid .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
    .spec-box { border: 1px solid #ddd; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; }
    .spec-box .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .spec-box .value { font-size: 13px; font-weight: bold; margin-top: 2px; }
    .cgpa-box { text-align: center; background: #e8f0fe; border-radius: 6px; padding: 12px; margin-bottom: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cgpa-box .label { font-size: 10px; color: #1a56db; text-transform: uppercase; }
    .cgpa-box .value { font-size: 22px; font-weight: bold; color: #1a56db; }
    .semester { margin-bottom: 20px; break-inside: avoid; }
    .sem-header { display: flex; justify-content: space-between; background: #f3f4f6; padding: 8px 12px; border-radius: 4px 4px 0 0; border: 1px solid #e5e7eb; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-top: none; }
    th { background: #f9fafb; text-align: left; padding: 6px 10px; border: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #6b7280; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    td { padding: 6px 10px; border: 1px solid #e5e7eb; }
    .center { text-align: center; }
    .grading { margin-top: 16px; font-size: 11px; color: #555; text-align: center; }
    .footer { margin-top: 24px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }

    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-bar { display: none !important; }
      .content { margin-top: 0; }
      .watermark {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 400px; height: 400px;
        opacity: 0.10;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>

  <div class="print-bar">
    <div>
      <div class="print-bar-title">📄 RGUKT M.Tech Results — Preview</div>
      <div class="print-bar-hint">Tip: Enable "Background graphics" in print settings to see the watermark</div>
    </div>
    <button class="print-bar-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="watermark"></div>

  <div class="content">
    <h1>RGUKT M.Tech Results Portal</h1>
    <p class="subtitle">Rajiv Gandhi University of Knowledge Technologies - Nuzvid</p>

    <div class="info-grid">
      <div><div class="label">Student ID</div><div class="value">${student.studentId}</div></div>
      <div><div class="label">Name</div><div class="value">${student.name}</div></div>
      <div><div class="label">Branch</div><div class="value">${student.branch}</div></div>
      <div><div class="label">Batch</div><div class="value">${student.batch}</div></div>
    </div>

    ${specialization ? `<div class="spec-box"><div class="label">Specialization</div><div class="value">${specialization}</div></div>` : ""}

    <div class="cgpa-box">
      <div class="label">Cumulative GPA (CGPA)</div>
      <div class="value">${cgpa.toFixed(2)}</div>
    </div>

    ${semRows}

    <p class="grading">Grading Scale: EX=10 &nbsp; A=9 &nbsp; B=8 &nbsp; C=7 &nbsp; D=6 &nbsp; E=5 &nbsp; Fail=0 &nbsp;|&nbsp; CGPA × 10 = Aggregate %</p>
    <p class="footer">Generated on ${new Date().toLocaleString("en-IN")} &nbsp;|&nbsp; RGUKT M.Tech Results Portal</p>
  </div>

</body>
</html>`;
}

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

export default function StudentDashboard() {
  const { data: user } = useGetMe();
  const queryClient = useQueryClient();
  const studentId = user?.id;

  const { data: resultsSummary, isLoading, error } = useGetStudentResults(studentId || "", {
    query: { enabled: !!studentId, queryKey: getGetStudentResultsQueryKey(studentId || "") }
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/auth/student/change-password", {
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
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(null);
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

  const handleStartEditName = (currentName: string) => {
    setNameInput(currentName);
    setNameError(null);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameSaving(true);
    setNameError(null);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId || "")}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save name");
      await queryClient.invalidateQueries({ queryKey: getGetStudentResultsQueryKey(studentId || "") });
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Failed to save name");
    } finally {
      setNameSaving(false);
    }
  };

  const handleCancelEditName = (currentName: string) => {
    setEditingName(false);
    setNameInput(currentName);
    setNameError(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !resultsSummary) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-gray-500">Failed to load results. Please try again later or contact administration.</p>
        </CardContent>
      </Card>
    );
  }

  const { student, semesters, cgpa } = resultsSummary;
  const allSubjectNames = (semesters as SemesterResult[]).flatMap(s => s.results.map(r => r.subjectName));
  const specialization = computeSpecialization(allSubjectNames);

  const handleDownload = () => {
    const html = buildPrintHTML(student, semesters as SemesterResult[], cgpa, specialization);
    const win = window.open("", "_blank");
    if (!win) { alert("Please allow pop-ups to download results."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    // No auto-print — the preview page has its own Print / Save as PDF button
  };

  return (
    <div className="relative min-h-screen">

      {/* Dashboard watermark */}
      <div
        className="pointer-events-none select-none fixed inset-0 flex items-center justify-center z-0"
        aria-hidden="true"
      >
        <img
          src="/rgukt-logo.png"
          alt=""
          className="w-80 h-80 object-contain opacity-[0.06]"
        />
      </div>

      {/* All content above the watermark */}
      <div className="relative z-10 space-y-8">

        {nameSuccess && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
            <Check className="h-4 w-4" />
            Name updated successfully
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
              </div>
              {passwordSuccess ? (
                <div className="text-center py-4">
                  <div className="text-green-600 text-lg font-medium mb-2">Password changed successfully!</div>
                  <p className="text-gray-500 text-sm mb-4">Your new password is active from the next login.</p>
                  <Button onClick={closeModal} className="w-full">Close</Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {passwordError && (
                    <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{passwordError}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <PasswordInput placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <PasswordInput placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <PasswordInput placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-10" />
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

        {/* Student Info Card */}
        <Card className="border-0 shadow-sm ring-1 ring-gray-200">
          <CardHeader className="bg-white border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") handleCancelEditName(student.name); }}
                      maxLength={60}
                      placeholder="Enter your full name"
                      className="text-2xl font-bold border-b-2 border-primary outline-none bg-transparent text-gray-900 w-56 placeholder-gray-300"
                    />
                    <button onClick={handleSaveName} disabled={nameSaving} title="Save name" className="text-green-600 hover:text-green-700 disabled:opacity-50">
                      <Check className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleCancelEditName(student.name)} title="Cancel" className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{student.name}</CardTitle>
                    <button onClick={() => handleStartEditName(student.name)} title="Edit your name" className="text-gray-300 hover:text-primary transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                <p className="text-gray-500 text-base mt-1">Student ID: {student.studentId}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-primary/5 px-6 py-3 rounded-lg border border-primary/10 text-center">
                  <div className="text-sm text-primary font-medium uppercase tracking-wider mb-1">Cumulative GPA</div>
                  <div className="text-3xl font-bold text-primary">{cgpa.toFixed(2)}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={semesters.length === 0} className="gap-2 shrink-0">
                    <Download className="h-4 w-4" />
                    Download Results
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)} className="gap-2 shrink-0">
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </Button>
                </div>
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

        {/* Semester Results */}
        {semesters.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">No results found.</CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {(semesters as SemesterResult[]).map((sem) => (
              <Card key={sem.semester} className="border-0 shadow-sm ring-1 ring-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50 border-b py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Semester {sem.semester}</CardTitle>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">Credits: <span className="font-medium text-gray-900">{sem.totalCredits}</span></span>
                      <Badge variant="outline" className="bg-white text-base px-3 py-1 border-primary/20 text-primary">
                        SGPA: {sem.sgpa.toFixed(2)}
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
                        {sem.results.map((result) => (
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
    </div>
  );
}
