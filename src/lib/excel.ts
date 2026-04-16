import * as XLSX from 'xlsx';
import { Course, Level, Lesson } from './db';

export interface ParsedExcelData {
  courseType: string;
  level: string;
  lessonName: string;
  lessonUrl: string;
  duration: string;
}

export const parseExcelFile = async (file: File): Promise<ParsedExcelData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Assuming the first sheet for now, or we could let the user choose
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (json.length < 2) {
          throw new Error('File is empty or has no data rows');
        }

        // Try to auto-detect columns based on common Arabic/English names
        const headers = json[0].map(h => String(h).toLowerCase().trim());
        
        const colMap = {
          courseType: headers.findIndex(h => h.includes('نوع') || h.includes('type') || h.includes('دورة')),
          level: headers.findIndex(h => h.includes('مستوى') || h.includes('level')),
          lessonName: headers.findIndex(h => h.includes('درس') || h.includes('name') || h.includes('عنوان')),
          lessonUrl: headers.findIndex(h => h.includes('رابط') || h.includes('url') || h.includes('link')),
          duration: headers.findIndex(h => h.includes('مدة') || h.includes('وقت') || h.includes('duration') || h.includes('time')),
        };

        // If auto-detect fails for essential columns, we might need manual mapping. 
        // For simplicity in this demo, we'll assume a specific order if not found, or just take what we can.
        // Let's assume user maps them in UI, but here we provide a best guess.
        
        const parsedData: ParsedExcelData[] = [];
        
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          if (!row || row.length === 0) continue;
          
          parsedData.push({
            courseType: colMap.courseType >= 0 ? row[colMap.courseType] || '' : row[0] || '',
            level: colMap.level >= 0 ? row[colMap.level] || '' : row[1] || '',
            lessonName: colMap.lessonName >= 0 ? row[colMap.lessonName] || '' : row[2] || '',
            lessonUrl: colMap.lessonUrl >= 0 ? row[colMap.lessonUrl] || '' : row[3] || '',
            duration: colMap.duration >= 0 ? row[colMap.duration] || '' : row[4] || '',
          });
        }
        
        resolve(parsedData.filter(d => d.lessonName)); // Filter out empty rows
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const transformParsedData = (
  courseName: string, 
  data: ParsedExcelData[]
): { course: Course, levels: Level[], lessons: Lesson[] } => {
  const courseId = crypto.randomUUID();
  
  const course: Course = {
    id: courseId,
    name: courseName,
    type: data[0]?.courseType || 'عام',
    createdAt: Date.now(),
  };

  const levelsMap = new Map<string, Level>();
  const lessons: Lesson[] = [];

  let levelOrder = 0;
  let lessonOrder = 0;

  data.forEach(row => {
    const levelName = String(row.level).trim() || 'مستوى عام';
    
    if (!levelsMap.has(levelName)) {
      levelsMap.set(levelName, {
        id: crypto.randomUUID(),
        courseId,
        name: levelName,
        order: levelOrder++,
      });
    }

    const level = levelsMap.get(levelName)!;

    lessons.push({
      id: crypto.randomUUID(),
      courseId,
      level: level.id,
      name: String(row.lessonName).trim(),
      url: String(row.lessonUrl).trim(),
      duration: String(row.duration).trim(),
      completed: false,
      order: lessonOrder++,
    });
  });

  return {
    course,
    levels: Array.from(levelsMap.values()),
    lessons
  };
};
