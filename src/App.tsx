/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetails } from './pages/CourseDetails';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';
import { useEffect } from 'react';
import { useTranslation, LanguageCode } from './lib/i18n';

// Setup background notification check
const useNotifications = () => {
  const { notificationsEnabled, notificationTime, language } = useStore();
  const { t } = useTranslation(language as LanguageCode);

  useEffect(() => {
    if (!notificationsEnabled || !notificationTime || !('Notification' in window) || Notification.permission !== 'granted') return;

    const checkTime = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      const lastNotifiedDate = localStorage.getItem('lastNotifiedDate');
      const today = now.toDateString();

      if (currentTime === notificationTime && lastNotifiedDate !== today) {
        new Notification(t('notificationsTitle'), {
          body: t('notificationsBody', { time: notificationTime }),
          icon: '/icon.svg'
        });
        localStorage.setItem('lastNotifiedDate', today);
      }
    };

    const interval = setInterval(checkTime, 60000); // Check every minute
    checkTime(); // Check immediately on mount
    
    return () => clearInterval(interval);
  }, [notificationsEnabled, notificationTime]);
};

export default function App() {
  const { theme, language } = useStore();
  
  useNotifications();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply RTL for Arabic
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.lang = language;
  }, [theme, language]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetails />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}
