import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePublicSchools, useCountries } from '../hooks/useSchools';
import { schoolsAPI } from '../api/schools';

const PendingAssignment = () => {
  const { user, logout, assignSchool, refreshUser } = useAuth();
  const { data: countries = [] } = useCountries();
  const [selectedCountryId, setSelectedCountryId] = useState(user?.countryId || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState('');

  // "Add my school" form state
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCountryId, setNewSchoolCountryId] = useState(user?.countryId || '');
  const [isCreating, setIsCreating] = useState(false);
  const [addSchoolError, setAddSchoolError] = useState('');

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

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setAddSchoolError('');
    if (!newSchoolName.trim()) {
      setAddSchoolError('School name is required.');
      return;
    }
    if (!newSchoolCountryId) {
      setAddSchoolError('Please select a country.');
      return;
    }
    setIsCreating(true);
    try {
      await schoolsAPI.create({ name: newSchoolName.trim(), countryId: newSchoolCountryId });
      // Backend auto-creates UserAssignment — refresh profile to pick up new schoolId
      await refreshUser();
      // App.jsx will re-render automatically once user.schoolId is set
    } catch (err) {
      setAddSchoolError(err.message || 'Failed to create school. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-8">
          <img src="/images/logo.png" alt="OECS Logo" className="h-16 object-contain mx-auto mb-6" />

          <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">
            Welcome, {user?.firstName}!
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">Let's set up your classroom. Which school do you teach at?</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* School picker */}
          <div className="space-y-3 mb-4">
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
              {isAssigning ? 'Setting up...' : 'Start with this school'}
            </button>
          </div>

          {/* Add my school */}
          <div className="border-t pt-4">
            <button
              onClick={() => { setShowAddSchool(!showAddSchool); setAddSchoolError(''); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 py-1 transition-colors"
            >
              {showAddSchool ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              My school isn't listed — add it
            </button>

            {showAddSchool && (
              <form onSubmit={handleCreateSchool} className="mt-3 space-y-3">
                {addSchoolError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {addSchoolError}
                  </div>
                )}
                <select
                  value={newSchoolCountryId}
                  onChange={e => setNewSchoolCountryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                >
                  <option value="">Select country...</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newSchoolName}
                  onChange={e => setNewSchoolName(e.target.value)}
                  placeholder="School name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-[#1E3A5F] text-white py-2.5 px-4 rounded-lg hover:bg-[#2D4A6F] font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Adding school...' : 'Add school & continue'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
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
