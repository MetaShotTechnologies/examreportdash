'use client';

import { useState, useEffect } from 'react';

interface TestSelectorProps {
  rollNumber: string;
  onTestSelect: (test: string) => void;
  onBack: () => void;
}

export default function TestSelector({ rollNumber, onTestSelect, onBack }: TestSelectorProps) {
  const [sheets, setSheets] = useState<string[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSheets();
  }, [rollNumber]);

  const fetchSheets = async () => {
    try {
      setLoading(true);
      
      // Fetch both sheets list and attendance status
      const [sheetsResponse, attendanceResponse] = await Promise.all([
        fetch('/api/sheets?action=list'),
        fetch(`/api/sheets?action=check-attendance&rollNumber=${encodeURIComponent(rollNumber)}`)
      ]);

      const sheetsData = await sheetsResponse.json();
      const attendanceData = await attendanceResponse.json();

      if (!sheetsResponse.ok) {
        throw new Error(sheetsData.error || 'Failed to fetch tests');
      }

      setSheets(sheetsData.sheets || []);
      setAttendance(attendanceData.attendance || {});

      // Check if user is absent from all tests
      const allAbsent = Object.values(attendanceData.attendance || {}).every(
        (attended) => attended !== true
      );
      
      if (allAbsent && sheetsData.sheets?.length > 0) {
        setError('You appear absent for all tests. Please contact your college.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#6F73FF] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading available tests...</p>
      </div>
    );
  }

  if (error && sheets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Tests Available
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#3B3F9F] text-white rounded-xl hover:bg-[#2D3180] font-medium transition-colors min-h-[48px]"
          >
            Change Roll Number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
          Select a Test
        </h2>
        <p className="text-gray-600">
          Choose a test to view your results and rankings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {sheets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📝</div>
          <p>No tests available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet, index) => {
            const attended = attendance[sheet] ?? null;
            return (
              <button
                key={sheet}
                onClick={() => onTestSelect(sheet)}
                className="w-full text-left px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-[#6F73FF] hover:bg-[#F8F9FF] transition-all fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                aria-label={`Select ${sheet} test`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F8F9FF] flex items-center justify-center">
                      <span className="text-lg">📊</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-lg">{sheet}</div>
                      <div className="text-sm text-gray-500">
                        {attended !== null 
                          ? (attended ? 'Click to view results' : 'Absent for this test')
                          : 'Loading...'
                        }
                      </div>
                    </div>
                  </div>
                  {attended !== null && (
                    <div className={`text-sm font-medium px-4 py-1.5 rounded-full ${
                      attended 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {attended ? 'Attended' : 'Absent'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="text-[#6F73FF] hover:text-[#3B3F9F] font-medium text-sm"
          aria-label="Change roll number"
        >
          ← Change Roll Number
        </button>
      </div>
    </div>
  );
}
