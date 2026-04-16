import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db, Course } from '../lib/db';
import { Link } from 'react-router-dom';
import { Book, Clock, ChevronLeft, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Courses = () => {
  const { courses, loadCourses, deleteCourse } = useStore();
  const [courseStats, setCourseStats] = useState<Record<string, { total: number, completed: number, levels: number }>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const stats: Record<string, { total: number, completed: number, levels: number }> = {};
      for (const course of courses) {
        const lessons = await db.getLessonsByCourse(course.id);
        const levels = await db.getLevelsByCourse(course.id);
        stats[course.id] = {
          total: lessons.length,
          completed: lessons.filter(l => l.completed).length,
          levels: levels.length
        };
      }
      setCourseStats(stats);
    };
    if (courses.length > 0) {
      fetchStats();
    }
  }, [courses]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) {
      await deleteCourse(id);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">دوراتي</h2>
      
      {courses.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Book size={48} className="mx-auto mb-4 opacity-20" />
          <p>لا توجد دورات حالياً. قم بإضافة دورة جديدة للبدء.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => {
            const stats = courseStats[course.id] || { total: 0, completed: 0, levels: 0 };
            const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            
            return (
              <motion.div 
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link 
                  to={`/course/${course.id}`}
                  className="block bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded w-fit">
                        {course.type}
                      </span>
                      <h3 className="font-semibold text-lg">{course.name}</h3>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, course.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Book size={16} />
                      <span>{stats.levels} مستويات</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{stats.total} دروس</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">نسبة الإنجاز</span>
                      <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                    <div className="h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
