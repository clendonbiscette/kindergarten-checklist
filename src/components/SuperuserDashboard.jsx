import { useState, useEffect } from 'react';
import {
  Users, School, BarChart3, LogOut, Search, Plus,
  Edit2, Key, UserX, ChevronDown, ChevronUp, X,
  Shield, UserCheck, Building, Globe, RefreshCw, BookOpen, Upload, Calendar,
  HelpCircle, Send, Loader2, MessageSquare, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCountries } from '../hooks/useSchools';
import {
  useAdminUsers,
  useAdminSchools,
  useAdminStats,
  useCreateUser,
  useUpdateUser,
  useResetUserPassword,
  useDeactivateUser,
  useAssignUserToSchool,
  useCreateSchool,
} from '../hooks/useAdmin';
import { useAllTickets, useTicket, useReplyToTicket, useUpdateTicketStatus } from '../hooks/useSupport';
import ConfirmModal from './ConfirmModal';
import ChangePasswordModal from './ChangePasswordModal';
import AppFooter from './AppFooter';
import SuperuserWelcome from './SuperuserWelcome';
import BulkImportStudents from './BulkImportStudents';
import { useStudents } from '../hooks/useStudents';
import { useTerms, useCreateTerm, useUpdateTerm, useDeleteTerm, useBulkCreateTerms } from '../hooks/useTerms';

const SuperuserDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [currentView, setCurrentView] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAssignSchoolModal, setShowAssignSchoolModal] = useState(false);
  const [showCreateSchoolModal, setShowCreateSchoolModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedSchoolForStudents, setSelectedSchoolForStudents] = useState('');
  const [selectedSchoolForTerms, setSelectedSchoolForTerms] = useState('');
  const [showTermModal, setShowTermModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Support tab state
  const [supportStatusFilter, setSupportStatusFilter] = useState('');
  const [supportCategoryFilter, setSupportCategoryFilter] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [openTicketId, setOpenTicketId] = useState(null);

  // Fetch data
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useAdminUsers({
    role: roleFilter || undefined,
    search: searchTerm || undefined,
    page: usersPage,
    limit: 50,
  });
  const { data: schools = [], isLoading: loadingSchools } = useAdminSchools({
    countryId: countryFilter || undefined,
  });
  const { data: countries = [] } = useCountries();
  const { data: students = [], isLoading: loadingStudents, refetch: refetchStudents } = useStudents(
    selectedSchoolForStudents ? { schoolId: selectedSchoolForStudents } : {}
  );
  const { data: terms = [], isLoading: loadingTerms } = useTerms(selectedSchoolForTerms || null);
  const { data: supportData, isLoading: loadingSupport } = useAllTickets({
    ...(supportStatusFilter && { status: supportStatusFilter }),
    ...(supportCategoryFilter && { category: supportCategoryFilter }),
    ...(supportSearch && { search: supportSearch }),
  });

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();
  const deactivateUser = useDeactivateUser();
  const assignToSchool = useAssignUserToSchool();
  const createSchool = useCreateSchool();
  const deleteTerm = useDeleteTerm();

  const users = usersData?.users || [];

  const handleCreateUser = async (formData) => {
    try {
      await createUser.mutateAsync(formData);
      setShowCreateModal(false);
      toast.success(`User ${formData.firstName} ${formData.lastName} created successfully`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleUpdateUser = async (id, data) => {
    try {
      await updateUser.mutateAsync({ id, data });
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleResetPassword = async (id, newPassword) => {
    try {
      await resetPassword.mutateAsync({ id, newPassword });
      setShowPasswordModal(false);
      setSelectedUser(null);
      toast.success('Password reset successfully', 'Password Reset');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const openDeactivateConfirm = (userToDeactivate) => {
    setConfirmModal({ isOpen: true, user: userToDeactivate });
  };

  const handleConfirmDeactivate = async () => {
    const userToDeactivate = confirmModal.user;
    if (!userToDeactivate) return;

    setIsDeactivating(true);
    try {
      await deactivateUser.mutateAsync(userToDeactivate.id);
      toast.success(`${userToDeactivate.firstName} ${userToDeactivate.lastName} has been deactivated`);
      setConfirmModal({ isOpen: false, user: null });
    } catch (error) {
      toast.error('Failed to deactivate user: ' + error.message);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleAssignSchool = async (userId, schoolId) => {
    try {
      await assignToSchool.mutateAsync({ userId, schoolId });
      setShowAssignSchoolModal(false);
      setSelectedUser(null);
      toast.success('User assigned to school successfully');
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleCreateSchool = async (formData) => {
    try {
      await createSchool.mutateAsync(formData);
      setShowCreateSchoolModal(false);
      toast.success(`School "${formData.name}" created successfully`);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPERUSER: 'bg-purple-100 text-purple-800',
      TEACHER: 'bg-gray-100 text-gray-800',
      PARENT_STUDENT: 'bg-amber-100 text-amber-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const renderOverview = () => {
    if (loadingStats) {
      return <div className="text-center py-8 text-gray-500">Loading statistics...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Role-appropriate first-run welcome */}
        <SuperuserWelcome userName={user?.firstName} />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.overview?.totalUsers || 0}</div>
                <div className="text-xs text-gray-500">Total Users</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <School size={24} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.overview?.totalSchools || 0}</div>
                <div className="text-xs text-gray-500">Schools</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCheck size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.overview?.totalTeachers || 0}</div>
                <div className="text-xs text-gray-500">Teachers</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BarChart3 size={24} className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.overview?.totalAssessments || 0}</div>
                <div className="text-xs text-gray-500">Assessments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Users by Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats?.usersByRole?.map((item) => (
              <div key={item.role} className="text-center">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(item.role)}`}>
                  {item.role.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold mt-2">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Schools by Country */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Schools by Country</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats?.schoolsByCountry?.map((item) => (
              <div key={item.country} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-sm text-gray-600">{item.country}</div>
                <div className="text-xl font-bold text-gray-800">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setUsersPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setUsersPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[150px]"
          >
            <option value="">All Roles</option>
            <option value="SUPERUSER">Superuser</option>
            <option value="TEACHER">Teacher</option>
          </select>
          <button
            onClick={() => refetchUsers()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} />
            Create User
          </button>
        </div>

        {/* Users List */}
        {loadingUsers ? (
          <div className="text-center py-8 text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">School</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-800">{u.firstName} {u.lastName}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.assignments?.length > 0 ? (
                          <div className="text-sm">
                            {u.assignments.map((a, i) => (
                              <div key={i} className="text-gray-700">
                                {a.school?.name || a.country?.name || 'N/A'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit user"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowPasswordModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="Reset password"
                            disabled={u.role === 'SUPERUSER'}
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowAssignSchoolModal(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Assign to school"
                          >
                            <Building size={16} />
                          </button>
                          {u.role !== 'SUPERUSER' && u.isActive && (
                            <button
                              onClick={() => openDeactivateConfirm(u)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Deactivate user"
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {usersData?.pagination && (
              <div className="border-t px-4 py-3 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {((usersPage - 1) * 50) + 1}–{Math.min(usersPage * 50, usersData.pagination.total)} of {usersData.pagination.total} users
                </span>
                {usersData.pagination.pages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage <= 1}
                      className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                    >
                      ‹
                    </button>
                    <span className="text-gray-700">Page {usersPage} of {usersData.pagination.pages}</span>
                    <button
                      onClick={() => setUsersPage(p => Math.min(usersData.pagination.pages, p + 1))}
                      disabled={usersPage >= usersData.pagination.pages}
                      className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleDeleteTerm = async (term) => {
    if (!window.confirm(`Delete "${term.name}"? This cannot be undone.\n\nNote: terms with assessments cannot be deleted.`)) return;
    try {
      await deleteTerm.mutateAsync(term.id);
      toast.success('Term deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete term');
    }
  };

  const renderTerms = () => {
    return (
      <div className="space-y-4">
        {/* Broadcast banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-purple-800 text-sm">Broadcast a term to multiple schools at once</p>
            <p className="text-purple-600 text-xs mt-0.5">Create the same term for all schools, all schools in a country, or a custom selection.</p>
          </div>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
          >
            <Calendar size={16} />
            Broadcast Term
          </button>
        </div>

        {/* Per-school toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
          <select
            value={selectedSchoolForTerms}
            onChange={(e) => { setSelectedSchoolForTerms(e.target.value); setEditingTerm(null); }}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[250px]"
          >
            <option value="">Or select a school to manage its terms individually...</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.country?.name})</option>
            ))}
          </select>
          {selectedSchoolForTerms && (
            <button
              onClick={() => { setEditingTerm(null); setShowTermModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Plus size={16} />
              Add Term
            </button>
          )}
        </div>

        {/* Content */}
        {!selectedSchoolForTerms ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">Select a School</h3>
            <p className="text-sm text-gray-500">Choose a school from the dropdown above to view and manage its academic terms.</p>
          </div>
        ) : loadingTerms ? (
          <div className="text-center py-8 text-gray-500">Loading terms...</div>
        ) : terms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">No Terms Yet</h3>
            <p className="text-sm text-gray-500 mb-4">This school has no academic terms. Create the first one to get started.</p>
            <button
              onClick={() => { setEditingTerm(null); setShowTermModal(true); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create First Term
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map((term) => (
              <div key={term.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{term.name}</h4>
                    <p className="text-sm text-gray-500">{term.schoolYear}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingTerm(term); setShowTermModal(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit term"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteTerm(term)}
                      disabled={deleteTerm.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-40"
                      title="Delete term"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5 border-t pt-2 mt-2">
                  <div>{new Date(term.startDate).toLocaleDateString()} — {new Date(term.endDate).toLocaleDateString()}</div>
                  {term._count?.assessments > 0 && (
                    <div className="text-amber-600 font-medium">{term._count.assessments} assessment{term._count.assessments !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSchools = () => {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[200px]"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateSchoolModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus size={16} />
            Add School
          </button>
        </div>

        {/* Schools List */}
        {loadingSchools ? (
          <div className="text-center py-8 text-gray-500">Loading schools...</div>
        ) : schools.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No schools found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <div key={school.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{school.name}</h4>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Globe size={14} />
                      {school.country?.name}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{school.adminCount || 0}</div>
                    <div className="text-xs text-gray-500">Admins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">{school.teacherCount || 0}</div>
                    <div className="text-xs text-gray-500">Teachers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{school._count?.students || 0}</div>
                    <div className="text-xs text-gray-500">Students</div>
                  </div>
                </div>
                {school.address && (
                  <div className="mt-3 text-xs text-gray-500">{school.address}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudents = () => {
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
          <select
            value={selectedSchoolForStudents}
            onChange={(e) => setSelectedSchoolForStudents(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[250px]"
          >
            <option value="">Select a school to view students...</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.country?.name})</option>
            ))}
          </select>
          {selectedSchoolForStudents && (
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Upload size={16} />
              Bulk Import Students
            </button>
          )}
        </div>

        {/* Students List */}
        {!selectedSchoolForStudents ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">Select a School</h3>
            <p className="text-sm text-gray-500">
              Choose a school from the dropdown above to view and manage its students.
            </p>
          </div>
        ) : loadingStudents ? (
          <div className="text-center py-8 text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-medium text-gray-700 mb-2">No Students Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              This school has no students registered yet. Use bulk import to add students.
            </p>
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Bulk Import Students
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <span className="text-sm text-gray-600">
                {students.length} student{students.length !== 1 ? 's' : ''} in this school
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Student ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Class</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date of Birth</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.studentIdNumber || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {student.class ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {student.class.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.dateOfBirth
                          ? new Date(student.dateOfBirth).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SupportTicketThread = ({ ticketId, onBack }) => {
    const { data: ticket, isLoading } = useTicket(ticketId);
    const { mutateAsync: updateStatus, isPending: updatingStatus } = useUpdateTicketStatus();
    const { mutateAsync: sendReply, isPending: sendingReply } = useReplyToTicket(ticketId);
    const [replyText, setReplyText] = useState('');

    const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
    const STATUS_LABELS = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };
    const STATUS_COLORS = { OPEN: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700' };
    const CATEGORY_LABELS = { GENERAL_QUESTION: 'General Question', BUG_REPORT: 'Bug Report', ACCOUNT_ISSUE: 'Account / Login', FEATURE_REQUEST: 'Feature Request' };
    const CATEGORY_COLORS = { GENERAL_QUESTION: 'bg-blue-100 text-blue-700', BUG_REPORT: 'bg-red-100 text-red-700', ACCOUNT_ISSUE: 'bg-amber-100 text-amber-700', FEATURE_REQUEST: 'bg-purple-100 text-purple-700' };

    if (isLoading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
    if (!ticket) return null;

    const handleReply = async () => {
      if (!replyText.trim()) return;
      await sendReply(replyText.trim());
      setReplyText('');
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
        <button onClick={onBack} className="text-sm text-purple-600 hover:text-purple-800 font-medium">← Back to tickets</button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{ticket.subject}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{ticket.user?.firstName} {ticket.user?.lastName} · {ticket.user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ticket.category]}`}>{CATEGORY_LABELS[ticket.category]}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              value={ticket.status}
              onChange={e => updateStatus({ id: ticketId, status: e.target.value })}
              disabled={updatingStatus}
              className={`text-sm px-3 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 ${STATUS_COLORS[ticket.status]}`}
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
              {ticket.user?.firstName?.[0]}{ticket.user?.lastName?.[0]}
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-500 mb-1">{ticket.user?.firstName} {ticket.user?.lastName} · {new Date(ticket.createdAt).toLocaleString()}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </div>
          {ticket.replies?.map(r => (
            <div key={r.id} className={`flex gap-3 ${r.isStaff ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${r.isStaff ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {r.isStaff ? 'SU' : `${r.user?.firstName?.[0]}${r.user?.lastName?.[0]}`}
              </div>
              <div className={`flex-1 border rounded-lg px-3 py-2.5 ${r.isStaff ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">{r.isStaff ? 'Support Team (You)' : `${r.user?.firstName} ${r.user?.lastName}`} · {new Date(r.createdAt).toLocaleString()}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Write a reply to the teacher…"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
          <button
            onClick={handleReply}
            disabled={sendingReply || !replyText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendingReply ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    );
  };

  const renderSupport = () => {
    const statusFilter = supportStatusFilter;
    const setStatusFilter = setSupportStatusFilter;
    const categoryFilter = supportCategoryFilter;
    const setCategoryFilter = setSupportCategoryFilter;
    const search = supportSearch;
    const setSearch = setSupportSearch;
    const data = supportData;
    const isLoading = loadingSupport;

    const tickets = data?.tickets || [];
    const STATUS_COLORS = { OPEN: 'bg-gray-100 text-gray-600', IN_PROGRESS: 'bg-blue-100 text-blue-700', RESOLVED: 'bg-green-100 text-green-700' };
    const STATUS_LABELS = { OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved' };
    const CATEGORY_LABELS = { GENERAL_QUESTION: 'General Question', BUG_REPORT: 'Bug Report', ACCOUNT_ISSUE: 'Account / Login', FEATURE_REQUEST: 'Feature Request' };
    const CATEGORY_COLORS = { GENERAL_QUESTION: 'bg-blue-100 text-blue-700', BUG_REPORT: 'bg-red-100 text-red-700', ACCOUNT_ISSUE: 'bg-amber-100 text-amber-700', FEATURE_REQUEST: 'bg-purple-100 text-purple-700' };

    if (openTicketId) {
      return <SupportTicketThread ticketId={openTicketId} onBack={() => setOpenTicketId(null)} />;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><HelpCircle size={20} className="text-purple-600" /> Support Tickets</h2>
          {data && <p className="text-sm text-gray-500">{data.total} total</p>}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject or name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="">All Categories</option>
            <option value="GENERAL_QUESTION">General Question</option>
            <option value="BUG_REPORT">Bug Report</option>
            <option value="ACCOUNT_ISSUE">Account / Login</option>
            <option value="FEATURE_REQUEST">Feature Request</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">From</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Replies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => setOpenTicketId(ticket.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-48">{ticket.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-sm text-gray-600">{ticket.user?.firstName} {ticket.user?.lastName}</p>
                      <p className="text-xs text-gray-400">{ticket.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ticket.category]}`}>{CATEGORY_LABELS[ticket.category]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      <Clock size={11} className="inline mr-1" />
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ticket.replies?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'students', label: 'Students', icon: BookOpen },
    { id: 'terms', label: 'Terms', icon: Calendar },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="OECS Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg text-white">OHPC Kindergarten Progress Checklist</h1>
              <p className="text-xs text-slate-300">System Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-200 bg-slate-700 px-3 py-1.5 rounded">
              <Shield size={16} className="text-purple-400" />
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="text-slate-400">|</span>
              <span className="text-purple-400 font-medium">Superuser</span>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-sm transition-colors"
              title="Change Password"
            >
              <Key size={16} />
              <span className="hidden sm:inline">Password</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded text-sm transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentView === item.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {currentView === 'overview' && renderOverview()}
        {currentView === 'users' && renderUsers()}
        {currentView === 'schools' && renderSchools()}
        {currentView === 'students' && renderStudents()}
        {currentView === 'terms' && renderTerms()}
        {currentView === 'support' && renderSupport()}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          isLoading={createUser.isPending}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(data) => handleUpdateUser(selectedUser.id, data)}
          isLoading={updateUser.isPending}
        />
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(password) => handleResetPassword(selectedUser.id, password)}
          isLoading={resetPassword.isPending}
        />
      )}

      {/* Assign School Modal */}
      {showAssignSchoolModal && selectedUser && (
        <AssignSchoolModal
          user={selectedUser}
          schools={schools}
          countries={countries}
          onClose={() => {
            setShowAssignSchoolModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(schoolId) => handleAssignSchool(selectedUser.id, schoolId)}
          isLoading={assignToSchool.isPending}
        />
      )}

      {/* Create School Modal */}
      {showCreateSchoolModal && (
        <CreateSchoolModal
          countries={countries}
          onClose={() => setShowCreateSchoolModal(false)}
          onSubmit={handleCreateSchool}
          isLoading={createSchool.isPending}
        />
      )}

      {/* Term Modal */}
      {showTermModal && (
        <SuperuserTermModal
          term={editingTerm}
          schoolId={selectedSchoolForTerms}
          onClose={() => { setShowTermModal(false); setEditingTerm(null); }}
          onSuccess={() => { setShowTermModal(false); setEditingTerm(null); }}
        />
      )}

      {showBroadcastModal && (
        <BroadcastTermModal
          countries={countries}
          schools={schools}
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={() => setShowBroadcastModal(false)}
        />
      )}

      {/* Deactivate User Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={handleConfirmDeactivate}
        isLoading={isDeactivating}
        variant="warning"
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmModal.user?.firstName} ${confirmModal.user?.lastName}? They will no longer be able to log in to the system.`}
        confirmText="Deactivate"
      />

      {/* Bulk Import Students Modal */}
      <BulkImportStudents
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onSuccess={() => {
          refetchStudents();
        }}
        schoolId={selectedSchoolForStudents}
      />

      {/* Footer */}
      <AppFooter />

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'TEACHER',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await onSubmit(formData);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Create New User</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">User should change this after first login</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
            >
              <option value="TEACHER">Teacher</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await onSubmit(formData);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Edit User</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Email:</strong> {user.email}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              disabled={user.role === 'SUPERUSER'}
            >
              <option value="TEACHER">Teacher</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
              disabled={user.role === 'SUPERUSER'}
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reset Password Modal Component
const ResetPasswordModal = ({ user, onClose, onSubmit, isLoading }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const result = await onSubmit(password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Reset Password</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            Resetting password for: <strong>{user.firstName} {user.lastName}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              required
              minLength={6}
              placeholder="Enter new password"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign School Modal Component
const AssignSchoolModal = ({ user, schools, countries, onClose, onSubmit, isLoading }) => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [error, setError] = useState('');

  const filteredSchools = selectedCountry
    ? schools.filter(s => s.countryId === selectedCountry)
    : schools;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedSchool) {
      setError('Please select a school');
      return;
    }
    const result = await onSubmit(selectedSchool);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Assign to School</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            Assigning: <strong>{user.firstName} {user.lastName}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedSchool('');
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              required
            >
              <option value="">Select school...</option>
              {filteredSchools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.country?.name})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Assigning...' : 'Assign to School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create School Modal Component
const CreateSchoolModal = ({ countries, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    countryId: '',
    address: '',
    phone: '',
    email: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.countryId) {
      setError('School name and country are required');
      return;
    }
    const result = await onSubmit(formData);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Add New School</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              placeholder="Enter school name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
            <select
              value={formData.countryId}
              onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              required
            >
              <option value="">Select a country...</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-md"
              placeholder="School address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                placeholder="school@email.com"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BroadcastTermModal = ({ countries, schools, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    startDate: '',
    endDate: '',
  });
  const [scope, setScope] = useState('all');
  const [countryId, setCountryId] = useState('');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const bulkCreate = useBulkCreateTerms();

  const filteredSchools = scope === 'country' && countryId
    ? schools.filter(s => s.countryId === countryId)
    : schools;

  const previewCount =
    scope === 'all' ? schools.length
    : scope === 'country' ? filteredSchools.length
    : selectedSchoolIds.length;

  const toggleSchool = (id) => {
    setSelectedSchoolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.schoolYear || !formData.startDate || !formData.endDate) {
      setError('Please fill in all term fields');
      return;
    }
    if (previewCount === 0) {
      setError('No schools match the selected scope');
      return;
    }
    try {
      const payload = {
        ...formData,
        scope,
        ...(scope === 'country' && { countryId }),
        ...(scope === 'schools' && { schoolIds: selectedSchoolIds }),
      };
      const res = await bulkCreate.mutateAsync(payload);
      setResult(res.message || `Term created for ${res.data?.count} school(s).`);
    } catch (err) {
      setError(err.message || 'Failed to broadcast term');
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <Calendar size={48} className="mx-auto text-purple-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Term Broadcast Complete</h2>
          <p className="text-gray-600 mb-6">{result}</p>
          <button onClick={onSuccess} className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Broadcast Term to Schools</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Term fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Name *</label>
              <input type="text" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Term 1, Fall Semester" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
              <input type="text" value={formData.schoolYear}
                onChange={e => setFormData({ ...formData, schoolYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., 2025-26" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>

          {/* Scope selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Apply to</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Schools' },
                { value: 'country', label: 'By Country' },
                { value: 'schools', label: 'Select Schools' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setScope(opt.value); setSelectedSchoolIds([]); }}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
                    scope === opt.value
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'text-gray-600 border-gray-200 hover:border-purple-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country picker */}
          {scope === 'country' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <select value={countryId} onChange={e => setCountryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Select a country...</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* School multi-select */}
          {scope === 'schools' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schools ({selectedSchoolIds.length} selected)
              </label>
              <div className="border border-gray-200 rounded-md max-h-44 overflow-y-auto divide-y">
                {schools.map(s => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selectedSchoolIds.includes(s.id)}
                      onChange={() => toggleSchool(s.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{s.country?.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className={`rounded-md px-4 py-2.5 text-sm font-medium ${
            previewCount > 0 ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'
          }`}>
            {previewCount > 0
              ? `This will create "${formData.name || 'the term'}" for ${previewCount} school${previewCount !== 1 ? 's' : ''}.`
              : 'No schools selected.'}
          </div>

          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={bulkCreate.isPending || previewCount === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
              {bulkCreate.isPending ? 'Creating...' : `Create for ${previewCount} School${previewCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuperuserTermModal = ({ term, schoolId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');
  const createTerm = useCreateTerm();
  const updateTerm = useUpdateTerm();

  useEffect(() => {
    if (term) {
      setFormData({
        name: term.name || '',
        schoolYear: term.schoolYear || '',
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
      });
    } else {
      setFormData({
        name: '',
        schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        startDate: '',
        endDate: '',
      });
    }
  }, [term]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.schoolYear || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      if (term) {
        await updateTerm.mutateAsync({ id: term.id, data: formData });
      } else {
        await createTerm.mutateAsync({ ...formData, schoolId });
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save term');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{term ? 'Edit Term' : 'Create New Term'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Term 1, Fall Semester"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Year *</label>
            <input
              type="text"
              value={formData.schoolYear}
              onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., 2025-26"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTerm.isPending || updateTerm.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {createTerm.isPending || updateTerm.isPending ? 'Saving...' : term ? 'Save Changes' : 'Create Term'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperuserDashboard;
