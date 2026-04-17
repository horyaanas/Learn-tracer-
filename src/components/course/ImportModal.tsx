import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { readExcelFile, transformParsedData, ExcelSheet } from '../../lib/excel';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, LanguageCode } from '../../lib/i18n';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal = ({ onClose }: ImportModalProps) => {
  const { language, courses, importCourse } = useStore();
  const { t } = useTranslation(language as LanguageCode);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedSheets, setParsedSheets] = useState<ExcelSheet[]>([]);
  
  // Selection States
  const [selectedSheetNames, setSelectedSheetNames] = useState<Set<string>>(new Set());
  const [colMapping, setColMapping] = useState<Record<string, {
    lessonName: number;
    lessonUrl: number;
    duration: number;
    level: number;
  }>>({});
  
  // Dest state
  const [destType, setDestType] = useState<'new' | 'existing'>('new');
  const [courseName, setCourseName] = useState('');
  const [courseType, setCourseType] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setCourseName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    
    setIsParsing(true);
    try {
      const sheets = await readExcelFile(selectedFile);
      setParsedSheets(sheets);
      setSelectedSheetNames(new Set(sheets.map(s => s.name)));
      
      // Auto-detect columns for each sheet
      const newMapping: any = {};
      sheets.forEach(sheet => {
        const headers = sheet.headers.map(h => String(h).toLowerCase().trim());
        newMapping[sheet.name] = {
          lessonName: headers.findIndex(h => h.includes('درس') || h.includes('name') || h.includes('عنوان')),
          lessonUrl: headers.findIndex(h => h.includes('رابط') || h.includes('url') || h.includes('link')),
          duration: headers.findIndex(h => h.includes('مدة') || h.includes('وقت') || h.includes('duration') || h.includes('time')),
          level: headers.findIndex(h => h.includes('مستوى') || h.includes('level')),
        };
      });
      setColMapping(newMapping);
      
      setStep(2);
    } catch (error) {
      console.error("Failed to parse Excel:", error);
      alert(t('errorParsing'));
    } finally {
      setIsParsing(false);
    }
  };

  const toggleSheet = (name: string) => {
    setSelectedSheetNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleImport = async () => {
    if (destType === 'new' && !courseName) return;
    if (destType === 'existing' && !selectedCourseId) return;

    // Build the mapped data structure
    const mappedData: any[] = [];
    
    parsedSheets.forEach(sheet => {
      if (!selectedSheetNames.has(sheet.name)) return;
      const map = colMapping[sheet.name];
      
      sheet.rows.forEach(row => {
        const lessonName = map.lessonName >= 0 ? row[map.lessonName] : row[0]; // fallback to first col
        if (!lessonName) return; // Skip empty names
        
        mappedData.push({
          sheetName: sheet.name,
          lessonName: lessonName,
          lessonUrl: map.lessonUrl >= 0 ? row[map.lessonUrl] : '',
          duration: map.duration >= 0 ? row[map.duration] : '',
          level: map.level >= 0 ? row[map.level] : ''
        });
      });
    });

    if (mappedData.length === 0) return;

    const courseIdToUse = destType === 'new' ? `new_${Date.now()}` : selectedCourseId;
    
    const { course, levels, lessons } = transformParsedData(
      courseIdToUse, 
      destType === 'new' ? courseName : '', 
      courseType,
      mappedData
    );
    
    await importCourse(course, levels, lessons);
    
    setStep(4);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500" />
            {t('importWizard')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {step === 1 && (
            <div className="text-center">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-400 group-hover:text-emerald-500" size={32} />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{isParsing ? t('analyzing') : t('uploadHint')}</p>
                  <p className="text-sm text-slate-500 mt-1">{t('excelOnly')}</p>
                </div>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2">تحديد الأوراق (Sheets) والأعمدة</h3>
                <p className="text-sm text-slate-500">قم باختيار الأوراق التي ترغب في استيرادها وعيّن الأعمدة الأساسية لكل منها.</p>
              </div>
              
              <div className="space-y-4">
                {parsedSheets.map(sheet => (
                  <div key={sheet.name} className={`border rounded-xl p-4 transition-colors ${selectedSheetNames.has(sheet.name) ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedSheetNames.has(sheet.name)}
                        onChange={() => toggleSheet(sheet.name)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-lg flex-1">{sheet.name} <span className="text-sm font-normal text-slate-500">({sheet.rows.length} صفوف)</span></span>
                    </div>

                    {selectedSheetNames.has(sheet.name) && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { key: 'lessonName', label: 'اسم الدرس (إلزامي)' },
                          { key: 'lessonUrl', label: 'الرابط' },
                          { key: 'duration', label: 'المدة الزمنية' },
                          { key: 'level', label: 'المستوى (يُفضل)' }
                        ].map(col => (
                          <div key={col.key}>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">{col.label}</label>
                            <select 
                              value={colMapping[sheet.name]?.[col.key as keyof typeof colMapping[string]] ?? -1}
                              onChange={(e) => setColMapping(prev => ({
                                ...prev, 
                                [sheet.name]: { ...prev[sheet.name], [col.key]: parseInt(e.target.value) }
                              }))}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                            >
                              <option value={-1}>-- غير محدد --</option>
                              {sheet.headers.map((h, i) => (
                                <option key={i} value={i}>العمود {i+1}: {h || `بدون عنوان`}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={selectedSheetNames.size === 0}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  التالي: تحديد الوجهة
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                 <h3 className="font-bold text-lg mb-2">وجهة الاستيراد</h3>
                 <p className="text-sm text-slate-500">أين تود إضافة هذه البيانات؟</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button 
                  onClick={() => setDestType('new')}
                  className={`flex-1 p-4 rounded-xl border-2 text-right transition-colors ${destType === 'new' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <div className="font-bold mb-1">مسار/دورة جديدة</div>
                  <div className="text-xs text-slate-500">سيتم إنشاء دورة جديدة بالبيانات، مناسب للملفات المكتملة.</div>
                </button>
                <button 
                  onClick={() => setDestType('existing')}
                  className={`flex-1 p-4 rounded-xl border-2 text-right transition-colors ${destType === 'existing' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  <div className="font-bold mb-1">دورة أو مسار حالي</div>
                  <div className="text-xs text-slate-500">أضف الدروس لدورة موجودة مسبقاً لديك.</div>
                </button>
              </div>

              {destType === 'new' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">اسم الدورة الجديدة</label>
                    <input 
                      type="text" 
                      value={courseName}
                      onChange={e => setCourseName(e.target.value)}
                      placeholder={t('courseNamePlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">نوع الدورة (اختياري)</label>
                    <input 
                      type="text" 
                      value={courseType}
                      onChange={e => setCourseType(e.target.value)}
                      placeholder="برمجة، تصميم، أعمال..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-2">اختر الدورة</label>
                  {courses.length > 0 ? (
                    <select 
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="" disabled>-- الرجاء الاختيار --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-orange-50 text-orange-700 rounded-xl text-sm border border-orange-100">
                      لا توجد دورات حالياً. أضف دورة جديدة أولاً.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={handleImport}
                  disabled={(destType === 'new' && !courseName) || (destType === 'existing' && !selectedCourseId)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {t('startImport')}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 size={40} />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">{t('allSet')}</h3>
              <p className="text-slate-500">{t('courseReady')}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
