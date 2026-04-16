import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db, Lesson, Course } from '../lib/db';
import { PlayCircle, Award, BookOpen, Search, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Home = () => {
  const { courses, loadCourses } = useStore();
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
    <div className="p-4 md:p-0 space-y-6 md:grid md:grid-cols-[320px_1fr] md:gap-6 md:space-y-0">
      {/* Stats Panel */}
      <div className="flex flex-col gap-5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700"
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">الدورات التدريبية</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCourses}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {stats.completedLessons} دروس مكتملة
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700"
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">إجمالي التقدم</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{overallProgress}%</div>
          <div className="flex items-center gap-4 mt-3">
            <div className="h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full flex-grow overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-bl from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 flex-grow"
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">نشاط التعلم</div>
          <div className="font-semibold text-base mb-2">استمر في التقدم!</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            لقد أكملت {stats.completedLessons} من أصل {stats.totalLessons} درساً متاحاً.
          </div>
        </motion.div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث عن درس أو دورة..." 
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm"
          />
        </div>

        {/* Upcoming Lessons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">الدروس القادمة</h2>
            {upcomingLessons.length > 0 && (
              <Link to="/courses" className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer">
                عرض الكل
              </Link>
            )}
          </div>

          {upcomingLessons.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-md">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <PlayCircle size={32} />
              </div>
              <h3 className="font-medium mb-1">لا يوجد دروس قادمة</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                قم بإضافة دورة جديدة للبدء في التعلم.
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
                        {lesson.duration || 'غير محدد'}
                      </span>
                    </div>
                    
                    <span className="font-bold text-lg mt-1">{lesson.name}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      المستوى {lesson.level}
                    </span>
                  </div>

                  <Link 
                    to={`/course/${course.id}`}
                    className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white border-none py-3 rounded-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle size={18} />
                    متابعة التعلّم
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
