import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { useCountries, usePublicSchools } from '../hooks/useSchools';
import { ClipboardCheck, BarChart3, FileText } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const getPasswordStrength = (pw) => {
  if (!pw) return null;
  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /\d/.test(pw),
  ];
  const passed = checks.filter(Boolean).length;
  if (passed <= 1) return { level: 'weak', label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' };
  if (passed === 2) return { level: 'fair', label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-600' };
  if (passed === 3) return { level: 'good', label: 'Good', color: 'bg-blue-400', textColor: 'text-blue-600' };
  return { level: 'strong', label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
};

const features = [
  {
    icon: ClipboardCheck,
    title: '170+ Learning Outcomes',
    description: 'Full OECS kindergarten curriculum in one place',
  },
  {
    icon: BarChart3,
    title: 'Student Progress Tracking',
    description: "Monitor every child's growth term by term",
  },
  {
    icon: FileText,
    title: 'Parent-Ready Reports',
    description: 'Generate polished reports with one click',
  },
];

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
  const [googleError, setGoogleError] = useState('');
  const { registerTeacher, loginWithGoogle } = useAuth();

  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: schools = [], isLoading: schoolsLoading } = usePublicSchools(
    formData.countryId ? { countryId: formData.countryId } : {}
  );

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const passwordsMatch = formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!EMAIL_RE.test(formData.email)) {
      setError('Please enter a valid email address');
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

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left panel */}
        <div
          className="lg:w-[60%] w-full bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] p-8 lg:p-12 flex flex-col justify-center"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(85, 139, 47, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(249, 168, 37, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 50%, #1E3A5F 100%)
            `
          }}
        >
          <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-16">
            <div className="mb-8">
              <img src="/images/logo.png" alt="OECS Logo" className="h-20 lg:h-24 object-contain" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              OECS Kindergarten Progress Checklist
            </h1>
            <p className="text-lg text-gray-300">
              Track student progress across the Eastern Caribbean
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:w-[40%] w-full bg-white p-8 lg:p-12 flex items-center justify-center">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Check your inbox!</h2>
            <p className="text-gray-600 text-sm mb-2">
              We've sent a verification link to <strong>{formData.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Click the link in the email to verify your account, then return here to log in.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-sm font-medium text-amber-800">Can't find the email?</p>
              <p className="text-xs text-amber-700 mt-1">
                Check your <strong>spam or junk folder</strong> — it sometimes ends up there. The sender will appear as "OHPC Kindergarten".
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full bg-[#558B2F] text-white py-3 px-4 rounded-lg hover:bg-[#43731F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 font-semibold transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel — branding */}
      <div
        className="lg:w-[45%] w-full bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] p-8 lg:p-12 flex flex-col justify-center"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(85, 139, 47, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(249, 168, 37, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 50%, #1E3A5F 100%)
          `
        }}
      >
        <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto lg:mr-12">
          {/* Logo */}
          <div className="mb-8">
            <img src="/images/logo.png" alt="OECS Logo" className="h-20 lg:h-24 object-contain" />
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            OECS Kindergarten Progress Checklist
          </h1>
          <p className="text-lg text-gray-300 mb-10">
            Create your teacher account to get started
          </p>

          {/* Feature cards */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-[#558B2F] rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-[55%] w-full bg-white p-8 lg:p-12 flex items-start justify-center overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Create Account</h2>
            <p className="text-gray-600">Fill in your details to register as a teacher</p>
          </div>

          {/* Google sign-up */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={async ({ credential }) => {
                setGoogleError('');
                const result = await loginWithGoogle(credential);
                if (!result.success) {
                  setGoogleError(result.message || 'Google sign-in failed');
                }
                // On success, AuthContext sets the user and App.jsx redirects automatically
              }}
              onError={() => setGoogleError('Google sign-in was cancelled or failed')}
              width="100%"
              text="signup_with"
              shape="rectangular"
              theme="outline"
            />
            {googleError && (
              <p className="mt-2 text-sm text-red-600">{googleError}</p>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or register with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-shadow"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-shadow"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-shadow"
                placeholder="teacher@school.com"
              />
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-shadow"
                  placeholder="Min. 8 characters"
                />
                {passwordStrength && (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-1">
                      {['weak', 'fair', 'good', 'strong'].map((lvl, i) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            ['weak', 'fair', 'good', 'strong'].indexOf(passwordStrength.level) >= i
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.textColor}`}>{passwordStrength.label} password</p>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-shadow"
                  placeholder="Re-enter password"
                />
                {formData.confirmPassword && (
                  <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Country */}
            <div>
              <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Country
              </label>
              <select
                id="countryId"
                name="countryId"
                value={formData.countryId}
                onChange={handleChange}
                disabled={countriesLoading || schoolNotListed}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-shadow"
              >
                <option value="">Select a country...</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>

            {/* School */}
            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent disabled:opacity-50 transition-shadow"
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
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                  {formData.countryId && !schoolsLoading && schools.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 font-medium">No schools registered in this country yet.</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Check "My school is not listed yet" below to register without a school assignment.
                      </p>
                    </div>
                  )}
                </>
              )}

              <label className="flex items-start gap-3 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schoolNotListed}
                  onChange={handleSchoolNotListedToggle}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#558B2F] focus:ring-[#1E3A5F]"
                />
                <div>
                  <span className="text-sm text-gray-700 font-medium">My school is not listed yet</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    You can register without a school. An admin can assign you after your account is verified.
                  </p>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-1">
              <button
                type="button"
                onClick={onBackToLogin}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 font-semibold transition-colors"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#558B2F] text-white py-3 px-4 rounded-lg hover:bg-[#43731F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Organisation of Eastern Caribbean States
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegistration;
