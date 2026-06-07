import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import type { PdfUploadResult } from "@workspace/api-client-react";

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PdfUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Results PDF</h1>
        <p className="text-gray-500 mt-1">Upload university result PDFs to extract and import student results.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>Only standard RGUKT results PDF format is supported</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Select PDF File</Label>
              <div className="flex gap-4 items-center">
                <Input 
                  id="pdf-upload" 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={!file || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <UploadCloud className="mr-2 h-4 w-4 animate-bounce" />
                  Uploading & Extracting...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload and Process
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle className="text-lg">Upload Successful</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">{result.message}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{result.extracted}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Extracted</div>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{result.inserted}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Inserted</div>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{result.studentsAutoCreated}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">New Students</div>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{result.errors}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
