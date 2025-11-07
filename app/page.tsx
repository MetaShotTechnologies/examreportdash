'use client';

import { useState } from 'react';
import Dashboard from '@/components/Dashboard';
import TestSelector from '@/components/TestSelector';
import Footer from '@/components/Footer';

export default function Home() {
  const [rollNumber, setRollNumber] = useState('');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [step, setStep] = useState<'rollNumber' | 'test' | 'dashboard'>('rollNumber');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRollNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedRoll = rollNumber.trim();
    
    if (!trimmedRoll) {
      setValidationError('Please enter your roll number');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate roll number by checking if it exists in any test
      const response = await fetch(
        `/api/sheets?action=check-attendance&rollNumber=${encodeURIComponent(trimmedRoll)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate roll number');
      }

      const attendance = data.attendance || {};
      const hasAnyAttendance = Object.values(attendance).some((attended: boolean) => attended);

      if (!hasAnyAttendance) {
        setValidationError('Roll number not found. Please check and try again.');
        setIsValidating(false);
        return;
      }

      // Roll number is valid, proceed to test selection
      setStep('test');
    } catch (err: any) {
      setValidationError(err.message || 'Failed to validate roll number. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestSelect = (test: string) => {
    setSelectedTest(test);
    setStep('dashboard');
  };

  const handleBack = () => {
    if (step === 'dashboard') {
      setStep('test');
      setSelectedTest(null);
    } else if (step === 'test') {
      setStep('rollNumber');
      setValidationError(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF]">
      {/* Roll Number Entry Page - Full Screen Centered Card */}
      {step === 'rollNumber' && (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md fade-in">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
              {/* Logo + Tagline */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="/OG Logo - Final 2.png" 
                    alt="OpenGrad Logo" 
                    className="h-14 w-auto"
                  />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E] mb-2">
                  Welcome to OpenGrad Results
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  Enter your roll number to view your test results
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRollNumberSubmit} className="space-y-6" noValidate>
                <div>
                  <label
                    htmlFor="rollNumber"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Enter your roll number
                  </label>
                  <input
                    type="text"
                    id="rollNumber"
                    value={rollNumber}
                    onChange={(e) => {
                      setRollNumber(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="e.g. OPEN183"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-[#6F73FF] focus:border-[#6F73FF] text-lg transition-all ${
                      validationError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-200'
                    }`}
                    required
                    aria-invalid={validationError ? 'true' : 'false'}
                    aria-describedby={validationError ? 'rollNumber-error' : undefined}
                    disabled={isValidating}
                    autoComplete="off"
                    autoFocus
                  />
                  {validationError && (
                    <p 
                      id="rollNumber-error" 
                      className="mt-2 text-sm text-red-600"
                      role="alert"
                    >
                      {validationError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isValidating}
                  className="w-full bg-[#3B3F9F] hover:bg-[#2D3180] text-white py-3.5 rounded-xl font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <Footer />
          </div>
        </div>
      )}

      {/* Test Selection and Dashboard Pages */}
      {(step === 'test' || step === 'dashboard') && (
        <div className="flex-1 flex flex-col">
          <div className="container mx-auto px-4 py-6 md:py-8 flex-1">
            <div className="max-w-4xl mx-auto">
              {/* Header with Logo */}
              <header className="mb-6 md:mb-8 fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/OG Logo - Final 2.png" 
                      alt="OpenGrad Logo" 
                      className="h-10 w-auto"
                    />
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-[#1A1A2E]">
                        OpenGrad Exam Report
                      </h1>
                      <p className="text-xs md:text-sm text-gray-600">
                        Roll Number: <span className="font-medium">{rollNumber}</span>
                      </p>
                    </div>
                  </div>
                  {step === 'test' && (
                    <button
                      onClick={handleBack}
                      className="text-sm text-[#6F73FF] hover:text-[#3B3F9F] font-medium"
                      aria-label="Change roll number"
                    >
                      Change Roll Number
                    </button>
                  )}
                </div>
              </header>

              {/* Content */}
              <div className="fade-in">
                {step === 'test' && (
                  <TestSelector
                    rollNumber={rollNumber}
                    onTestSelect={handleTestSelect}
                    onBack={handleBack}
                  />
                )}

                {step === 'dashboard' && selectedTest && (
                  <Dashboard
                    rollNumber={rollNumber}
                    testName={selectedTest}
                    onBack={handleBack}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      )}
    </div>
  );
}
