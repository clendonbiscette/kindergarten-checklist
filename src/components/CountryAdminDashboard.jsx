import { useState, useEffect } from 'react';
import {
  Globe, School, Users, GraduationCap, BookOpen,
  LogOut, BarChart3, RefreshCw, MapPin, Plus, X,
  Download, Mail, User, Building2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { reportsAPI } from '../api/reports';
import AppFooter from './AppFooter';

// OECS brand colours
const NAVY = '#1E3A5F';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Globe },
  { id: 'schools',  label: 'Schools',  icon: School },
  { id: 'users',    label: 'Users',    icon: Users },
  { id: 'reports',  label: 'Reports',  icon: BarChart3 },
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

// ── Modal: Create School ──────────────────────────────────────────────────────
const CreateSchoolModal = ({ countries, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', countryId: countries.length === 1 ? countries[0].id : '', district: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/schools', {
        name: form.name,
        countryId: form.countryId,
        address: form.district,
        phone: form.phone || undefined,
        email: form.email || undefined,
      });
      if (res.success) {
        onCreated(res.data);
      } else {
        setError(res.message || 'Failed to create school');
      }
    } catch (err) {
      setError(err.message || 'Failed to create school');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Building2 size={20} style={{ color: NAVY }} /> New School
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {countries.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country <span className="text-red-500">*</span></label>
              <select
                value={form.countryId}
                onChange={e => setForm({ ...form, countryId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                required
              >
                <option value="">Select country...</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {countries.length === 1 && (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Country: <span className="font-medium text-gray-700">{countries[0].name}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Official school name"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">District / Town</label>
            <input
              type="text"
              value={form.district}
              onChange={e => setForm({ ...form, district: e.target.value })}
              placeholder="e.g., Castries, Roseau"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="School phone"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="School email"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {submitting ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Modal: Create School Admin ────────────────────────────────────────────────
const CreateSchoolAdminModal = ({ schools, onClose, onCreated }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', schoolId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.post('/auth/create-school-admin', form);
      if (res.success) {
        setSuccess(`Account created for ${form.firstName} ${form.lastName}. A setup link has been sent to ${form.email}.`);
        setTimeout(() => { onCreated(res.data); }, 2000);
      } else {
        setError(res.message || 'Failed to create school admin');
      }
    } catch (err) {
      setError(err.message || 'Failed to create school admin');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <User size={20} style={{ color: NAVY }} /> New School Administrator
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                placeholder="First name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                placeholder="Last name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Mail size={14} /> Email Address <span className="text-red-500">*</span></span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@school.edu"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to School <span className="text-red-500">*</span></label>
            <select
              value={form.schoolId}
              onChange={e => setForm({ ...form, schoolId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              required
            >
              <option value="">Select school...</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.country ? ` (${s.country.code})` : ''}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-gray-500">
            The administrator will receive an email with a link to set their password and access the system.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!success}
              className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: NAVY }}
            >
              {submitting ? 'Sending invite...' : 'Create & Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CountryAdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  // Reports tab state
  const [reportSchoolId, setReportSchoolId] = useState('');
  const [reportDownloading, setReportDownloading] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/schools/my-country');
      if (res.success) {
        setOverview(res.data);
        // Pre-select first school for reports
        if (res.data.schools?.length > 0 && !reportSchoolId) {
          setReportSchoolId(res.data.schools[0].id);
        }
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

  const handleSchoolCreated = (school) => {
    setShowCreateSchool(false);
    fetchOverview(); // Refresh to include new school
  };

  const handleAdminCreated = () => {
    setShowCreateAdmin(false);
    fetchOverview();
  };

  const handleDownloadReport = async (format) => {
    if (!reportSchoolId) return;
    setReportDownloading(format);
    try {
      const school = overview?.schools?.find(s => s.id === reportSchoolId);
      await reportsAPI.downloadReport(
        'school',
        format,
        { schoolId: reportSchoolId },
        { schoolName: school?.name }
      );
    } catch (err) {
      console.error('Report download failed:', err);
    } finally {
      setReportDownloading('');
    }
  };

  // ── Tab: Overview ──────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={School} label="Schools" value={overview?.stats?.totalSchools} iconBg="bg-blue-100" iconColor="text-blue-600" onClick={() => setActiveTab('schools')} />
        <StatCard icon={GraduationCap} label="Teachers" value={overview?.stats?.totalTeachers} iconBg="bg-green-100" iconColor="text-green-600" onClick={() => setActiveTab('users')} />
        <StatCard icon={BookOpen} label="Students" value={overview?.stats?.totalStudents} iconBg="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={Users} label="School Admins" value={overview?.stats?.totalAdmins} iconBg="bg-amber-100" iconColor="text-amber-600" onClick={() => setActiveTab('users')} />
      </div>

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

  // ── Tab: Schools ────────────────────────────────────────────────────────────
  const renderSchools = () => {
    const schools = overview?.schools ?? [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Schools</h2>
          <button
            onClick={() => setShowCreateSchool(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
          >
            <Plus size={16} /> New School
          </button>
        </div>

        {schools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <School size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No schools found in your assigned region.</p>
            <button
              onClick={() => setShowCreateSchool(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg"
              style={{ backgroundColor: NAVY }}
            >
              <Plus size={16} /> Create First School
            </button>
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

  // ── Tab: Users ──────────────────────────────────────────────────────────────
  const renderUsers = () => {
    const schools = overview?.schools ?? [];
    const allSchools = schools.map(s => ({
      name: s.name,
      country: s.country?.name,
      adminCount: s.adminCount,
      teacherCount: s.teacherCount,
    }));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Users by School</h2>
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: NAVY }}
          >
            <Plus size={16} /> New School Admin
          </button>
        </div>

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
                      <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{school.adminCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{school.teacherCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ── Tab: Reports ────────────────────────────────────────────────────────────
  const renderReports = () => {
    const schools = overview?.schools ?? [];
    const selectedSchool = schools.find(s => s.id === reportSchoolId);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-800">School Reports</h2>

        {schools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No schools in your region yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select School</label>
              <select
                value={reportSchoolId}
                onChange={e => setReportSchoolId(e.target.value)}
                className="w-full max-w-md px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              >
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.country ? ` — ${s.country.name}` : ''}</option>
                ))}
              </select>
            </div>

            {selectedSchool && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{selectedSchool._count?.students ?? 0}</div>
                  <div className="text-xs text-purple-600 mt-1">Students</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-700">{selectedSchool.teacherCount ?? 0}</div>
                  <div className="text-xs text-green-600 mt-1">Teachers</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{selectedSchool._count?.classes ?? 0}</div>
                  <div className="text-xs text-blue-600 mt-1">Classes</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-700">{selectedSchool.adminCount ?? 0}</div>
                  <div className="text-xs text-amber-600 mt-1">Admins</div>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Download School Summary Report</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownloadReport('pdf')}
                  disabled={!reportSchoolId || reportDownloading === 'pdf'}
                  className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: NAVY }}
                >
                  <Download size={16} />
                  {reportDownloading === 'pdf' ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => handleDownloadReport('csv')}
                  disabled={!reportSchoolId || reportDownloading === 'csv'}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-gray-800"
                >
                  <Download size={16} />
                  {reportDownloading === 'csv' ? 'Generating...' : 'Download CSV'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Summary includes student count, class count, and assessment completion rates across all terms.
              </p>
            </div>
          </div>
        )}
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
      case 'reports':  return renderReports();
      default:         return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Modals */}
      {showCreateSchool && (
        <CreateSchoolModal
          countries={overview?.countries ?? []}
          onClose={() => setShowCreateSchool(false)}
          onCreated={handleSchoolCreated}
        />
      )}
      {showCreateAdmin && (
        <CreateSchoolAdminModal
          schools={overview?.schools ?? []}
          onClose={() => setShowCreateAdmin(false)}
          onCreated={handleAdminCreated}
        />
      )}

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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6">
        {renderTabContent()}
      </div>

      <AppFooter />
    </div>
  );
};

export default CountryAdminDashboard;
