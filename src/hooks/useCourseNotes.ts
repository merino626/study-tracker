import { useCallback } from 'react';
import type {
  CourseNote,
  CreateCourseNoteInput,
  UpdateCourseNoteInput,
} from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseCourseNotesResult {
  notes: CourseNote[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createNote: (data: CreateCourseNoteInput) => Promise<CourseNote>;
  updateNote: (id: string, data: UpdateCourseNoteInput) => Promise<CourseNote>;
  deleteNote: (id: string) => Promise<void>;
}

export function useCourseNotes(courseId: string | undefined): UseCourseNotesResult {
  const fetcher = useCallback(async () => {
    if (!courseId) {
      return [];
    }
    return ipcClient.courseNotes.list(courseId);
  }, [courseId]);

  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const createNote = useCallback(
    async (input: CreateCourseNoteInput) => {
      const note = await ipcClient.courseNotes.create(input);
      await refetch();
      return note;
    },
    [refetch],
  );

  const updateNote = useCallback(
    async (id: string, input: UpdateCourseNoteInput) => {
      const note = await ipcClient.courseNotes.update(id, input);
      await refetch();
      return note;
    },
    [refetch],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await ipcClient.courseNotes.delete(id);
      await refetch();
    },
    [refetch],
  );

  return {
    notes: data ?? [],
    loading,
    error,
    refetch,
    createNote,
    updateNote,
    deleteNote,
  };
}
