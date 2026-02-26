import { useAuth } from '../contexts/AuthContext';

const PendingAssignment = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2D4A6F] to-[#1E3A5F] px-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <img src="/images/logo.png" alt="OECS Logo" className="h-16 object-contain mx-auto mb-6" />

        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Welcome, {user?.firstName}!
        </h2>
        <p className="text-gray-600 text-sm mb-1">Your account is active and verified.</p>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <p className="text-amber-800 text-sm font-medium mb-1">Awaiting school assignment</p>
          <p className="text-amber-700 text-sm">
            You haven't been assigned to a school yet. Please contact your school administrator to be added to your school.
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Once your school admin assigns you, log in again to access the system.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#1E3A5F] text-white py-2.5 px-4 rounded-lg hover:bg-[#2D4A6F] font-medium transition-colors text-sm"
          >
            Check Again
          </button>
          <button
            onClick={logout}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 font-medium transition-colors text-sm"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingAssignment;
