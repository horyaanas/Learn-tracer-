import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { parseExcelFile, transformParsedData, ParsedExcelData } from '../../lib/excel';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal = ({ onClose }: ImportModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [courseName, setCourseName] = useState('');
  const [parsedData, setParsedData] = useState<ParsedExcelData[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importCourse = useStore(state => state.importCourse);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setCourseName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
    
    setIsParsing(true);
    try {
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      setStep(2);
    } catch (error) {
      console.error("Failed to parse Excel:", error);
      alert("حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف Excel صالح.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!courseName || parsedData.length === 0) return;
    
    const { course, levels, lessons } = transformParsedData(courseName, parsedData);
    await importCourse(course, levels, lessons);
    setStep(3);
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
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold">إضافة دورة جديدة</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet size={40} />
                </div>
                <h3 className="text-lg font-semibold mb-2">استيراد من Excel</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  قم برفع ملف Excel يحتوي على تفاصيل الدورة (النوع، المستوى، اسم الدرس، الرابط، المدة).
                </p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-70"
                >
                  {isParsing ? (
                    <span className="animate-pulse">جاري القراءة...</span>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>اختيار ملف</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col"
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    اسم الدورة
                  </label>
                  <input 
                    type="text" 
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-medium mb-3 flex items-center justify-between">
                    <span>معاينة البيانات</span>
                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-md">
                      {parsedData.length} درس
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {parsedData.slice(0, 5).map((row, i) => (
                      <div key={i} className="text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <span className="font-medium truncate max-w-[150px]">{row.lessonName}</span>
                        <span className="text-slate-500">{row.level}</span>
                      </div>
                    ))}
                    {parsedData.length > 5 && (
                      <div className="text-center text-xs text-slate-500 pt-2">
                        + {parsedData.length - 5} دروس أخرى...
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    رجوع
                  </button>
                  <button 
                    onClick={handleImport}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    تأكيد الاستيراد
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-lg font-semibold mb-2">تم الاستيراد بنجاح!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  تمت إضافة الدورة إلى مكتبتك.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
