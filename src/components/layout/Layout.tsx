import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Plus, Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useState } from 'react';
import { ImportModal } from '../course/ImportModal';

export const Layout = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const location = useLocation();
  const { theme, language, fontSize } = useStore();

  const isRtl = language === 'ar';

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
            aria-label="إضافة دورة"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">استيراد من Excel</span>
          </button>
          <Link 
            to="/settings"
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Settings size={20} />
          </Link>
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
          className={`flex flex-col items-center py-3 px-6 ${location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <Home size={24} className="mb-1" />
          <span className="text-xs font-medium">الرئيسية</span>
        </Link>
        <Link 
          to="/courses" 
          className={`flex flex-col items-center py-3 px-6 ${location.pathname.startsWith('/courses') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <BookOpen size={24} className="mb-1" />
          <span className="text-xs font-medium">الدورات</span>
        </Link>
      </nav>

      {isImportModalOpen && (
        <ImportModal onClose={() => setIsImportModalOpen(false)} />
      )}
    </div>
  );
};
