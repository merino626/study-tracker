import { create } from 'zustand';
import { SELECTED_COURSE_STORAGE_KEY } from '@/lib/constants';

interface CourseSelectState {
  selectedCourseId: string | null;
  setSelectedCourseId: (courseId: string | null) => void;
}

function loadSelectedCourseId(): string | null {
  try {
    return localStorage.getItem(SELECTED_COURSE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSelectedCourseId(courseId: string | null): void {
  try {
    if (courseId) {
      localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, courseId);
    } else {
      localStorage.removeItem(SELECTED_COURSE_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const useCourseSelectStore = create<CourseSelectState>((set) => ({
  selectedCourseId: loadSelectedCourseId(),
  setSelectedCourseId: (courseId) => {
    saveSelectedCourseId(courseId);
    set({ selectedCourseId: courseId });
  },
}));
