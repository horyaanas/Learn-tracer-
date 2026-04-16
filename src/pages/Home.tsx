import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db, Lesson, Course } from '../lib/db';
import { PlayCircle, Award, BookOpen, Search, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation, LanguageCode } from '../lib/i18n';

export const Home = () => {
  const { courses, loadCourses, language } = useStore();
  const { t } = useTranslation(language as LanguageCode);
  const [upcomingLessons, setUpcomingLessons] = useState<{lesson: Lesson, course: Course}[]>([]);
  const [stats, setStats] = useState({ totalCourses: 0, completedLessons: 0, totalLessons: 0 });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    const fetchStatsAndUpcoming = async () => {
      if (courses.length === 0) return;

      let completed = 0;
      let total = 0;
      const upcoming: {lesson: Lesson, course: Course}[] = [];

      for (const course of courses) {
        const lessons = await db.getLessonsByCourse(course.id);
        total += lessons.length;
        
        const completedInCourse = lessons.filter(l => l.completed);
        completed += completedInCourse.length;

        // Find first uncompleted lesson
        const sortedLessons = lessons.sort((a, b) => a.order - b.order);
        const nextLesson = sortedLessons.find(l => !l.completed);
        if (nextLesson) {
          upcoming.push({ lesson: nextLesson, course });
        }
      }

      setStats({
        totalCourses: courses.length,
        completedLessons: completed,
        totalLessons: total
      });
      setUpcomingLessons(upcoming.slice(0, 3)); // Show top 3
    };

    fetchStatsAndUpcoming();
  }, [courses]);

  const overallProgress = stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0;

  return (
    <div className="p-4 md:p-0 space-y-6 flex flex-col pt-1">
      {/* Search Bar - Moved to Top */}
      <div className="relative">
        <input 
          type="text" 
          placeholder={t('searchPlaceholder')} 
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-sm"
        />
        <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${language === 'ar' ? 'left-4' : 'right-4'}`}>
          <Search size={20} />
        </div>
      </div>

      {/* Circular Stats Panel (Single Row) */}
      <div className="flex items-center gap-4 w-full overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        
        {/* Stat 1: Total Courses */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="snap-center shrink-0 w-[140px] h-[140px] bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center p-3"
        >
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
            <BookOpen size={20} />
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white leading-none mb-1">
            {stats.totalCourses}
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('totalCourses')}</div>
        </motion.div>
        
        {/* Stat 2: Progress Ring */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="snap-center shrink-0 w-[140px] h-[140px] bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center relative p-3"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="70" cy="70" r="62" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-700" />
            <circle cx="70" cy="70" r="62" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={389.5} strokeDashoffset={typeof overallProgress === 'number' ? 389.5 - (389.5 * overallProgress) / 100 : 389.5} className="text-blue-500 transition-all duration-1000" />
          </svg>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none">
            {overallProgress}%
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">{t('progress')}</div>
        </motion.div>

        {/* Stat 3: Completed Lessons */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="snap-center shrink-0 w-[140px] h-[140px] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-sm flex flex-col items-center justify-center text-center p-3 text-white"
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-1">
            <Award size={20} />
          </div>
          <div className="text-2xl font-bold leading-none mb-1">
            {stats.completedLessons}
          </div>
          <div className="text-xs font-semibold text-blue-100">{t('completedM')}</div>
        </motion.div>

      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-6">

        {/* Upcoming Lessons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{t('upcomingLessons')}</h2>
            {upcomingLessons.length > 0 && (
              <Link to="/courses" className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer">
                {t('viewAll')}
              </Link>
            )}
          </div>

          {upcomingLessons.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <PlayCircle size={32} />
              </div>
              <h3 className="font-medium mb-1">{t('noUpcomingLessons')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('emptyCoursesDesc')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingLessons.map(({ lesson, course }, index) => (
                <motion.div 
                  key={lesson.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded w-fit font-medium">
                        {course.name}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12} />
                        {lesson.duration || t('noDuration')}
                      </span>
                    </div>
                    
                    <span className="font-bold text-lg mt-1">{lesson.name}</span>
                  </div>

                  <Link 
                    to={`/course/${course.id}`}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white border-none py-3 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle size={18} />
                    {t('continueLesson')}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
