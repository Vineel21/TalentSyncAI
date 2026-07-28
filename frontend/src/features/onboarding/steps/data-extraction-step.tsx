import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Keyboard,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { assessmentModeMessage, isLiveAiProcessingEnabled } from '@/config/ai-processing';
import { errorMessage } from '@/lib/utils';
import { resumeService } from '@/services/resume.service';
import type { OnboardingSource } from '@/types/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function DataExtractionStep({
  currentSource,
  isAdvancing,
  onContinue,
}: {
  currentSource: OnboardingSource | null;
  isAdvancing: boolean;
  onContinue: (source: OnboardingSource) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const liveAiProcessingEnabled = isLiveAiProcessingEnabled();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const processResume = useMutation({
    mutationFn: async (selectedFile: File) => {
      await resumeService.upload(selectedFile);
      return resumeService.parse();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard', 'candidate'] }),
      ]);
      await onContinue('resume');
    },
  });

  function validateFile(selected?: File) {
    if (!liveAiProcessingEnabled) return;
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      setFile(null);
      setFileError('Choose a PDF file.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setFileError('The PDF must be 5 MB or smaller.');
      return;
    }
    setFile(selected);
    setFileError(null);
    processResume.reset();
  }

  return (
    <div className="space-y-7">
      <div className="text-center sm:text-left">
        <p className="text-sm font-bold uppercase tracking-widest text-primary">Step 1</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Let’s build your candidate profile
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:mx-0 sm:text-base">
          Import your resume for a head start, or enter your information manually. You can review
          every detail before anything is finalized.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col overflow-hidden border-primary/30">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-blue-50/60 p-5 dark:bg-blue-950/20">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold">Upload a resume</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fastest way to build your profile
                </p>
              </div>
            </div>
            <Badge variant={liveAiProcessingEnabled ? 'success' : 'warning'}>
              {liveAiProcessingEnabled ? 'Recommended' : 'Assessment demo'}
            </Badge>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div
              className="flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-6 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                validateFile(event.dataTransfer.files[0]);
              }}
            >
              <UploadCloud aria-hidden="true" className="h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-semibold">Drop your PDF here</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF only, up to 5 MB</p>
              <input
                accept="application/pdf,.pdf"
                aria-label="Resume PDF"
                className="sr-only"
                disabled={!liveAiProcessingEnabled}
                onChange={(event) => validateFile(event.target.files?.[0])}
                ref={inputRef}
                type="file"
              />
              <Button
                className="mt-4"
                disabled={!liveAiProcessingEnabled || processResume.isPending || isAdvancing}
                onClick={() => inputRef.current?.click()}
                size="sm"
                type="button"
                variant="outline"
              >
                Choose PDF
              </Button>
            </div>

            {!liveAiProcessingEnabled ? (
              <div
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                role="status"
              >
                <p className="font-bold">Resume parsing paused for this public demo</p>
                <p className="mt-1">{assessmentModeMessage}</p>
              </div>
            ) : null}

            {fileError ? (
              <p className="mt-3 text-sm font-medium text-destructive" role="alert">
                {fileError}
              </p>
            ) : null}

            {file ? (
              <div className="mt-4 flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
                <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  aria-label="Remove selected resume"
                  disabled={processResume.isPending}
                  onClick={() => setFile(null)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {processResume.isError ? (
              <div
                className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                role="alert"
              >
                <div className="flex gap-3">
                  <AlertCircle
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                  />
                  <div>
                    <p className="text-sm font-bold">We couldn’t parse that resume</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {errorMessage(processResume.error)}
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => void onContinue('manual')}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Enter details manually
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            {liveAiProcessingEnabled ? (
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Resume text is processed securely by Google Gemini from our backend to extract your
                profile. There is no automatic application or hiring decision.
              </p>
            ) : null}
            <div className="mt-auto pt-5">
              {currentSource === 'resume' && !file ? (
                <Button
                  className="w-full"
                  isLoading={isAdvancing}
                  onClick={() => void onContinue('resume')}
                  type="button"
                  variant="outline"
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  Continue with parsed resume
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={!file || isAdvancing}
                  isLoading={processResume.isPending}
                  onClick={() => file && processResume.mutate(file)}
                  type="button"
                >
                  Upload, parse, and continue
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground">
              <Keyboard aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Enter details manually</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Best if you don’t have a current resume
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[
              'Add your skills, education, and experience at your own pace',
              'Freshers can continue with education and no work history',
              'Upload a resume later from your profile',
            ].map((item) => (
              <li className="flex gap-2" key={item}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            You can finish setup, browse roles, and save jobs without a resume. You’ll need to
            upload one before submitting an application.
          </div>
          <Button
            className="mt-auto w-full sm:mt-8"
            isLoading={isAdvancing}
            onClick={() => void onContinue('manual')}
            type="button"
            variant="outline"
          >
            Continue with manual entry
          </Button>
        </Card>
      </div>
    </div>
  );
}
