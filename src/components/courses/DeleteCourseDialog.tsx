import type { Course } from '@shared/types/models';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteCourseDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (courseId: string) => Promise<void>;
}

export function DeleteCourseDialog({
  course,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCourseDialogProps) {
  const handleConfirm = async () => {
    if (!course) {
      return;
    }
    await onConfirm(course.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir curso</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir &quot;{course?.name}&quot;? As sessões vinculadas
            permanecerão, mas sem associação ao curso.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void handleConfirm()}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
