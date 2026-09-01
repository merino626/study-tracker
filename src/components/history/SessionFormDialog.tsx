import { useEffect, useState } from 'react';
import { createSessionSchema } from '@shared/schemas';
import type { Course, StudySession } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { CourseSelect } from '@/components/courses/CourseSelect';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildSessionPayload,
  computeDurationSeconds,
  fromDatetimeLocalValue,
  sessionFormSchema,
  sessionToFormValues,
  type SessionFormValues,
} from '@/utils/session-form';
import { formatDuration } from '@/utils/time';

interface SessionFormDialogProps {
  session: StudySession | null;
  courses: Course[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionId: string, data: ReturnType<typeof buildSessionPayload>) => Promise<void>;
}

export function SessionFormDialog({
  session,
  courses,
  open,
  onOpenChange,
  onSave,
}: SessionFormDialogProps) {
  const [values, setValues] = useState<SessionFormValues>({
    startedAt: '',
    endedAt: '',
    courseId: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SessionFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session && open) {
      setValues(sessionToFormValues(session));
      setErrors({});
      setFormError(null);
    }
  }, [open, session]);

  const previewDuration =
    values.startedAt && values.endedAt
      ? computeDurationSeconds(
          fromDatetimeLocalValue(values.startedAt),
          fromDatetimeLocalValue(values.endedAt),
        )
      : 0;

  const handleSave = async () => {
    if (!session) {
      return;
    }

    setFormError(null);
    const parsed = sessionFormSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof SessionFormValues, string>> = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0];
        if (field === 'startedAt' || field === 'endedAt') {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const payload = buildSessionPayload(parsed.data);
    const validated = createSessionSchema.safeParse(payload);

    if (!validated.success) {
      setFormError(validated.error.errors[0]?.message ?? 'Dados inválidos');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(session.id, payload);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar sessão';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar sessão</DialogTitle>
          <DialogDescription>
            Ajuste a data, horários, curso ou duração da sessão de estudo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <CourseSelect
            courses={courses}
            value={values.courseId ?? null}
            onChange={(courseId) => setValues((current) => ({ ...current, courseId }))}
          />

          <div className="space-y-2">
            <Label htmlFor="startedAt">Início</Label>
            <Input
              id="startedAt"
              type="datetime-local"
              value={values.startedAt}
              onChange={(event) => {
                setValues((current) => ({ ...current, startedAt: event.target.value }));
                setErrors((current) => ({ ...current, startedAt: undefined }));
              }}
              aria-invalid={Boolean(errors.startedAt)}
            />
            {errors.startedAt && <p className="text-destructive text-xs">{errors.startedAt}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endedAt">Fim</Label>
            <Input
              id="endedAt"
              type="datetime-local"
              value={values.endedAt}
              onChange={(event) => {
                setValues((current) => ({ ...current, endedAt: event.target.value }));
                setErrors((current) => ({ ...current, endedAt: undefined }));
              }}
              aria-invalid={Boolean(errors.endedAt)}
            />
            {errors.endedAt && <p className="text-destructive text-xs">{errors.endedAt}</p>}
          </div>

          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-muted-foreground text-xs">Duração calculada</p>
            <p className="font-mono text-sm font-medium tabular-nums">
              {formatDuration(previewDuration)}
            </p>
          </div>

          {formError && <p className="text-destructive text-sm">{formError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
