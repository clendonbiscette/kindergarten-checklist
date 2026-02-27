import { useState, useMemo } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/auth';

const getPasswordStrength = (pw) => {
  if (!pw) return null;
  const checks = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw)];
  const passed = checks.filter(Boolean).length;
  if (passed <= 1) return { level: 'weak', label: 'Weak', color: 'bg-red-400', textColor: 'text-red-600' };
  if (passed === 2) return { level: 'fair', label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-600' };
  if (passed === 3) return { level: 'good', label: 'Good', color: 'bg-blue-400', textColor: 'text-blue-600' };
  return { level: 'strong', label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
};

const PasswordInput = ({ id, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#7CB342] text-sm"
        required
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

const ChangePasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMatch = confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-gray-600" />
            <h2 id="change-password-title" className="font-semibold text-gray-800">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Lock size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Password changed!</p>
                <p className="text-sm text-gray-500 mt-1">Your password has been updated successfully.</p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-[#558B2F] text-white py-2 rounded-lg font-medium hover:bg-[#43731F] transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
                {strength && (
                  <div className="mt-1.5">
                    <div className="flex gap-1 mb-0.5">
                      {['weak','fair','good','strong'].map((lvl, i) => (
                        <div key={lvl} className={`h-1 flex-1 rounded-full transition-colors ${
                          ['weak','fair','good','strong'].indexOf(strength.level) >= i
                            ? strength.color
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength.textColor}`}>{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
                {confirmPassword && (
                  <p className={`text-xs mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-[#558B2F] text-white py-2 rounded-lg hover:bg-[#43731F] font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
