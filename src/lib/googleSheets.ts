/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GradeSubject, SemesterGPA } from '../types';

const API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper to make Google Sheets API requests
async function sheetsApiCall(
  spreadsheetId: string,
  endpoint: string,
  token: string,
  options: RequestInit = {}
) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}/${spreadsheetId}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Sheets API Error on ${endpoint}:`, errorText);
    if (response.status === 401) {
      localStorage.removeItem('tlk_google_access_token');
      throw new Error('GOOGLE_AUTH_401');
    }
    throw new Error(`Google Sheets API Error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Convert string with comma decimal separator to JS float
function parseVietnameseFloat(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const str = String(val).trim().replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

// Convert JS float to Vietnamese string format (e.g. 8.5 -> "8,5")
function formatVietnameseFloat(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '';
  return String(val).replace('.', ',');
}

// Fetch grades data from Google Sheets (A2:M100)
export async function fetchGradesFromGoogle(
  spreadsheetId: string,
  token: string
): Promise<{ 
  subjects: GradeSubject[]; 
  semesterGpaList: SemesterGPA[]; 
  cpaOverall: number;
  passedCredits: number;
  totalCredits: number;
}> {
  try {
    // Read range A2:M100 which covers subjects and GPA/CPA summary starting from row 2
    const data = await sheetsApiCall(spreadsheetId, '/values/A2:M100', token);
    const rows: string[][] = data.values || [];

    const subjects: GradeSubject[] = [];
    const semesterGpaList: SemesterGPA[] = [];

    // Parse CPA Overall from cell M4 or L4 (row 4 -> rows[2] in A2 range)
    const cpaOverall = rows[2] && rows[2][12] ? parseVietnameseFloat(rows[2][12]) : (rows[2] && rows[2][11] ? parseVietnameseFloat(rows[2][11]) : 0);

    // Parse J27 (passed credits X) and K27 (total credits Y) -> index 25 in A2 range
    let passedCredits = 0;
    let totalCredits = 0;

    if (rows[25]) {
      passedCredits = parseVietnameseFloat(rows[25][9]);
      totalCredits = parseVietnameseFloat(rows[25][10]);
    }

    // Fallback: If rows[25] is empty, search rows 20 to 35 for row containing credits
    if (passedCredits === 0 && totalCredits === 0) {
      for (let r = 20; r < Math.min(rows.length, 35); r++) {
        const valJ = parseVietnameseFloat(rows[r]?.[9]);
        const valK = parseVietnameseFloat(rows[r]?.[10]);
        if (valJ > 0 || valK > 0) {
          passedCredits = valJ;
          totalCredits = valK;
          break;
        }
      }
    }

    rows.forEach((row, index) => {
      const lineNum = index + 2; // Row number in sheet (starts at row 2)

      // 1. Parse Subject Gradebook (Columns A to H)
      const semester = row[0]?.trim() || '';
      const name = row[1]?.trim() || '';
      const credits = parseInt(row[2]?.trim() || '0', 10);
      const processWeight = parseVietnameseFloat(row[3]);
      const processScore = parseVietnameseFloat(row[4]);
      const finalScore = parseVietnameseFloat(row[5]);
      const letterGrade = row[6]?.trim() || '';
      const gpaScale4 = parseVietnameseFloat(row[7]);

      // Only import row as a subject if it has a valid semester and name
      if (semester && name) {
        subjects.push({
          id: `grade_subj_${lineNum}_${Math.random().toString(36).substr(2, 5)}`,
          semester,
          name,
          credits: isNaN(credits) ? 0 : credits,
          processWeight,
          processScore,
          finalScore,
          letterGrade,
          gpaScale4
        });
      }

      // 2. Parse Semester Summary table starting at Row 4 (index 2):
      // - Column J (index 9): Semester name (e.g. 2024.1, starting at J4)
      // - Column K (index 10): Total credits per semester starting at K4
      // - Column L (index 11): Semester GPA starting at L4
      // - Column M (index 12): CPA per semester
      if (index >= 2 && index <= 50) {
        const semName = row[9]?.trim() || '';
        const semCredits = parseVietnameseFloat(row[10]); // Column K (index 10) starting from K4
        const gpa = parseVietnameseFloat(row[11]);        // Column L (index 11) starting from L4
        const cpa = row[12] ? parseVietnameseFloat(row[12]) : 0;

        // Strictly check if semName matches a valid semester pattern (e.g., 2024.1, 2024.2)
        const isSemesterName = /^\d{4}\.\d+$/.test(semName);

        if (semName && isSemesterName && (gpa > 0 || semCredits > 0 || cpa > 0)) {
          semesterGpaList.push({
            semester: semName,
            gpa,
            cpa,
            credits: semCredits
          });
        }
      }
    });

    return { subjects, semesterGpaList, cpaOverall, passedCredits, totalCredits };
  } catch (error) {
    console.error('fetchGradesFromGoogle error:', error);
    throw error;
  }
}

// Clear and update subjects to Google Sheets (Columns A to F)
export async function saveGradesToGoogle(
  spreadsheetId: string,
  token: string,
  subjects: GradeSubject[]
): Promise<boolean> {
  try {
    // 1. Clear Columns A to F from row 2 to 100
    await sheetsApiCall(spreadsheetId, '/values/A2:F100:clear', token, {
      method: 'POST'
    });

    // 2. Prepare 2D values array for writing
    // We format floats using comma decimals (e.g. 0,5) to match Vietnamese Google Sheets locale
    const values = subjects.map(s => [
      s.semester,
      s.name,
      s.credits,
      formatVietnameseFloat(s.processWeight),
      formatVietnameseFloat(s.processScore),
      formatVietnameseFloat(s.finalScore)
    ]);

    if (values.length === 0) return true;

    // 3. Write back values to A2:F{2 + values.length - 1}
    const endRow = 2 + values.length - 1;
    await sheetsApiCall(spreadsheetId, `/values/A2:F${endRow}?valueInputOption=USER_ENTERED`, token, {
      method: 'PUT',
      body: JSON.stringify({
        range: `A2:F${endRow}`,
        majorDimension: 'ROWS',
        values
      })
    });

    return true;
  } catch (error) {
    console.error('saveGradesToGoogle error:', error);
    return false;
  }
}
