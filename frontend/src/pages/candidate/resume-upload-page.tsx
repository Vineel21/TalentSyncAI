import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, FileText, LockKeyhole, Sparkles, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, PageLoading } from '@/components/ui/state-view';
import { useToast } from '@/features/shared/toast-provider';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { errorMessage } from '@/lib/utils';
import { profileService } from '@/services/profile.service';
import { resumeService } from '@/services/resume.service';
import type { ResumeParseResult } from '@/types/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ResumeUploadPage() {
  useDocumentTitle('Resume');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ResumeParseResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.getMine });
  const processResume = useMutation({
    mutationFn: async (selectedFile: File) => {
      await resumeService.upload(selectedFile);
      return resumeService.parse();
    },
    onSuccess: (result) => {
      setParsed(result);
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Resume parsed', 'Review the extracted details in your profile.');
    },
    onError: (error) => toast.error('Resume processing failed', errorMessage(error)),
  });

  if (profile.isLoading) return <PageLoading label="Loading resume status" />;
  if (profile.isError)
    return (
      <ErrorState message={errorMessage(profile.error)} onRetry={() => void profile.refetch()} />
    );
  if (!profile.data) return <PageLoading label="Loading resume status" />;

  function validateFile(selected?: File) {
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setFileError('Choose a PDF file.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('The PDF must be 5 MB or smaller.');
      setFile(null);
      return;
    }
    setFileError(null);
    setParsed(null);
    setFile(selected);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        description="AI extracts structured profile details on the server. You stay in control of every field."
        eyebrow="Profile"
        title="Resume upload"
        action={
          <Button asChild variant="outline">
            <Link to="/profile">Back to profile</Link>
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          <div
            className="flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center transition dark:border-blue-900 dark:bg-blue-950/20"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              validateFile(event.dataTransfer.files[0]);
            }}
          >
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-primary shadow-sm dark:bg-slate-900">
              <UploadCloud aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-lg font-bold">Drop your resume here</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              PDF only, up to 5 MB. Your file is stored privately and never exposed through a public
              URL.
            </p>
            <input
              accept="application/pdf,.pdf"
              className="sr-only"
              id="resume"
              onChange={(event) => validateFile(event.target.files?.[0])}
              ref={inputRef}
              type="file"
            />
            <Button
              className="mt-5"
              onClick={() => inputRef.current?.click()}
              type="button"
              variant="outline"
            >
              Choose PDF
            </Button>
          </div>
          {fileError ? (
            <p className="mt-3 text-sm font-medium text-destructive" role="alert">
              {fileError}
            </p>
          ) : null}
          {file ? (
            <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950">
                  <FileText aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  aria-label="Remove selected resume"
                  disabled={processResume.isPending}
                  onClick={() => setFile(null)}
                  size="icon"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button
                  isLoading={processResume.isPending}
                  onClick={() => processResume.mutate(file)}
                >
                  {processResume.isPending ? 'Uploading and parsing' : 'Upload and parse'}
                </Button>
              </div>
            </div>
          ) : null}
          {parsed ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold">Profile updated</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We found {parsed.skills.length} skills, {parsed.experience.length} experience
                    entries, and {parsed.education.length} education entries.
                  </p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/profile">Review extracted profile</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <LockKeyhole aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="font-bold">Private by design</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Only you and recruiters reviewing an application you submitted can access your resume.
            </p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-primary" />
              <h2 className="font-bold">What AI extracts</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Summary', 'Skills', 'Experience', 'Education', 'Certifications'].map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold">Current resume</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.data.resumePath
                ? 'A parsed resume is attached to your profile.'
                : 'No resume is attached yet.'}
            </p>
            <Badge className="mt-4" variant={profile.data.resumePath ? 'success' : 'warning'}>
              {profile.data.resumePath ? 'Ready' : 'Action needed'}
            </Badge>
          </Card>
        </div>
      </div>
    </div>
  );
}
