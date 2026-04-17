import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, Course, Level, Lesson } from '../lib/db';
import { useStore } from '../store/useStore';
import { ChevronRight, Lock, CheckCircle2, PlayCircle, Clock, Info, Edit2, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, LanguageCode } from '../lib/i18n';

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2] && match[2].length === 11) ? match[2] : null;
};

export const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleLessonCompletion, startLesson, language, updateLevelName, deleteLevel } = useStore();
  const { t } = useTranslation(language as LanguageCode);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [lessonsByLevel, setLessonsByLevel] = useState<Record<string, Lesson[]>>({});
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editLevelName, setEditLevelName] = useState('');
  const [confirmDeleteLevelId, setConfirmDeleteLevelId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{url: string, title: string} | null>(null);

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

  const handleEditLevelClick = (e: React.MouseEvent, level: Level) => {
    e.stopPropagation();
    setEditingLevelId(level.id);
    setEditLevelName(level.name);
  };

  const saveEditLevel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (editLevelName.trim()) {
      await updateLevelName(id, editLevelName.trim());
      await fetchData();
    }
    setEditingLevelId(null);
  };

  const cancelEditLevel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLevelId(null);
  };

  const handleDeleteLevelClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteLevelId(id);
  };

  const confirmDeleteLevel = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteLevel(id);
    setConfirmDeleteLevelId(null);
    await fetchData();
  };

  const cancelDeleteLevel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteLevelId(null);
  };

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
            <ChevronRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />
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
            <div key={level.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Level Header */}
              <button 
                onClick={() => isLevelUnlocked && setExpandedLevel(isExpanded ? null : level.id)}
                className={`w-full p-5 sm:p-6 flex items-center justify-between transition-colors ${!isLevelUnlocked ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${isLevelUnlocked ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                    {isLevelUnlocked ? levelIndex + 1 : <Lock size={20} />}
                  </div>
                  <div className="text-right flex-1">
                    {editingLevelId === level.id ? (
                      <div className="flex items-center gap-2 mb-1" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editLevelName}
                          onChange={(e) => setEditLevelName(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={(e) => saveEditLevel(e, level.id)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
                          <Check size={16} />
                        </button>
                        <button onClick={cancelEditLevel} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-extrabold text-lg sm:text-xl text-slate-800 dark:text-white">{level.name}</h3>
                    )}
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                       <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                      {t('lessonsCompleted', { completed: completedInLevel, total: levelLessons.length })}
                    </div>
                  </div>
                </div>
                {isLevelUnlocked && (
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg">{t('levelCompleted', { progress: levelProgress })}</div>
                    
                    {!editingLevelId && (
                       <div className="hidden sm:flex gap-1">
                          <button 
                            onClick={(e) => handleEditLevelClick(e, level)}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          {confirmDeleteLevelId === level.id ? (
                             <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 rounded-full absolute left-4 z-10" onClick={(e) => e.stopPropagation()}>
                                <span className="text-xs text-red-600 font-bold px-1">حذف؟</span>
                                <button onClick={(e) => confirmDeleteLevel(e, level.id)} className="p-1 text-red-600 hover:bg-red-100 rounded-full">
                                  <Check size={14} />
                                </button>
                                <button onClick={cancelDeleteLevel} className="p-1 text-slate-500 hover:bg-slate-200 rounded-full">
                                  <X size={14} />
                                </button>
                             </div>
                          ) : (
                             <button 
                               onClick={(e) => handleDeleteLevelClick(e, level.id)}
                               className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          )}
                       </div>
                    )}
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 transition-transform ${isExpanded ? '-rotate-90 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : (language === 'ar' ? 'rotate-180' : '')}`}>
                      <ChevronRight size={20} />
                    </div>
                  </div>
                )}
              </button>

              {/* Lessons List */}
              {isExpanded && isLevelUnlocked && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30"
                >
                  <div className="p-4 sm:p-6 space-y-4">
                    {levelLessons.map((lesson, lessonIndex) => {
                      const isUnlocked = lessonIndex === 0 ? isLevelUnlocked : levelLessons[lessonIndex - 1].completed;
                      return (
                        <LessonItem 
                          key={lesson.id} 
                          lesson={lesson} 
                          isUnlocked={isUnlocked} 
                          onToggleComplete={handleToggleCompletion} 
                          onStartLesson={handleStartLesson} 
                          onPlayVideo={(url, title) => setActiveVideo({url, title})}
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

      {/* Video Modal overlay */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center justify-between p-4 sm:p-6 text-white shrink-0">
              <h3 className="font-bold text-lg sm:text-xl truncate ml-4" dir="auto">{activeVideo.title}</h3>
              <button 
                onClick={() => setActiveVideo(null)} 
                className="p-3 bg-white/10 hover:bg-red-500/80 hover:text-white text-slate-300 rounded-full transition-colors focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 w-full flex items-center justify-center p-0 sm:p-6 pb-safe">
              <div className="w-full h-full sm:h-auto sm:aspect-video sm:max-w-6xl relative sm:rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center">
                 <iframe 
                   src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.url)}?autoplay=1&rel=0&modestbranding=1`} 
                   title={activeVideo.title}
                   className="absolute top-0 left-0 w-full h-full border-0 select-none"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LessonItem: React.FC<{ 
  lesson: Lesson; 
  isUnlocked: boolean; 
  onToggleComplete: (l: Lesson) => void; 
  onStartLesson: (l: Lesson) => void; 
  onPlayVideo: (url: string, title: string) => void;
}> = ({ lesson, isUnlocked, onToggleComplete, onStartLesson, onPlayVideo }) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const { language } = useStore();
  const { t } = useTranslation(language as LanguageCode);

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
      setShowWarning(t('warningOpenFirst'));
      setTimeout(() => setShowWarning(null), 4000);
      return;
    }
    if (remainingSeconds > 0) {
      setShowWarning(t('warningStudyTime', { time: formatTime(remainingSeconds) }));
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
    <div className={`p-5 sm:p-6 rounded-[24px] flex flex-col gap-5 transition-all duration-300 ${lesson.completed ? 'bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/5 border border-green-200 dark:border-green-900/40 shadow-sm' : isUnlocked ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg' : 'opacity-60 grayscale border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={handleToggle}
          disabled={!isUnlocked}
          title={!lesson.startedAt ? t('warningOpenFirst') : remainingSeconds > 0 ? t('warningStudyTime', {time: formatTime(remainingSeconds)}) : ''}
          className={`shrink-0 mt-1 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 outline-none focus:ring-4 focus:ring-blue-500/20 ${buttonClasses}`}
        >
          {lesson.completed ? <CheckCircle2 size={24} /> : 
           (lesson.startedAt && remainingSeconds > 0) ? (
             <span className="text-[12px] font-bold tracking-tighter" dir="ltr">{formatTime(remainingSeconds)}</span>
           ) : (
             isUnlocked && lesson.startedAt && remainingSeconds === 0 ? <CheckCircle2 size={24} className="opacity-60" /> : null
           )
          }
        </button>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className={`font-bold text-xl md:text-2xl leading-snug mb-3 ${lesson.completed ? 'text-green-800 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
            {lesson.name}
          </h4>
          <div className="flex items-center gap-2 text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900/50 w-fit px-3 py-1.5 rounded-lg">
            <Clock size={18} />
            <span>{lesson.duration || t('noDuration')}</span>
          </div>
          {showWarning && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 py-3 px-4 text-sm font-semibold rounded-xl text-orange-800 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-900/50 flex items-center gap-2"
            >
              <Info size={18} className="shrink-0" />
              <span>{showWarning}</span>
            </motion.div>
          )}
        </div>

        {!isUnlocked && (
          <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-slate-200/50 dark:bg-slate-700/50 rounded-full text-slate-400">
            <Lock size={20} />
          </div>
        )}
      </div>

      {isUnlocked && lesson.url && (() => {
        const videoId = getYouTubeId(lesson.url);
        return (
          <a 
            href={videoId ? '#' : lesson.url}
            target={videoId ? '_self' : '_blank'}
            rel="noopener noreferrer"
            onClick={(e) => { 
              if (!lesson.startedAt) onStartLesson(lesson); 
              setShowWarning(null); 
              if (videoId) {
                e.preventDefault();
                onPlayVideo(lesson.url, lesson.name);
              }
            }}
            className={`w-full flex items-center justify-center gap-3 py-4 mt-2 font-bold text-lg rounded-2xl transition-all shadow-sm active:scale-[0.98] ${lesson.startedAt ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25'}`}
          >
            <PlayCircle size={26} className={lesson.startedAt ? '' : 'animate-pulse'} />
            <span>{lesson.startedAt ? t('continueViewing') : t('viewLessonNow')}</span>
          </a>
        );
      })()}
    </div>
  );
};
