import { NextRequest, NextResponse } from 'next/server';
import { getSheetNames, getSheetData, findStudentByRollNumber, calculateRank, parseStudentData } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return NextResponse.json(
      { error: 'GOOGLE_SPREADSHEET_ID not configured' },
      { status: 500 }
    );
  }

  try {
    if (action === 'list') {
      // List all available sheet names (tests)
      const sheetNames = await getSheetNames(spreadsheetId);
      return NextResponse.json({ sheets: sheetNames });
    }

    if (action === 'check-attendance') {
      // Check attendance for a roll number across all sheets
      const rollNumber = searchParams.get('rollNumber');

      if (!rollNumber) {
        return NextResponse.json(
          { error: 'Missing roll number' },
          { status: 400 }
        );
      }

      const sheetNames = await getSheetNames(spreadsheetId);
      const attendanceMap: Record<string, boolean> = {};

      // Check attendance for each sheet
      for (const sheetName of sheetNames) {
        try {
          const data = await getSheetData(spreadsheetId, sheetName);
          if (data && data.length > 0) {
            const studentResult = findStudentByRollNumber(data, rollNumber);
            attendanceMap[sheetName] = studentResult !== null;
          } else {
            attendanceMap[sheetName] = false;
          }
        } catch (err) {
          // If there's an error checking a sheet, mark as not attended
          attendanceMap[sheetName] = false;
        }
      }

      return NextResponse.json({ attendance: attendanceMap });
    }

    if (action === 'get') {
      const sheetName = searchParams.get('sheet');
      const rollNumber = searchParams.get('rollNumber');

      if (!sheetName || !rollNumber) {
        return NextResponse.json(
          { error: 'Missing sheet name or roll number' },
          { status: 400 }
        );
      }

      // Get all data from the sheet
      const data = await getSheetData(spreadsheetId, sheetName);

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Sheet is empty or not found' },
          { status: 404 }
        );
      }

      const headers = data[0];
      
      // Find the student
      const studentResult = findStudentByRollNumber(data, rollNumber);

      if (!studentResult) {
        return NextResponse.json({
          found: false,
          message: 'You were absent for this test.',
        });
      }

      // Parse student data
      const studentData = parseStudentData(studentResult.row, headers);

      // Find score column (look for "Total Score" or similar)
      const scoreColumnIndex = headers.findIndex(
        (h) => h.toLowerCase().includes('total') && h.toLowerCase().includes('score')
      );

      // Calculate rank if score column found
      let rank = null;
      if (scoreColumnIndex >= 0) {
        rank = calculateRank(data, studentResult.index, scoreColumnIndex);
      }

      // Calculate total students
      const totalStudents = data.length - 1; // Exclude header

      // Calculate percentile if rank is available
      // Percentile = percentage of students who scored lower
      // For rank 2/45: (45-2)/45 = 95.56% → "Top 4.44%"
      let percentile = null;
      if (rank !== null && totalStudents > 0) {
        percentile = Math.round(((totalStudents - rank) / totalStudents) * 100);
      }

      return NextResponse.json({
        found: true,
        student: {
          name: studentData['Name'] || studentData['Student Name'] || '',
          rollNumber: studentData[headers[0]] || rollNumber,
          score: studentData['Total Score'] || studentData['Score'] || '',
          accuracy: studentData['Accuracy'] || studentData['Accuracy %'] || '',
          rank,
          percentile,
          totalStudents,
          averageQPerHour: studentData['Average Q/hour'] || studentData['Avg Q/hour'] || '',
          attemptStatus: studentData['Attempt Status'] || studentData['Status'] || '',
          rawData: studentData,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "list", "get", or "check-attendance"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Google Sheets API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data from Google Sheets' },
      { status: 500 }
    );
  }
}

