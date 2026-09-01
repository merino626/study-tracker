import { useCallback } from 'react';
import type { CreateSessionInput, StudySession, UpdateSessionInput } from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseSessionsResult {
  sessions: StudySession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSession: (data: CreateSessionInput) => Promise<StudySession>;
  updateSession: (id: string, data: UpdateSessionInput) => Promise<StudySession>;
  deleteSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsResult {
  const fetcher = useCallback(() => ipcClient.sessions.list(), []);
  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const createSession = useCallback(
    async (input: CreateSessionInput): Promise<StudySession> => {
      const session = await ipcClient.sessions.create(input);
      await refetch();
      return session;
    },
    [refetch],
  );

  const updateSession = useCallback(
    async (id: string, input: UpdateSessionInput): Promise<StudySession> => {
      const session = await ipcClient.sessions.update(id, input);
      await refetch();
      return session;
    },
    [refetch],
  );

  const deleteSession = useCallback(
    async (id: string): Promise<void> => {
      await ipcClient.sessions.delete(id);
      await refetch();
    },
    [refetch],
  );

  return {
    sessions: data ?? [],
    loading,
    error,
    refetch,
    createSession,
    updateSession,
    deleteSession,
  };
}
