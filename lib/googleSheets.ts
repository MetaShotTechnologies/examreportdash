import { google } from 'googleapis';

// Initialize Google Sheets API client
export async function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set');
  }

  if (!privateKey) {
    throw new Error('GOOGLE_PRIVATE_KEY is not set');
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({
      version: 'v4',
      auth, // Pass the GoogleAuth instance directly
    });

    return sheets;
  } catch (error: any) {
    console.error('Error creating Google Auth client:', error);
    throw new Error(`Failed to initialize Google Sheets client: ${error.message}`);
  }
}

// Get all sheet names (tabs) from the spreadsheet
export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    if (!response.data.sheets) {
      return [];
    }

    return response.data.sheets.map((sheet) => sheet.properties?.title || '').filter(Boolean);
  } catch (error: any) {
    console.error('Error getting sheet names:', error);
    if (error.code === 403) {
      throw new Error('Access denied. Please verify the service account has access to the spreadsheet.');
    } else if (error.code === 404) {
      throw new Error('Spreadsheet not found. Please verify the spreadsheet ID is correct.');
    }
    throw new Error(`Failed to get sheet names: ${error.message}`);
  }
}

// Get all data from a specific sheet
export async function getSheetData(spreadsheetId: string, sheetName: string) {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    return response.data.values || [];
  } catch (error: any) {
    console.error(`Error getting data from sheet ${sheetName}:`, error);
    if (error.code === 403) {
      throw new Error(`Access denied to sheet "${sheetName}". Please verify the service account has access.`);
    } else if (error.code === 400) {
      throw new Error(`Sheet "${sheetName}" not found or invalid range.`);
    }
    throw new Error(`Failed to get data from sheet "${sheetName}": ${error.message}`);
  }
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

