import { useCallback } from 'react';
import type { CourseAttachment, CourseAttachmentContent } from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseCourseAttachmentsResult {
  attachments: CourseAttachment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addAttachment: (noteId?: string | null) => Promise<CourseAttachment | null>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  readAttachment: (attachmentId: string) => Promise<CourseAttachmentContent>;
  openAttachment: (attachmentId: string) => Promise<void>;
}

export function useCourseAttachments(
  courseId: string | undefined,
  noteId?: string | null,
): UseCourseAttachmentsResult {
  const fetcher = useCallback(async () => {
    if (!courseId) {
      return [];
    }
    return ipcClient.courseAttachments.list(courseId, noteId);
  }, [courseId, noteId]);

  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const addAttachment = useCallback(
    async (targetNoteId?: string | null) => {
      if (!courseId) {
        return null;
      }
      const attachment = await ipcClient.courseAttachments.add(courseId, targetNoteId ?? noteId);
      if (attachment) {
        await refetch();
      }
      return attachment;
    },
    [courseId, noteId, refetch],
  );

  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      await ipcClient.courseAttachments.delete(attachmentId);
      await refetch();
    },
    [refetch],
  );

  const readAttachment = useCallback(
    (attachmentId: string) => ipcClient.courseAttachments.read(attachmentId),
    [],
  );

  const openAttachment = useCallback(
    (attachmentId: string) => ipcClient.courseAttachments.open(attachmentId),
    [],
  );

  return {
    attachments: data ?? [],
    loading,
    error,
    refetch,
    addAttachment,
    deleteAttachment,
    readAttachment,
    openAttachment,
  };
}
