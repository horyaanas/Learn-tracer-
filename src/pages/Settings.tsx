import { useStore } from '../store/useStore';
import { Moon, Sun, Type, Globe, Info, ChevronRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation, LanguageCode } from '../lib/i18n';

export const Settings = () => {
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize, notificationsEnabled, setNotifications, notificationTime, setNotificationTime } = useStore();
  const navigate = useNavigate();
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const { t } = useTranslation(language as LanguageCode);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationStatus(Notification.permission);
      if (Notification.permission !== 'granted') {
        setNotifications(false);
      }
    }
  }, [setNotifications]);

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert(t('browserNotSupported'));
      return;
    }
    
    if (!notificationsEnabled) {
      if (notificationStatus !== 'granted') {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
        if (permission === 'granted') {
          setNotifications(true);
          new Notification(t('notificationsEnabled'), {
            body: t('notificationsBody', { time: notificationTime }),
            icon: '/icon.svg'
          });
        }
      } else {
        setNotifications(true);
        new Notification(t('notificationsEnabled'), {
          body: t('notificationsBody', { time: notificationTime }),
          icon: '/icon.svg'
        });
      }
    } else {
      setNotifications(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ChevronRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>
        <h2 className="text-xl font-bold">{t('settingsTitle')}</h2>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">{t('appearance')}</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-medium">{t('darkMode')}</span>
              </div>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${theme === 'dark' ? (language === 'ar' ? 'left-0.5' : 'translate-x-[24px] left-0.5') : (language === 'ar' ? 'right-0.5' : 'translate-x-0 left-0.5')}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Type size={20} />
                </div>
                <span className="font-medium">{t('fontSizeTitle')}</span>
              </div>
              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                <option value="small">{t('fontSmall')}</option>
                <option value="medium">{t('fontMedium')}</option>
                <option value="large">{t('fontLarge')}</option>
              </select>
            </div>

          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">{t('notificationsTitle')}</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                    <Bell size={20} />
                  </div>
                  <span className="font-medium">{t('notificationsInfo')}</span>
                </div>
                {notificationStatus === 'denied' && (
                  <span className="text-xs text-red-500 pr-12">{t('notificationsBlocked')}</span>
                )}
              </div>
              <button 
                onClick={toggleNotifications}
                className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${notificationsEnabled ? (language === 'ar' ? 'left-0.5' : 'translate-x-[24px] left-0.5') : (language === 'ar' ? 'right-0.5' : 'translate-x-0 left-0.5')}`} />
              </button>
            </div>
            
            <div className={`flex items-center justify-between p-4 transition-opacity ${!notificationsEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="pr-12 text-slate-600 dark:text-slate-400">{t('reminderTime')}</span>
              <input 
                type="time" 
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                disabled={!notificationsEnabled}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none font-sans"
              />
            </div>
          </div>
        </section>

        {/* Language */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 px-2 uppercase tracking-wider">{t('language')}</h3>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <Globe size={20} />
                </div>
                <span className="font-medium">{t('language')}</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
              >
                <option value="ar">{t('arabic')}</option>
                <option value="en">{t('english')}</option>
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
