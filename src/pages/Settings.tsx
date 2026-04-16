import { useStore } from '../store/useStore';
import { Moon, Sun, Type, Globe, Info, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const Settings = () => {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize } = useStore();
  const navigate = useNavigate();
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('متصفحك لا يدعم الإشعارات');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      new Notification('تم تفعيل الإشعارات', {
        body: 'سنقوم بتذكيرك بمواعيد دراستك.',
        icon: '/pwa-192x192.png'
      });
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold">الإعدادات</h2>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">المظهر</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-medium">الوضع الليلي</span>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${theme === 'dark' ? 'left-0.5 translate-x-0' : 'right-0.5 translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Type size={20} />
                </div>
                <span className="font-medium">حجم الخط</span>
              </div>
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                <option value="small">صغير</option>
                <option value="medium">متوسط</option>
                <option value="large">كبير</option>
              </select>
            </div>

          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">الإشعارات</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Bell size={20} />
                </div>
                <span className="font-medium">تفعيل الإشعارات</span>
              </div>
              <button 
                onClick={requestNotificationPermission}
                disabled={notificationStatus === 'granted'}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${notificationStatus === 'granted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {notificationStatus === 'granted' ? 'مفعلة' : 'تفعيل'}
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">اللغة</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Globe size={20} />
                </div>
                <span className="font-medium">لغة التطبيق</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">حول</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <Info size={20} />
              </div>
              <div>
                <div className="font-medium">مسار التعلم</div>
                <div className="text-xs text-slate-500">الإصدار 1.0.0</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
