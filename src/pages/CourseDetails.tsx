import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, Course, Level, Lesson } from '../lib/db';
import { useStore } from '../store/useStore';
import { ChevronRight, Lock, CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleLessonCompletion, startLesson } = useStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [lessonsByLevel, setLessonsByLevel] = useState<Record<string, Lesson[]>>({});
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await db.getCourse(id);
      if (!c) {
        navigate('/courses');
        return;
      }
      setCourse(c);

      const lvs = await db.getLevelsByCourse(id);
      const sortedLevels = lvs.sort((a, b) => a.order - b.order);
      setLevels(sortedLevels);

      const lessonsMap: Record<string, Lesson[]> = {};
      for (const level of sortedLevels) {
        const lsns = await db.getLessonsByLevel(level.id);
        lessonsMap[level.id] = lsns.sort((a, b) => a.order - b.order);
      }
      setLessonsByLevel(lessonsMap);
      
      // Expand first level by default or first uncompleted level
      if (sortedLevels.length > 0) {
        setExpandedLevel(sortedLevels[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleCompletion = async (lesson: Lesson) => {
    await toggleLessonCompletion(lesson);
    await fetchData(); // Refresh data to update locks
  };

  const handleStartLesson = async (lesson: Lesson) => {
    await startLesson(lesson);
    setLessonsByLevel(prev => {
      const next = { ...prev };
      next[lesson.level] = next[lesson.level].map(l => 
        l.id === lesson.id && !l.startedAt ? { ...l, startedAt: Date.now() } : l
      );
      return next;
    });
  };

  if (loading || !course) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }

  // Calculate progress logic
  let isPreviousLessonCompleted = true; // First lesson is always unlocked

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-4 pt-6 pb-6 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <h1 className="font-bold text-xl truncate">{course.name}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 px-2">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded w-fit">{course.type}</span>
          <span>•</span>
          <span>{levels.length} مستويات</span>
        </div>
      </div>

      {/* Levels List */}
      <div className="p-4 space-y-4 relative z-20">
        {levels.map((level, levelIndex) => {
          const levelLessons = lessonsByLevel[level.id] || [];
          const completedInLevel = levelLessons.filter(l => l.completed).length;
          const levelProgress = levelLessons.length > 0 ? Math.round((completedInLevel / levelLessons.length) * 100) : 0;
          
          // A level is unlocked if it's the first level, or if the previous level is 100% completed
          const isLevelUnlocked = levelIndex === 0 || 
            (lessonsByLevel[levels[levelIndex - 1].id]?.every(l => l.completed) ?? false);

          const isExpanded = expandedLevel === level.id;

          return (
            <div key={level.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {/* Level Header */}
              <button 
                onClick={() => isLevelUnlocked && setExpandedLevel(isExpanded ? null : level.id)}
                className={`w-full p-4 flex items-center justify-between transition-colors ${!isLevelUnlocked ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLevelUnlocked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                    {isLevelUnlocked ? <span className="font-bold">{levelIndex + 1}</span> : <Lock size={18} />}
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold">{level.name}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {completedInLevel} من {levelLessons.length} دروس مكتملة
                    </div>
                  </div>
                </div>
                {isLevelUnlocked && (
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{levelProgress}%</div>
                    <ChevronRight size={20} className={`text-slate-400 transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                  </div>
                )}
              </button>

              {/* Lessons List */}
              {isExpanded && isLevelUnlocked && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20"
                >
                  <div className="p-2 space-y-2">
                    {levelLessons.map((lesson, lessonIndex) => {
                      const isUnlocked = lessonIndex === 0 ? isLevelUnlocked : levelLessons[lessonIndex - 1].completed;
                      return (
                        <LessonItem 
                          key={lesson.id} 
                          lesson={lesson} 
                          isUnlocked={isUnlocked} 
                          onToggleComplete={handleToggleCompletion} 
                          onStartLesson={handleStartLesson} 
                        />
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LessonItem = ({ 
  lesson, 
  isUnlocked, 
  onToggleComplete, 
  onStartLesson 
}: { 
  lesson: Lesson; 
  isUnlocked: boolean; 
  onToggleComplete: (l: Lesson) => void; 
  onStartLesson: (l: Lesson) => void; 
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<string | null>(null);

  // Extract duration: require 10% of lesson time logic, minimum 30 seconds for testability limits
  const durationMatch = lesson.duration ? lesson.duration.match(/\d+/) : null;
  const durationMins = durationMatch ? parseInt(durationMatch[0], 10) : 5;
  const requiredMs = Math.max(30 * 1000, durationMins * 60 * 1000 * 0.1);

  useEffect(() => {
    if (!lesson.startedAt || lesson.completed) return;
    
    const updateTimer = () => {
      const elapsed = Date.now() - lesson.startedAt!;
      const remaining = Math.max(0, requiredMs - elapsed);
      setRemainingSeconds(Math.ceil(remaining / 1000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lesson.startedAt, lesson.completed, requiredMs]);

  const handleToggle = () => {
    if (!isUnlocked) return;
    if (!lesson.startedAt) {
      setShowWarning('لضمان الاستفادة، يرجى فتح الدرس وبدء المذاكرة أولاً.');
      setTimeout(() => setShowWarning(null), 4000);
      return;
    }
    if (remainingSeconds > 0) {
      setShowWarning(`يرجى الاستمرار في دراسة الدرس. يتبقى ${formatTime(remainingSeconds)}`);
      setTimeout(() => setShowWarning(null), 4000);
      return;
    }
    onToggleComplete(lesson);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const buttonClasses = lesson.completed 
    ? 'bg-green-500 border-green-500 text-white' 
    : (isUnlocked && lesson.startedAt && remainingSeconds === 0)
    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/30'
    : (isUnlocked && lesson.startedAt && remainingSeconds > 0)
    ? 'border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-900/30 transition-none'
    : isUnlocked
    ? 'border-slate-300 dark:border-slate-600 hover:border-slate-400'
    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800';

  return (
    <div className={`p-4 xl:p-5 rounded-2xl flex flex-col gap-4 transition-colors ${lesson.completed ? 'bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 shadow-sm' : isUnlocked ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm' : 'opacity-60 grayscale border border-dashed border-slate-300 dark:border-slate-700'}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={handleToggle}
          disabled={!isUnlocked}
          title={!lesson.startedAt ? 'يجب فتح الدرس أولاً' : remainingSeconds > 0 ? 'انتظر انتهاء الوقت' : 'تحديد كمكتمل'}
          className={`shrink-0 mt-1 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-300 outline-none focus:ring-4 focus:ring-blue-500/20 ${buttonClasses}`}
        >
          {lesson.completed ? <CheckCircle2 size={20} /> : 
           (lesson.startedAt && remainingSeconds > 0) ? (
             <span className="text-[11px] font-bold tracking-tighter" dir="ltr">{formatTime(remainingSeconds)}</span>
           ) : (
             isUnlocked && lesson.startedAt && remainingSeconds === 0 ? <CheckCircle2 size={20} className="opacity-60" /> : null
           )
          }
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-lg md:text-xl leading-tight mb-2 ${lesson.completed ? 'text-green-800 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
            {lesson.name}
          </h4>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Clock size={16} />
            <span>{lesson.duration || 'بدون مدة'}</span>
          </div>
          {showWarning && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 py-2 px-3 text-xs md:text-sm font-semibold rounded-lg text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-900/50"
            >
              • {showWarning}
            </motion.div>
          )}
        </div>

        {!isUnlocked && (
          <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 rounded-full text-slate-400">
            <Lock size={18} />
          </div>
        )}
      </div>

      {isUnlocked && lesson.url && (
        <a 
          href={lesson.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { if (!lesson.startedAt) onStartLesson(lesson); setShowWarning(null); }}
          className={`w-full flex items-center justify-center gap-2 py-3 mt-2 font-bold rounded-xl transition-all shadow-sm ${lesson.startedAt ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/50' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'}`}
        >
          <PlayCircle size={22} className={lesson.startedAt ? '' : 'animate-pulse'} />
          <span>{lesson.startedAt ? 'العودة للدرس 🏃‍♂️' : 'بدء الدرس الآن 🚀'}</span>
        </a>
      )}
    </div>
  );
};
