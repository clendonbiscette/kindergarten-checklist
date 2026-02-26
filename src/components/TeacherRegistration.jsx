import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCountries, usePublicSchools } from '../hooks/useSchools';

const TeacherRegistration = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryId: '',
    schoolId: '',
  });
  const [schoolNotListed, setSchoolNotListed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { registerTeacher } = useAuth();

  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: schools = [], isLoading: schoolsLoading } = usePublicSchools(
    formData.countryId ? { countryId: formData.countryId } : {}
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset school when country changes
      ...(name === 'countryId' && { schoolId: '' })
    }));
  };

  const handleSchoolNotListedToggle = (e) => {
    setSchoolNotListed(e.target.checked);
    if (e.target.checked) {
      setFormData(prev => ({ ...prev, schoolId: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!schoolNotListed && !formData.schoolId) {
      setError('Please select your school or check "My school is not listed yet"');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const result = await registerTeacher({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      schoolId: schoolNotListed ? undefined : formData.schoolId,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <img src="/images/logo.png" alt="OECS Logo" className="h-16 object-contain mx-auto mb-6" />
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Check your inbox!</h2>
          <p className="text-gray-600 text-sm mb-2">
            We've sent a verification link to <strong>{formData.email}</strong>.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Click the link in the email to verify your account, then return here to log in.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-sm font-medium text-amber-800">Can&apos;t find the email?</p>
            <p className="text-xs text-amber-700 mt-1">
              Check your <strong>spam or junk folder</strong> — it sometimes ends up there. The sender will appear as &ldquo;OHPC Kindergarten&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full bg-[#7CB342] text-white py-3 px-4 rounded-lg hover:bg-[#689F38] font-semibold transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Teacher Registration
          </h1>
          <p className="text-gray-600">Join the OHPC Kindergarten Assessment System</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
          This form is for <strong>classroom teachers only</strong>. If you are a school administrator or country official, please contact your administrator to have your account created for you.
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
                placeholder="John"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
              placeholder="teacher@school.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
                placeholder="Min. 8 characters"
              />
              <p className="text-xs text-gray-500 mt-1">Must include uppercase, lowercase, and a number</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342]"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div>
            <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              id="countryId"
              name="countryId"
              value={formData.countryId}
              onChange={handleChange}
              disabled={countriesLoading || schoolNotListed}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342] disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">Select a country...</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-2">
              School {schoolNotListed ? '' : '*'}
            </label>
            {!schoolNotListed && (
              <>
                <select
                  id="schoolId"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  disabled={!formData.countryId || schoolsLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7CB342] disabled:opacity-50"
                >
                  <option value="">
                    {!formData.countryId
                      ? 'Select a country first...'
                      : schoolsLoading
                        ? 'Loading schools...'
                        : schools.length === 0
                          ? 'No schools registered yet'
                          : 'Select a school...'}
                  </option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {formData.countryId && !schoolsLoading && schools.length === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>No schools registered in this country yet.</strong>
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Check "My school is not listed yet" below to register without a school assignment.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* "My school is not listed yet" toggle */}
            <label className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={schoolNotListed}
                onChange={handleSchoolNotListedToggle}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#7CB342] focus:ring-[#7CB342]"
              />
              <div>
                <span className="text-sm text-gray-700 font-medium">My school is not listed yet</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  You can register without a school. A school admin can assign you after your account is verified.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#7CB342] text-white py-2 px-4 rounded-md hover:bg-[#689F38] focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registering...' : 'Register as Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherRegistration;
