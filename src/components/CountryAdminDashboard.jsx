import { useState, useEffect } from 'react';
import {
  Globe, School, Users, GraduationCap, BookOpen,
  LogOut, BarChart3, RefreshCw, MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import AppFooter from './AppFooter';

// OECS brand colours
const NAVY = '#1E3A5F';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'schools',  label: 'Schools',  icon: School },
  { id: 'users',    label: 'Users',    icon: Users },
];

const StatCard = ({ icon: Icon, label, value, iconBg, iconColor, onClick }) => (
  <div
    className={`bg-white rounded-lg shadow-sm p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-lg ${iconBg}`}>
      <Icon size={26} className={iconColor} />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-800">{value ?? '—'}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  </div>
);

const CountryAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/schools/my-country');
      if (res.success) {
        setOverview(res.data);
      } else {
        setError(res.message || 'Failed to load country data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load country data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const countryNames = overview?.countries?.map(c => c.name).join(', ') || '—';

  // ── Tab: Overview ────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Country info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={22} style={{ color: NAVY }} />
          <h2 className="text-lg font-semibold text-gray-800">Assigned Region</h2>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={16} className="text-gray-400" />
          <span className="text-base">{countryNames}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={School}
          label="Schools"
          value={overview?.stats?.totalSchools}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          onClick={() => setActiveTab('schools')}
        />
        <StatCard
          icon={GraduationCap}
          label="Teachers"
          value={overview?.stats?.totalTeachers}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          onClick={() => setActiveTab('users')}
        />
        <StatCard
          icon={BookOpen}
          label="Students"
          value={overview?.stats?.totalStudents}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Users}
          label="School Admins"
          value={overview?.stats?.totalAdmins}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          onClick={() => setActiveTab('users')}
        />
      </div>

      {/* School breakdown by country */}
      {overview?.countries?.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Schools by Country</h3>
          <div className="space-y-3">
            {overview.countries.map(country => {
              const count = overview.schools.filter(s => s.countryId === country.id).length;
              return (
                <div key={country.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{country.name}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {count} {count === 1 ? 'school' : 'schools'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── Tab: Schools ─────────────────────────────────────────────────────────────
  const renderSchools = () => {
    const schools = overview?.schools ?? [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Schools</h2>
          <span className="text-sm text-gray-500">{schools.length} total</span>
        </div>

        {schools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <School size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No schools found in your assigned region.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map(school => (
              <div key={school.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 leading-tight">{school.name}</h3>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded shrink-0">
                      {school.country?.code}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">{school.country?.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-purple-50 rounded p-2">
                      <div className="text-lg font-bold text-purple-700">{school._count?.students ?? 0}</div>
                      <div className="text-xs text-purple-600">Students</div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-lg font-bold text-green-700">{school.teacherCount}</div>
                      <div className="text-xs text-green-600">Teachers</div>
                    </div>
                    <div className="bg-amber-50 rounded p-2">
                      <div className="text-lg font-bold text-amber-700">{school._count?.classes ?? 0}</div>
                      <div className="text-xs text-amber-600">Classes</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Tab: Users ───────────────────────────────────────────────────────────────
  const renderUsers = () => {
    const schools = overview?.schools ?? [];

    // Collect all school admins across schools (deduplicated by name for display)
    const allSchools = schools.map(s => ({
      name: s.name,
      country: s.country?.name,
      adminCount: s.adminCount,
      teacherCount: s.teacherCount,
    }));

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Users by School</h2>

        {allSchools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No schools in your assigned region.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">School</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 hidden sm:table-cell">Country</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Admins</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Teachers</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allSchools.map((school, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">{school.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{school.country}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                        {school.adminCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {school.teacherCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          Detailed user management (creating, editing, deactivating users) is available
          through the system administrator.
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;
    if (error) return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-sm">
        {error}
        <button onClick={fetchOverview} className="ml-4 underline">Retry</button>
      </div>
    );
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'schools':  return renderSchools();
      case 'users':    return renderUsers();
      default:         return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header style={{ backgroundColor: NAVY }} className="px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="OECS Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white">OHPC Kindergarten Progress Checklist</h1>
              <p className="text-xs" style={{ color: '#a8c4e0' }}>{countryNames} — Country Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverview}
              disabled={loading}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-white/80 bg-white/10 px-3 py-1.5 rounded">
              <Users size={16} />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-white/40">|</span>
              <span className="text-white/60">Country Admin</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded text-sm transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto">
          <nav className="flex overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#7CB342] text-[#7CB342]'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
            {/* Reports tab links out to a placeholder message for now */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === 'reports'
                  ? 'border-[#7CB342] text-[#7CB342]'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={17} />
              Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6">
        {activeTab === 'reports' ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Country-level reports coming soon</p>
            <p className="text-sm">Aggregate analytics across all schools in your region will appear here.</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>

      <AppFooter />
    </div>
  );
};

export default CountryAdminDashboard;
