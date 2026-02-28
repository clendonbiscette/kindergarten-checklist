import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/auth';
import { GoogleLogin } from '@react-oauth/google';
import TeacherRegistration from './TeacherRegistration';
import HelpModal from './HelpModal';
import { ClipboardCheck, BookOpen, Star, HelpCircle } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  // Auto-open teacher registration when linked via ?register=teacher
  useEffect(() => {
    if (searchParams.get('register') === 'teacher') {
      setShowRegistration(true);
    }
  }, [searchParams]);

  // Show session-expired message when redirected from an expired session
  useEffect(() => {
    if (sessionStorage.getItem('ohpc-session-expired')) {
      sessionStorage.removeItem('ohpc-session-expired');
      setError('Your session expired. Please sign in again. Any in-progress work was saved as a draft.');
    }
  }, []);

  if (showRegistration) {
    return <TeacherRegistration onBackToLogin={() => setShowRegistration(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setResendSent(false);
    setIsLoading(true);

    const result = await login({ email, password });

    if (!result.success) {
      setError(result.message || 'Login failed. Please try again.');
      // Preserve error code for EMAIL_NOT_VERIFIED handling
      if (result.code) setErrorCode(result.code);
    }

    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await authAPI.resendVerification(email);
      setResendSent(true);
    } catch {
      // Ignore — server always returns 200
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  const features = [
    {
      icon: ClipboardCheck,
      title: '170 Learning Outcomes',
      description: 'Comprehensive curriculum coverage'
    },
    {
      icon: BookOpen,
      title: '4 Core Subjects',
      description: 'Literacy, Mathematics, Science, Social Studies'
    },
    {
      icon: Star,
      title: 'Simple Rating System',
      description: 'Easy +, =, x assessment entry'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div
        className="lg:w-[60%] w-full bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] p-8 lg:p-12 flex flex-col justify-center"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(124, 179, 66, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(249, 168, 37, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 50%, #1E3A5F 100%)
          `
        }}
      >
        <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto lg:mr-16">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/images/logo.png"
              alt="OECS Logo"
              className="h-20 lg:h-24 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            OECS Kindergarten Progress Checklist
          </h1>

          {/* Tagline */}
          <p className="text-lg lg:text-xl text-gray-300 mb-10">
            Track student progress across the Eastern Caribbean
          </p>

          {/* Feature Cards */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-[#7CB342] rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:w-[40%] w-full bg-white p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">Sign in to continue to your dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent transition-shadow"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7CB342] focus:border-transparent transition-shadow"
                placeholder="Enter your password"
              />
            </div>

            {error && errorCode === 'EMAIL_NOT_VERIFIED' ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg space-y-2">
                <p className="font-medium text-sm">{error}</p>
                {resendSent ? (
                  <p className="text-xs text-amber-700">A new verification link has been sent. Check your inbox.</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-xs font-semibold text-amber-900 underline disabled:opacity-50"
                  >
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#558B2F] text-white py-3 px-4 rounded-lg hover:bg-[#43731F] focus:outline-none focus:ring-2 focus:ring-[#558B2F] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="w-full text-center text-sm text-gray-500 hover:text-[#1E3A5F] transition-colors"
            >
              Forgot your password?
            </button>
          </form>

          {/* Google Sign-In */}
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">or</span>
              </div>
            </div>
            <GoogleLogin
              onSuccess={async ({ credential }) => {
                setGoogleError('');
                const result = await loginWithGoogle(credential);
                if (!result.success) setGoogleError(result.message || 'Google sign-in failed');
              }}
              onError={() => setGoogleError('Google sign-in was cancelled or failed')}
              width="368"
              text="continue_with"
              shape="rectangular"
              theme="outline"
            />
            {googleError && (
              <p className="mt-2 text-sm text-red-600">{googleError}</p>
            )}
          </div>

          {/* Registration Link */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New teacher?</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRegistration(true)}
              className="mt-4 w-full bg-white border-2 border-[#1E3A5F] text-[#1E3A5F] py-3 px-4 rounded-lg hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 font-semibold transition-colors"
            >
              Register as New Teacher
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-gray-400 text-sm">Organisation of Eastern Caribbean States</p>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1E3A5F] transition-colors"
            >
              <HelpCircle size={15} />
              Help & FAQs
            </button>
          </div>
        </div>
      </div>

      {showHelp && <HelpModal publicMode onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Login;
