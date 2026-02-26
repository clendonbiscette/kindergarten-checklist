import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePublicSchools, useCountries } from '../hooks/useSchools';

const PendingAssignment = () => {
  const { user, logout, assignSchool, refreshUser } = useAuth();
  const { data: countries = [] } = useCountries();
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const { data: allSchools = [] } = usePublicSchools({});

  const filteredSchools = allSchools.filter(s => {
    const matchesCountry = !selectedCountryId || s.countryId === selectedCountryId;
    const matchesSearch = !schoolSearch || s.name.toLowerCase().includes(schoolSearch.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const handleAssign = async () => {
    if (!selectedSchoolId) return;
    setError('');
    setIsAssigning(true);
    try {
      const result = await assignSchool(selectedSchoolId);
      if (!result.success) {
        setError(result.message || 'Failed to assign school. Please try again.');
      }
      // On success, AuthContext updates user state → App.jsx re-renders with new schoolId
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCheckAgain = async () => {
    setIsChecking(true);
    setError('');
    try {
      const result = await refreshUser();
      if (!result.success || !result.user?.schoolId) {
        setError('Still no school assignment found. You can select your school below.');
      }
      // If refreshUser finds a schoolId, user state updates → App.jsx re-renders automatically
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <img src="/images/logo.png" alt="OECS Logo" className="h-16 object-contain mx-auto mb-6" />

          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">
            Welcome, {user?.firstName}!
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">Your account is active and verified.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* School picker */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700">Select your school to get started:</p>

            <select
              value={selectedCountryId}
              onChange={e => { setSelectedCountryId(e.target.value); setSelectedSchoolId(''); setSchoolSearch(''); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
            >
              <option value="">All countries</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <input
              type="text"
              value={schoolSearch}
              onChange={e => { setSchoolSearch(e.target.value); setSelectedSchoolId(''); }}
              placeholder="Type to search for your school..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
            />

            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              size={filteredSchools.length > 0 && schoolSearch ? Math.min(filteredSchools.length + 1, 6) : undefined}
            >
              <option value="">
                {filteredSchools.length === 0 ? 'No schools match your search' : `${filteredSchools.length} school${filteredSchools.length !== 1 ? 's' : ''} found — select yours`}
              </option>
              {filteredSchools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={!selectedSchoolId || isAssigning}
              className="w-full bg-[#1E3A5F] text-white py-2.5 px-4 rounded-lg hover:bg-[#2D4A6F] font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? 'Assigning...' : 'Assign me to this school'}
            </button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-xs text-gray-400 text-center mb-2">
              Already been assigned by an administrator?
            </p>
            <button
              onClick={handleCheckAgain}
              disabled={isChecking}
              className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Check Again'}
            </button>
            <button
              onClick={logout}
              className="w-full text-gray-400 py-2 px-4 rounded-lg hover:text-gray-600 font-medium transition-colors text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingAssignment;
