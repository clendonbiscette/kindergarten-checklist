import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AppHeader = ({ onMenuToggle, showMenuButton = false, children }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-slate-700 rounded-md text-white"
          >
            <Menu size={20} />
          </button>
        )}
        <img
          src="/images/logo.png"
          alt="OECS Logo"
          className="h-10 w-10 object-contain"
        />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            OHPC Kindergarten Progress Checklist
          </h1>
          <p className="text-xs text-slate-300 hidden sm:block">
            Organisation of Eastern Caribbean States
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-white">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-xs text-slate-300">{user.role?.replace('_', ' ')}</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
