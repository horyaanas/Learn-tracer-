import * as XLSX from 'xlsx';
import { Course, Level, Lesson } from './db';

export interface ExcelSheet {
  name: string;
  headers: string[];
  rows: any[][];
}

export const readExcelFile = async (file: File): Promise<ExcelSheet[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: ExcelSheet[] = [];
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as any[][];
          if (json.length > 0) {
            const headers = (json[0] || []).map(h => String(h).trim());
            const rows = json.slice(1).filter(r => r && r.some(cell => cell !== undefined && cell !== null && cell !== ''));
            if (rows.length > 0) {
                sheets.push({ name: sheetName, headers, rows });
            }
          }
        }
        resolve(sheets);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const transformParsedData = (
  courseId: string,
  courseName: string,
  courseType: string,
  mappedData: {
    sheetName: string;
    lessonName: string;
    lessonUrl: string;
    duration: string;
    level: string;
  }[]
): { course: Course | null, levels: Level[], lessons: Lesson[] } => {
  const isNewCourse = !Array.isArray(courseId) && courseId.startsWith('new_');
  const actualCourseId = isNewCourse ? crypto.randomUUID() : courseId;
  
  let course: Course | null = null;
  if (isNewCourse) {
    course = {
      id: actualCourseId,
      name: courseName,
      type: courseType || 'عام',
      createdAt: Date.now(),
    };
  }

  const levelsMap = new Map<string, Level>();
  const lessons: Lesson[] = [];

  let levelOrder = 0;
  let lessonOrder = 0;

  mappedData.forEach(row => {
    // If level column wasn't mapped, fallback to sheet name
    const levelName = String(row.level || row.sheetName).trim() || 'مستوى عام';
    
    // We create levels on the fly. 
    // Notice: if we add to an existing course, we don't fetch its levels here. 
    // This is fine, we just add new levels if they don't share IDs. 
    // Ideally, we'd reuse existing levels but this suffices for a simple import.
    if (!levelsMap.has(levelName)) {
      levelsMap.set(levelName, {
        id: crypto.randomUUID(),
        courseId: actualCourseId,
        name: levelName,
        order: levelOrder++,
      });
    }

    const level = levelsMap.get(levelName)!;

    lessons.push({
      id: crypto.randomUUID(),
      courseId: actualCourseId,
      level: level.id,
      name: String(row.lessonName).trim(),
      url: String(row.lessonUrl || '').trim(),
      duration: String(row.duration || '').trim(),
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
