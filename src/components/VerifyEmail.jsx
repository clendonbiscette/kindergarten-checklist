import { useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const VerifyEmail = () => {
  const token = new URLSearchParams(window.location.search).get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token found.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(response.message || 'Verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err?.message || 'This verification link is invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <img src="/images/logo.png" alt="OECS Logo" className="h-16 object-contain mx-auto mb-6" />

        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CB342] mx-auto"></div>
            <p className="text-gray-600">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-gray-600 text-sm">{message}</p>
            </div>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="w-full bg-[#7CB342] text-white py-3 px-4 rounded-lg hover:bg-[#689F38] font-semibold transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600 text-sm">{message}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { window.location.href = '/'; }}
                className="w-full bg-[#7CB342] text-white py-3 px-4 rounded-lg hover:bg-[#689F38] font-semibold transition-colors"
              >
                Go to Login
              </button>
              <p className="text-sm text-gray-500">
                Link expired?{' '}
                <a href="/" className="text-[#1E3A5F] font-medium hover:underline">
                  Log in to request a new one
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
