import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Plus, Settings, LogOut } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState, useEffect } from 'react';
import { ImportModal } from '../course/ImportModal';
import { useTranslation, LanguageCode } from '../../lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const ExitConfirmModal = ({ isOpen, onConfirm, onCancel, t }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void, t: any }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-800 rounded-[28px] shadow-2xl w-full max-w-[320px] overflow-hidden border border-slate-100 dark:border-slate-700"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut size={28} className={t('exit') === 'خروج' ? 'rotate-180' : ''} />
          </div>
          <h2 className="text-xl font-extrabold mb-2 text-slate-800 dark:text-white">{t('exitConfirmTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed px-2">
            {t('exitConfirmDesc')}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all"
            >
              {t('stay')}
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-sm shadow-red-500/30"
            >
              {t('exit')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const Layout = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, language, fontSize } = useStore();
  const { t } = useTranslation(language as LanguageCode);

  const isRtl = language === 'ar';

  useEffect(() => {
    // We only need the dummy state when on the exact Home page, to trap the final exit.
    const isHome = location.pathname === '/';
    const isRootTab = location.pathname === '/courses' || location.pathname === '/settings';

    if (isHome) {
      if (!window.history.state?.appRootDummy) {
        window.history.pushState({ appRootDummy: true }, '', location.pathname);
      }
    } else if (isRootTab) {
      // For other tabs, we also push a dummy so back button can be intercepted to go Home
      if (!window.history.state?.appRootDummy) {
        window.history.pushState({ appRootDummy: true }, '', location.pathname);
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isHome) {
        // Prevent default exit behaviour and show our beautiful modal
        window.history.pushState({ appRootDummy: true }, '', location.pathname);
        setShowExitModal(true);
      } else if (isRootTab) {
        // Go to Home instead of going back through tab history
        navigate('/', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.pathname, navigate]);

  const confirmExit = () => {
    window.history.go(-2);
    setTimeout(() => {
      window.close();
    }, 100);
  };

  return (
    <div 
      className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-200 ${theme} ${isRtl ? 'rtl' : 'ltr'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px' }}
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-10 h-[70px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            م
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 dark:text-white">مسار التعلم</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-blue-600 text-white border-none px-4 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
            aria-label={t('addCourse')}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center pb-safe shrink-0">
        <Link 
          to="/" 
          replace
          className={`flex flex-col items-center py-3 px-6 ${location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Home size={24} className="mb-1" />
          <span className="text-[10px] font-bold">{t('home')}</span>
        </Link>
        <Link 
          to="/courses" 
          replace
          className={`flex flex-col items-center py-3 px-6 ${location.pathname.startsWith('/courses') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <BookOpen size={24} className="mb-1" />
          <span className="text-[10px] font-bold">{t('courses')}</span>
        </Link>
        <Link 
          to="/settings" 
          replace
          className={`flex flex-col items-center py-3 px-6 ${location.pathname === '/settings' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Settings size={24} className="mb-1" />
          <span className="text-[10px] font-bold">{t('settings')}</span>
        </Link>
      </nav>

      {isImportModalOpen && (
        <ImportModal onClose={() => setIsImportModalOpen(false)} />
      )}
      
      <AnimatePresence>
        {showExitModal && (
          <ExitConfirmModal 
            isOpen={showExitModal} 
            onConfirm={confirmExit} 
            onCancel={() => setShowExitModal(false)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
