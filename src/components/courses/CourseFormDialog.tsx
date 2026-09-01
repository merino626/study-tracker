import { useEffect, useState } from 'react';
import { createCourseSchema } from '@shared/schemas';
import type { Course } from '@shared/types/models';
import { Button } from '@/components/ui/button';
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
  buildCoursePayload,
  courseFormSchema,
  courseToFormValues,
  emptyCourseFormValues,
  PLATFORM_OPTIONS,
  type CourseFormValues,
} from '@/utils/course-form';
import { COURSE_PRIORITY_LABELS, COURSE_STATUS_LABELS } from '@/utils/course';

interface CourseFormDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (courseId: string | null, data: ReturnType<typeof buildCoursePayload>) => Promise<void>;
}

export function CourseFormDialog({ course, open, onOpenChange, onSave }: CourseFormDialogProps) {
  const [values, setValues] = useState<CourseFormValues>(emptyCourseFormValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CourseFormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(course ? courseToFormValues(course) : emptyCourseFormValues);
      setErrors({});
      setFormError(null);
    }
  }, [course, open]);

  const handleSave = async () => {
    setFormError(null);
    const parsed = courseFormSchema.safeParse(values);

    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CourseFormValues, string>> = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0];
        if (typeof field === 'string') {
          fieldErrors[field as keyof CourseFormValues] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const payload = buildCoursePayload(parsed.data);
    const validated = createCourseSchema.safeParse(payload);

    if (!validated.success) {
      setFormError(validated.error.errors[0]?.message ?? 'Dados inválidos');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(course?.id ?? null, payload);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar curso';
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{course ? 'Editar curso' : 'Novo curso'}</DialogTitle>
          <DialogDescription>
            Cadastre os detalhes do curso para acompanhar seu progresso.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nome do curso</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <select
              id="platform"
              value={values.platform}
              onChange={(event) =>
                setValues((current) => ({ ...current, platform: event.target.value }))
              }
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              {PLATFORM_OPTIONS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={values.category}
              onChange={(event) =>
                setValues((current) => ({ ...current, category: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="url">URL do curso</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://"
              value={values.url}
              onChange={(event) =>
                setValues((current) => ({ ...current, url: event.target.value }))
              }
            />
            {errors.url && <p className="text-destructive text-xs">{errors.url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instrutor</Label>
            <Input
              id="instructor"
              value={values.instructor}
              onChange={(event) =>
                setValues((current) => ({ ...current, instructor: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="officialHours">Carga horária oficial (h)</Label>
            <Input
              id="officialHours"
              type="number"
              min={0}
              step={0.5}
              value={values.officialHours}
              onChange={(event) =>
                setValues((current) => ({ ...current, officialHours: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startedAt">Data de início</Label>
            <Input
              id="startedAt"
              type="date"
              value={values.startedAt}
              onChange={(event) =>
                setValues((current) => ({ ...current, startedAt: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completedAt">Data de conclusão</Label>
            <Input
              id="completedAt"
              type="date"
              value={values.completedAt}
              onChange={(event) =>
                setValues((current) => ({ ...current, completedAt: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as CourseFormValues['status'],
                }))
              }
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              {Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <select
              id="priority"
              value={values.priority}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  priority: event.target.value as CourseFormValues['priority'],
                }))
              }
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            >
              {Object.entries(COURSE_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Avaliação pessoal (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={5}
              value={values.rating}
              onChange={(event) =>
                setValues((current) => ({ ...current, rating: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              placeholder="python, backend, api"
              value={values.tags}
              onChange={(event) =>
                setValues((current) => ({ ...current, tags: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Resumo do curso</Label>
            <textarea
              id="notes"
              rows={3}
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              placeholder="Breve descrição do curso. Use o caderno na página de detalhes para anotações completas."
            />
          </div>
        </div>

        {formError && <p className="text-destructive text-sm">{formError}</p>}

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
