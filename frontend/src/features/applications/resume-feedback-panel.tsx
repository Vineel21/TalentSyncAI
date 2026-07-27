import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileSearch, LoaderCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/features/shared/toast-provider';
import { errorMessage } from '@/lib/utils';
import { aiService } from '@/services/ai.service';
import type { ResumeFeedback } from '@/types/api';

const feedbackSections: Array<{
  key: keyof ResumeFeedback;
  title: string;
  emptyMessage: string;
}> = [
  {
    key: 'ats',
    title: 'ATS readiness',
    emptyMessage: 'No ATS issues were identified.',
  },
  {
    key: 'grammar',
    title: 'Grammar and clarity',
    emptyMessage: 'No grammar or clarity issues were identified.',
  },
  {
    key: 'skills',
    title: 'Skill presentation',
    emptyMessage: 'No skill-presentation improvements were suggested.',
  },
  {
    key: 'projects',
    title: 'Projects',
    emptyMessage: 'No project improvements were suggested.',
  },
  {
    key: 'formatting',
    title: 'Formatting',
    emptyMessage: 'No formatting issues were identified.',
  },
  {
    key: 'achievements',
    title: 'Achievements',
    emptyMessage: 'No achievement improvements were suggested.',
  },
];

export function ResumeFeedbackPanel({
  applicationId,
  initialFeedback,
}: {
  applicationId: string;
  initialFeedback?: ResumeFeedback | null;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const feedback = useMutation({
    mutationFn: () => aiService.resumeFeedback(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(
        'Resume feedback ready',
        'Review each suggestion against the submitted resume.',
      );
    },
  });
  const currentFeedback = feedback.data ?? initialFeedback ?? null;

  return (
    <section aria-labelledby="resume-feedback-title" className="mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold" id="resume-feedback-title">
            AI resume feedback
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured suggestions based on the resume submitted with this application.
          </p>
        </div>
        <Button
          isLoading={feedback.isPending}
          onClick={() => feedback.mutate()}
          size="sm"
          variant="outline"
        >
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          {feedback.isPending
            ? currentFeedback
              ? 'Refreshing feedback'
              : 'Generating feedback'
            : currentFeedback
              ? 'Regenerate feedback'
              : 'Generate feedback'}
        </Button>
      </div>

      {feedback.isError ? (
        <Card
          aria-label="Resume feedback unavailable"
          className="mt-4 border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Feedback could not be generated</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage(feedback.error)}</p>
              <Button
                className="mt-3"
                onClick={() => feedback.mutate()}
                size="sm"
                variant="outline"
              >
                Try again
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {feedback.isPending && !currentFeedback ? (
        <Card
          aria-label="Generating resume feedback"
          className="mt-4 flex min-h-36 items-center justify-center border-blue-200 bg-blue-50/50 p-6 text-center dark:border-blue-900 dark:bg-blue-950/20"
          role="status"
        >
          <div>
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto h-6 w-6 animate-spin text-primary"
            />
            <p className="mt-3 font-semibold">Analyzing the submitted resume</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Checking ATS readiness, clarity, skills, projects, formatting, and achievements.
            </p>
          </div>
        </Card>
      ) : currentFeedback ? (
        <>
          {feedback.isPending ? (
            <p aria-live="polite" className="mt-4 text-sm font-medium text-primary" role="status">
              Refreshing feedback while the previous result stays visible.
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {feedbackSections.map((section) => {
              const suggestions = currentFeedback[section.key];
              return (
                <Card className="p-4" key={section.key}>
                  <h4 className="font-semibold">{section.title}</h4>
                  {suggestions.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {suggestions.map((suggestion, index) => (
                        <li
                          className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"
                          key={`${section.key}-${index}`}
                        >
                          <span
                            aria-hidden="true"
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      />
                      {section.emptyMessage}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            AI-generated feedback is decision support. Verify suggestions against the submitted
            resume and the requirements of the role.
          </p>
        </>
      ) : feedback.isError ? null : (
        <Card className="mt-4 flex min-h-36 items-center gap-4 border-dashed p-5">
          <div className="rounded-full bg-muted p-3">
            <FileSearch aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No resume feedback yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate feedback to review concrete strengths and improvement opportunities.
            </p>
          </div>
        </Card>
      )}
    </section>
  );
}
