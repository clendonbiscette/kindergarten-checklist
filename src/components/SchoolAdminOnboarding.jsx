import { useState } from 'react';
import { School, Search, MapPin, Phone, Mail, Globe, Plus } from 'lucide-react';
import { useCountries, usePublicSchools } from '../hooks/useSchools';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import apiClient from '../api/client';

const SchoolAdminOnboarding = ({ onComplete }) => {
  const { user } = useAuth();
  const toast = useToast();
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: allSchools = [], isLoading: loadingSchools } = usePublicSchools({});

  // Claim flow state
  const [mode, setMode] = useState('claim'); // 'claim' | 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  // Create flow state
  const [formData, setFormData] = useState({
    name: '',
    countryId: '',
    district: '',
    address: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Filtered schools for claim flow
  const filteredSchools = allSchools.filter(school => {
    const matchesCountry = !selectedCountryId || school.countryId === selectedCountryId;
    const matchesSearch = !searchQuery ||
      school.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCountry && matchesSearch;
  });

  const handleClaim = async (schoolId, schoolName) => {
    setClaimError('');
    setIsClaiming(true);
    try {
      const response = await apiClient.post('/schools/claim-school', { schoolId });
      if (response.success) {
        const notice = response.hasCoAdmin
          ? `You've been added as a co-administrator for ${schoolName}.`
          : `You are now the administrator for ${schoolName}.`;
        toast.success(notice, 'School Claimed');
        onComplete(response.data);
      } else {
        setClaimError(response.message || 'Failed to claim school');
      }
    } catch (err) {
      setClaimError(err.message || 'Failed to claim school');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setIsSubmitting(true);
    try {
      const response = await apiClient.post('/schools/my-school', formData);
      if (response.success) {
        toast.success('School created successfully! Welcome to your dashboard.', 'School Created');
        onComplete(response.data);
      } else {
        setCreateError(response.message || 'Failed to create school');
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create school');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingCountries || loadingSchools) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F]">
        <div className="text-white text-lg">Loading schools...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E3A5F] px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <School size={28} />
            <h1 className="text-xl font-bold">Welcome, {user?.firstName}!</h1>
          </div>
          <p className="text-blue-200 text-sm">
            Find your school below to get started.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('claim')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'claim'
                ? 'border-b-2 border-[#1E3A5F] text-[#1E3A5F]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Find my school
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'border-b-2 border-[#1E3A5F] text-[#1E3A5F]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            School not listed? Create it
          </button>
        </div>

        {/* Claim mode */}
        {mode === 'claim' && (
          <div className="p-6">
            {claimError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {claimError}
              </div>
            )}

            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by school name..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                />
              </div>
              <select
                value={selectedCountryId}
                onChange={e => setSelectedCountryId(e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              >
                <option value="">All countries</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* School list */}
            <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {filteredSchools.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No schools found. Try a different search or{' '}
                  <button
                    onClick={() => setMode('create')}
                    className="text-[#1E3A5F] font-medium hover:underline"
                  >
                    create your school
                  </button>
                  .
                </div>
              ) : (
                filteredSchools.slice(0, 50).map(school => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{school.name}</p>
                      <p className="text-xs text-gray-400">{school.country?.name}</p>
                    </div>
                    <button
                      onClick={() => handleClaim(school.id, school.name)}
                      disabled={isClaiming}
                      className="text-xs bg-[#1E3A5F] text-white px-3 py-1.5 rounded-md hover:bg-[#2D4A6F] transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isClaiming ? 'Claiming...' : 'This is my school'}
                    </button>
                  </div>
                ))
              )}
            </div>
            {filteredSchools.length > 50 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Showing 50 of {filteredSchools.length} results. Use search to narrow down.
              </p>
            )}
          </div>
        )}

        {/* Create mode */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {createError}
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              Only use this if your school is genuinely not in the list.{' '}
              <button type="button" onClick={() => setMode('claim')} className="font-medium underline">
                Search for it first
              </button>
              .
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Globe size={14} /> Country <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.countryId}
                onChange={e => setFormData({ ...formData, countryId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#1E3A5F] focus:outline-none text-sm"
                required
              >
                <option value="">Select your country...</option>
                {countries.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <School size={14} /> School Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Official school name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#1E3A5F] focus:outline-none text-sm"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <MapPin size={14} /> District / Town <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={e => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g., Castries, Roseau, St. George's"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#1E3A5F] focus:outline-none text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Phone size={14} /> Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="School phone"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#1E3A5F] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="School email"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:border-[#1E3A5F] focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1E3A5F] text-white py-3 rounded-lg font-semibold hover:bg-[#2D4A6F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Creating School...' : (
                <><Plus size={18} /> Create School</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SchoolAdminOnboarding;
