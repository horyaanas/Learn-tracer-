import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db, Course } from '../lib/db';
import { Link } from 'react-router-dom';
import { Book, Clock, ChevronLeft, Trash2, Edit2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation, LanguageCode } from '../lib/i18n';

export const Courses = () => {
  const { courses, loadCourses, deleteCourse, language } = useStore();
  const { t } = useTranslation(language as LanguageCode);
  const [courseStats, setCourseStats] = useState<Record<string, { total: number, completed: number, levels: number }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { updateCourseName } = useStore();

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

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    await deleteCourse(id);
    setConfirmDeleteId(null);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    setConfirmDeleteId(null);
  };

  const handleEditClick = (e: React.MouseEvent, course: Course) => {
    e.preventDefault();
    setEditingId(course.id);
    setEditName(course.name);
  };

  const saveEdit = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (editName.trim()) {
      await updateCourseName(id, editName.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditingId(null);
  };

  return (
    <div className="p-4 space-y-4 pt-1">
      <h2 className="text-xl font-bold mb-4">{t('myCourses')}</h2>
      
      {courses.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Book size={48} className="mx-auto mb-4 opacity-20" />
          <p>{t('emptyCourses')}. {t('emptyCoursesDesc')}</p>
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
                    <div className="flex flex-col gap-1 w-full relative">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded w-fit">
                        {course.type}
                      </span>
                      {editingId === course.id ? (
                        <div className="flex items-center gap-2 mt-1 z-10" onClick={(e) => e.preventDefault()}>
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button onClick={(e) => saveEdit(e, course.id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                            <Check size={16} />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-lg">{course.name}</h3>
                      )}
                    </div>
                    
                    {!editingId && (
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => handleEditClick(e, course)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        {confirmDeleteId === course.id ? (
                          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 rounded-full absolute top-2 left-2 z-10" onClick={(e) => e.preventDefault()}>
                            <span className="text-xs text-red-600 font-bold px-1">تأكيد؟</span>
                            <button onClick={(e) => confirmDelete(e, course.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-full">
                              <Check size={16} />
                            </button>
                            <button onClick={cancelDelete} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-full">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => handleDeleteClick(e, course.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Book size={16} />
                      <span>{stats.levels}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{stats.total}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">{t('progressTtl')}</span>
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
