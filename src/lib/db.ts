import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Lesson {
  id: string;
  courseId: string;
  level: string;
  name: string;
  url: string;
  duration: string;
  completed: boolean;
  order: number;
  startedAt?: number;
}

export interface Level {
  id: string;
  courseId: string;
  name: string;
  order: number;
}

export interface Course {
  id: string;
  name: string;
  type: string;
  createdAt: number;
}

interface AppDB extends DBSchema {
  courses: {
    key: string;
    value: Course;
  };
  levels: {
    key: string;
    value: Level;
    indexes: { 'by-course': string };
  };
  lessons: {
    key: string;
    value: Lesson;
    indexes: { 'by-course': string; 'by-level': string };
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('masar-learning-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('courses')) {
          db.createObjectStore('courses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('levels')) {
          const levelStore = db.createObjectStore('levels', { keyPath: 'id' });
          levelStore.createIndex('by-course', 'courseId');
        }
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' });
          lessonStore.createIndex('by-course', 'courseId');
          lessonStore.createIndex('by-level', 'level');
        }
      },
    });
  }
  return dbPromise;
};

export const db = {
  async getCourses() {
    const db = await initDB();
    return db.getAll('courses');
  },
  async getCourse(id: string) {
    const db = await initDB();
    return db.get('courses', id);
  },
  async addCourse(course: Course) {
    const db = await initDB();
    await db.put('courses', course);
  },
  async deleteCourse(id: string) {
    const db = await initDB();
    const tx = db.transaction(['courses', 'levels', 'lessons'], 'readwrite');
    await tx.objectStore('courses').delete(id);
    
    const levelsIndex = tx.objectStore('levels').index('by-course');
    let levelCursor = await levelsIndex.openCursor(IDBKeyRange.only(id));
    while (levelCursor) {
      await levelCursor.delete();
      levelCursor = await levelCursor.continue();
    }

    const lessonsIndex = tx.objectStore('lessons').index('by-course');
    let lessonCursor = await lessonsIndex.openCursor(IDBKeyRange.only(id));
    while (lessonCursor) {
      await lessonCursor.delete();
      lessonCursor = await lessonCursor.continue();
    }
    await tx.done;
  },
  async getLevelsByCourse(courseId: string) {
    const db = await initDB();
    return db.getAllFromIndex('levels', 'by-course', courseId);
  },
  async addLevels(levels: Level[]) {
    const db = await initDB();
    const tx = db.transaction('levels', 'readwrite');
    await Promise.all(levels.map(level => tx.store.put(level)));
    await tx.done;
  },
  async getLessonsByCourse(courseId: string) {
    const db = await initDB();
    return db.getAllFromIndex('lessons', 'by-course', courseId);
  },
  async getLessonsByLevel(levelId: string) {
    const db = await initDB();
    return db.getAllFromIndex('lessons', 'by-level', levelId);
  },
  async addLessons(lessons: Lesson[]) {
    const db = await initDB();
    const tx = db.transaction('lessons', 'readwrite');
    await Promise.all(lessons.map(lesson => tx.store.put(lesson)));
    await tx.done;
  },
  async updateLesson(lesson: Lesson) {
    const db = await initDB();
    await db.put('lessons', lesson);
  }
};
