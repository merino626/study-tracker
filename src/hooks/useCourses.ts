import { useCallback } from 'react';
import type {
  Course,
  CourseDetail,
  CourseStats,
  CreateCourseInput,
  UpdateCourseInput,
} from '@shared/types/models';
import { ipcClient } from '@/services/ipc-client';
import { useAsyncData } from '@/hooks/useAsyncData';

interface UseCoursesResult {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCourse: (data: CreateCourseInput) => Promise<Course>;
  updateCourse: (id: string, data: UpdateCourseInput) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  getCourseStats: (id: string) => Promise<CourseStats>;
}

export function useCourseDetail(courseId: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!courseId) {
      return null;
    }
    return ipcClient.courses.get(courseId);
  }, [courseId]);

  return useAsyncData<CourseDetail | null>(fetcher);
}

export function useCourses(): UseCoursesResult {
  const fetcher = useCallback(() => ipcClient.courses.list(), []);
  const { data, loading, error, refetch } = useAsyncData(fetcher);

  const createCourse = useCallback(
    async (input: CreateCourseInput): Promise<Course> => {
      const course = await ipcClient.courses.create(input);
      await refetch();
      return course;
    },
    [refetch],
  );

  const updateCourse = useCallback(
    async (id: string, input: UpdateCourseInput): Promise<Course> => {
      const course = await ipcClient.courses.update(id, input);
      await refetch();
      return course;
    },
    [refetch],
  );

  const deleteCourse = useCallback(
    async (id: string): Promise<void> => {
      await ipcClient.courses.delete(id);
      await refetch();
    },
    [refetch],
  );

  const getCourseStats = useCallback((id: string) => ipcClient.courses.stats(id), []);

  return {
    courses: data ?? [],
    loading,
    error,
    refetch,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseStats,
  };
}
