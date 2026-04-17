import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, Course, Level, Lesson } from '../lib/db';

interface AppState {
  courses: Course[];
  theme: 'light' | 'dark';
  language: 'ar' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  isLoading: boolean;
  notificationsEnabled: boolean;
  notificationTime: string;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'ar' | 'en') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setNotifications: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  
  loadCourses: () => Promise<void>;
  importCourse: (course: Course | null, levels: Level[], lessons: Lesson[]) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  updateCourseName: (id: string, name: string) => Promise<void>;
  updateLevelName: (id: string, name: string) => Promise<void>;
  deleteLevel: (id: string) => Promise<void>;
  deleteLesson: (id: string) => Promise<void>;
  toggleLessonCompletion: (lesson: Lesson) => Promise<void>;
  startLesson: (lesson: Lesson) => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      courses: [],
      theme: 'light',
      language: 'ar',
      fontSize: 'medium',
      isLoading: false,
      notificationsEnabled: false,
      notificationTime: '20:00',

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
      setNotificationTime: (time) => set({ notificationTime: time }),

      loadCourses: async () => {
        set({ isLoading: true });
        try {
          const courses = await db.getCourses();
          set({ courses: courses.sort((a, b) => b.createdAt - a.createdAt) });
        } finally {
          set({ isLoading: false });
        }
      },

      importCourse: async (course, levels, lessons) => {
        set({ isLoading: true });
        try {
          if (course) {
            await db.addCourse(course);
          }
          await db.addLevels(levels);
          await db.addLessons(lessons);
          await get().loadCourses();
        } finally {
          set({ isLoading: false });
        }
      },

      deleteCourse: async (id) => {
        set({ isLoading: true });
        try {
          await db.deleteCourse(id);
          await get().loadCourses();
        } finally {
          set({ isLoading: false });
        }
      },

      updateCourseName: async (id, name) => {
        const course = await db.getCourse(id);
        if (course) {
          await db.updateCourse({ ...course, name });
          await get().loadCourses();
        }
      },

      updateLevelName: async (id, name) => {
        const level = await db.getLevel(id);
        if (level) {
          await db.updateLevel({ ...level, name });
          // Note: component subscribing might need to refetch levels. We will use a signal mechanism or just refetch in components if needed, but Zustand manages global state.
          // Currently `levels` are directly fetched in components.
        }
      },

      deleteLevel: async (id) => {
        set({ isLoading: true });
        try {
          await db.deleteLevel(id);
        } finally {
          set({ isLoading: false });
        }
      },

      deleteLesson: async (id) => {
        set({ isLoading: true });
        try {
          await db.deleteLesson(id);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleLessonCompletion: async (lesson) => {
        const updatedLesson = { ...lesson, completed: !lesson.completed };
        await db.updateLesson(updatedLesson);
        // We might need to trigger a re-render in components that depend on lesson state,
        // but since lessons are fetched per course/level, we can just rely on local state or re-fetching.
      },

      startLesson: async (lesson) => {
        if (!lesson.startedAt) {
          const updatedLesson = { ...lesson, startedAt: Date.now() };
          await db.updateLesson(updatedLesson);
        }
      }
    }),
    {
      name: 'masar-settings',
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language, 
        fontSize: state.fontSize 
      }),
    }
  )
);
