import { google } from 'googleapis';

// Initialize Google Sheets API client
export async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  return sheets;
}

// Get all sheet names (tabs) from the spreadsheet
export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return response.data.sheets?.map((sheet) => sheet.properties?.title || '') || [];
}

// Get all data from a specific sheet
export async function getSheetData(spreadsheetId: string, sheetName: string) {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return response.data.values || [];
}

// Normalize roll number for matching (handles formats like "OPEN183" or "OPEN183@user")
export function normalizeRollNumber(rollNumber: string): string {
  return rollNumber.trim().toUpperCase();
}

// Find student data by roll number
export function findStudentByRollNumber(
  data: string[][],
  rollNumber: string
): { row: string[]; index: number } | null {
  if (!data || data.length === 0) return null;

  const normalizedRoll = normalizeRollNumber(rollNumber);
  const headerRow = data[0];

  // Find the roll number column (usually column A, index 0)
  const rollNumberIndex = 0;

  // Search through rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[rollNumberIndex]) continue;

    const cellValue = normalizeRollNumber(row[rollNumberIndex]);
    
    // Check if roll number matches (handles formats like "OPEN183" or "OPEN183@user")
    if (cellValue === normalizedRoll || cellValue.startsWith(normalizedRoll + '@')) {
      return { row, index: i };
    }
  }

  return null;
}

// Calculate rank based on total score
export function calculateRank(
  data: string[][],
  studentRowIndex: number,
  scoreColumnIndex: number
): number {
  if (!data || data.length < 2) return 1;

  const scores: Array<{ score: number; index: number }> = [];

  // Extract all scores (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[scoreColumnIndex]) continue;

    const scoreStr = row[scoreColumnIndex].toString().trim();
    // Handle scores in "9/15" format - extract the numerator (actual score)
    let score: number;
    if (scoreStr.includes('/')) {
      const parts = scoreStr.split('/');
      score = parseFloat(parts[0]?.trim() || '0');
    } else {
      score = parseFloat(scoreStr);
    }

    if (!isNaN(score)) {
      scores.push({ score, index: i });
    }
  }

  // Sort by score descending, then by accuracy if available
  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tiebreaker: use accuracy if available (assuming it's in a later column)
    // For now, just use index as tiebreaker
    return a.index - b.index;
  });

  // Find rank (1-indexed)
  const rank = scores.findIndex((item) => item.index === studentRowIndex) + 1;
  return rank || scores.length;
}

// Parse student data from row
export function parseStudentData(row: string[], headers: string[]) {
  const data: Record<string, string> = {};
  
  headers.forEach((header, index) => {
    data[header] = row[index] || '';
  });

  return data;
}

