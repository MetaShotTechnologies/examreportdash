'use client';

import { useState, useEffect } from 'react';

interface StudentData {
  name: string;
  rollNumber: string;
  score: string;
  accuracy: string;
  rank: number | null;
  percentile: number | null;
  totalStudents: number;
  averageQPerHour: string;
  attemptStatus: string;
  rawData: Record<string, string>;
}

interface DashboardProps {
  rollNumber: string;
  testName: string;
  onBack: () => void;
}

export default function Dashboard({ rollNumber, testName, onBack }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [absent, setAbsent] = useState(false);
  const [animatedScore, setAnimatedScore] = useState<string>('0');
  const [animatedRank, setAnimatedRank] = useState<number | null>(null);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const animateValue = (start: number, end: number, duration: number, callback: (val: number) => void) => {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (end - start) * easeOutCubic(progress);
      callback(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    fetchStudentData();
  }, [rollNumber, testName]);

  useEffect(() => {
    if (studentData && !loading) {
      // Reset animations
      setAnimatedScore('0');
      setAnimatedRank(null);
      
      // Animate score count-up
      const scoreParts = studentData.score.toString().split('/');
      const scoreValue = parseInt(scoreParts[0]?.trim() || '0');
      if (scoreValue > 0) {
        animateValue(0, scoreValue, 800, (val) => setAnimatedScore(Math.round(val).toString()));
      } else {
        setAnimatedScore(scoreValue.toString());
      }

      // Animate rank count-up
      if (studentData.rank !== null && studentData.rank > 0) {
        animateValue(0, studentData.rank, 800, (val) => setAnimatedRank(Math.round(val)));
      } else if (studentData.rank !== null) {
        setAnimatedRank(studentData.rank);
      }
    }
  }, [studentData, loading]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/sheets?action=get&sheet=${encodeURIComponent(testName)}&rollNumber=${encodeURIComponent(rollNumber)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data');
      }

      if (!data.found) {
        setAbsent(true);
        setStudentData(null);
      } else {
        setAbsent(false);
        setStudentData(data.student);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-[#6F73FF] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
        <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-[#3B3F9F] text-white rounded-xl hover:bg-[#2D3180] font-medium transition-colors min-h-[48px]"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (absent) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 fade-in">
        <button
          onClick={onBack}
          className="text-[#6F73FF] hover:text-[#3B3F9F] font-medium mb-6 flex items-center gap-2"
          aria-label="Back to test selection"
        >
          <span>←</span> Back to Test Selection
        </button>
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="text-2xl font-bold text-[#1A1A2E] mb-3">
            You did not attempt this test
          </h2>
          <p className="text-gray-600 mb-2">Test: <span className="font-medium">{testName}</span></p>
          <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
            Contact exam cell if you believe this is an error.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-[#3B3F9F] text-white rounded-xl hover:bg-[#2D3180] font-medium transition-colors min-h-[48px]"
            >
              Select Another Test
            </button>
            <button
              onClick={() => {
                // Reset to roll number entry
                window.location.reload();
              }}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors min-h-[48px]"
            >
              Change Roll Number
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  const scoreParts = studentData.score.toString().split('/');
  const scoreValue = scoreParts[0]?.trim() || '0';
  const totalScore = scoreParts[1]?.trim() || '';
  const displayScore = animatedScore && animatedScore !== '0' ? animatedScore : scoreValue;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 fade-in">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-[#6F73FF] hover:text-[#3B3F9F] font-medium mb-4 flex items-center gap-2"
          aria-label="Back to test selection"
        >
          <span>←</span> Back to Test Selection
        </button>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-1">
              {studentData.name || 'Student'}
            </h2>
            <p className="text-gray-600">
              <span className="font-medium">Test:</span> {testName} | <span className="font-medium">Roll Number:</span> {studentData.rollNumber}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            aria-label="Change roll number"
          >
            Change Roll Number
          </button>
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-[#3B3F9F] to-[#6F73FF] rounded-xl p-6 text-white count-up shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Score</div>
            <div className="text-2xl">🎯</div>
          </div>
          <div className="text-4xl md:text-5xl font-bold">
            {displayScore}
            {totalScore && <span className="text-2xl md:text-3xl opacity-90">/{totalScore}</span>}
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white count-up shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Accuracy</div>
            <div className="text-2xl">✓</div>
          </div>
          <div className="text-4xl md:text-5xl font-bold">
            {studentData.accuracy || 'N/A'}
          </div>
        </div>

        {/* Rank Card */}
        {studentData.rank !== null && (
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white count-up shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium opacity-90">Rank</div>
              <div className="text-2xl">🏆</div>
            </div>
            <div className="text-4xl md:text-5xl font-bold">
              {animatedRank !== null ? animatedRank : studentData.rank}
              {studentData.totalStudents > 0 && (
                <span className="text-2xl md:text-3xl opacity-90">/{studentData.totalStudents}</span>
              )}
            </div>
            {studentData.percentile !== null && (
              <div className="text-sm mt-2 opacity-90">
                Top {100 - studentData.percentile}%
              </div>
            )}
          </div>
        )}

        {/* Average Q/hour Card */}
        {studentData.averageQPerHour && (
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-6 text-white count-up shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium opacity-90">Average Q/hour</div>
              <div className="text-2xl">⚡</div>
            </div>
            <div className="text-4xl md:text-5xl font-bold">
              {studentData.averageQPerHour}
            </div>
          </div>
        )}
      </div>

      {/* Attempt Status */}
      {studentData.attemptStatus && (
        <div className="mb-6">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#F8F9FF] border border-[#6F73FF] text-[#3B3F9F]">
            <span className="text-sm font-medium">Status: {studentData.attemptStatus}</span>
          </div>
        </div>
      )}

      {/* Additional Details */}
      {Object.keys(studentData.rawData).filter(key => {
        const excluded = ['Name', 'Student Name', 'Total Score', 'Score', 'Accuracy', 'Accuracy %', 
                         'Average Q/hour', 'Avg Q/hour', 'Attempt Status', 'Status'];
        return !excluded.includes(key) && key !== studentData.rollNumber && studentData.rawData[key];
      }).length > 0 && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-[#1A1A2E] mb-4">Additional Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(studentData.rawData).map(([key, value]) => {
              const excluded = ['Name', 'Student Name', 'Total Score', 'Score', 'Accuracy', 'Accuracy %', 
                               'Average Q/hour', 'Avg Q/hour', 'Attempt Status', 'Status'];
              if (excluded.includes(key) || key === studentData.rollNumber || !value) {
                return null;
              }
              return (
                <div key={key} className="bg-[#F8F9FF] rounded-lg p-4 border border-gray-100">
                  <div className="text-gray-600 text-xs mb-1 font-medium uppercase tracking-wide">{key}</div>
                  <div className="font-semibold text-gray-900">{value}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
