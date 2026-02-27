import { useState } from 'react';
import { X, User, Key, CheckCircle, AlertCircle, Building2, Globe } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS = {
  TEACHER: 'Teacher',
  SUPERUSER: 'Superuser',
  PARENT_STUDENT: 'Parent / Student',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const UserProfileModal = ({ onClose, onChangePassword }) => {
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const isDirty =
    firstName.trim() !== (user?.firstName || '') ||
    lastName.trim() !== (user?.lastName || '') ||
    email.trim() !== (user?.email || '');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('First name, last name, and email are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authAPI.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      if (res.success) {
        updateUser({ firstName: res.data.firstName, lastName: res.data.lastName, email: res.data.email });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <User size={18} className="text-gray-600" />
            <h2 id="profile-modal-title" className="font-semibold text-gray-800">My Profile</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Personal Information */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Personal Information</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="profile-firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="profile-firstName"
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="profile-lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="profile-lastName"
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                {saved ? (
                  <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                    <CheckCircle size={15} />
                    Saved!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={isLoading || !isDirty}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Professional Details */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Professional Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Role</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Building2 size={13} />
                  School
                </span>
                <span className="text-sm text-gray-800 font-medium text-right max-w-[60%] truncate">
                  {user?.schoolName || <span className="text-gray-400 font-normal">Not assigned</span>}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Globe size={13} />
                  Country
                </span>
                <span className="text-sm text-gray-800 font-medium">
                  {user?.countryName || <span className="text-gray-400 font-normal">—</span>}
                </span>
              </div>
            </div>
          </section>

          {/* Account Details */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Account Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Member since</span>
                <span className="text-sm text-gray-800">{formatDate(user?.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">Email verified</span>
                {user?.emailVerified ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle size={14} />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                    <AlertCircle size={14} />
                    Not verified
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Security */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Security</h3>
            <button
              type="button"
              onClick={onChangePassword}
              className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <Key size={15} className="text-gray-500" />
              Change Password
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
