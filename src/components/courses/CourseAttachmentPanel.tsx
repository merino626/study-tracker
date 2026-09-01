import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileText, Paperclip, Trash2 } from 'lucide-react';
import type { CourseAttachment } from '@shared/types/models';
import { Button } from '@/components/ui/button';
import { useCourseAttachments } from '@/hooks/useCourseAttachments';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

interface CourseAttachmentPanelProps {
  courseId: string;
  noteId?: string | null;
}

export function CourseAttachmentPanel({ courseId, noteId }: CourseAttachmentPanelProps) {
  const { attachments, addAttachment, deleteAttachment, readAttachment, openAttachment } =
    useCourseAttachments(courseId, noteId);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const loadPreviews = useCallback(async () => {
    const imageAttachments = attachments.filter((item) => isImageMime(item.mimeType));
    const entries = await Promise.all(
      imageAttachments.map(async (attachment) => {
        try {
          const content = await readAttachment(attachment.id);
          return [attachment.id, content.dataUrl] as const;
        } catch {
          return [attachment.id, ''] as const;
        }
      }),
    );
    setPreviews(Object.fromEntries(entries.filter(([, url]) => url.length > 0)));
  }, [attachments, readAttachment]);

  useEffect(() => {
    void loadPreviews();
  }, [loadPreviews]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Anexos ({attachments.length})</p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void addAttachment(noteId)}
        >
          <Paperclip className="size-3.5" />
          Anexar arquivo
        </Button>
      </div>

      {attachments.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          Anexe PDFs, imagens, documentos ou outros arquivos a esta anotação.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              previewUrl={previews[attachment.id]}
              onOpen={() => void openAttachment(attachment.id)}
              onDelete={() => void deleteAttachment(attachment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AttachmentCardProps {
  attachment: CourseAttachment;
  previewUrl?: string;
  onOpen: () => void;
  onDelete: () => void;
}

function AttachmentCard({ attachment, previewUrl, onOpen, onDelete }: AttachmentCardProps) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={attachment.fileName}
          className="h-32 w-full rounded-md object-cover"
        />
      ) : (
        <div className="bg-muted flex h-32 items-center justify-center rounded-md">
          <FileText className="text-muted-foreground size-8" />
        </div>
      )}
      <div className="space-y-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-muted-foreground text-xs">{formatFileSize(attachment.sizeBytes)}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" className="gap-1" onClick={onOpen}>
          <ExternalLink className="size-3.5" />
          Abrir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
