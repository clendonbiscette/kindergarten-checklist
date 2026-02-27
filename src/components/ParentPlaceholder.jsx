import { GraduationCap, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ParentPlaceholder = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E3A5F] px-8 py-6 text-white text-center">
          <GraduationCap size={40} className="mx-auto mb-3 text-blue-200" />
          <h1 className="text-xl font-bold">Parent / Guardian Access</h1>
        </div>

        {/* Body */}
        <div className="p-8 text-center space-y-4">
          <p className="text-gray-700 text-base">
            Welcome, <span className="font-semibold">{user?.firstName}</span>.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your child&apos;s progress report is prepared and shared directly by their teacher. You do not need to log in — simply ask your child&apos;s teacher for a copy of the latest report.
          </p>
          <div className="pt-4">
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2D4A6F] transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPlaceholder;
