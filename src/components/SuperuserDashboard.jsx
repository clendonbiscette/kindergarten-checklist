import { useState } from 'react';
import {
  Users, School, BarChart3, LogOut, Search, Plus,
  Edit2, Key, UserX, ChevronDown, ChevronUp, X,
  Shield, UserCheck, Building, Globe, RefreshCw
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
} from '../hooks/useAdmin';
import ConfirmModal from './ConfirmModal';
import AppFooter from './AppFooter';

const SuperuserDashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [currentView, setCurrentView] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAssignSchoolModal, setShowAssignSchoolModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null });
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Fetch data
  const { data: stats, isLoading: loadingStats } = useAdminStats();
  const { data: usersData, isLoading: loadingUsers, refetch: refetchUsers } = useAdminUsers({
    role: roleFilter || undefined,
    search: searchTerm || undefined,
  });
  const { data: schools = [], isLoading: loadingSchools } = useAdminSchools({
    countryId: countryFilter || undefined,
  });
  const { data: countries = [] } = useCountries();

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();
  const deactivateUser = useDeactivateUser();
  const assignToSchool = useAssignUserToSchool();

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

  const getRoleBadgeColor = (role) => {
    const colors = {
      SUPERUSER: 'bg-purple-100 text-purple-800',
      SCHOOL_ADMIN: 'bg-blue-100 text-blue-800',
      COUNTRY_ADMIN: 'bg-green-100 text-green-800',
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[150px]"
          >
            <option value="">All Roles</option>
            <option value="SUPERUSER">Superuser</option>
            <option value="SCHOOL_ADMIN">School Admin</option>
            <option value="COUNTRY_ADMIN">Country Admin</option>
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
              <div className="border-t px-4 py-3 bg-gray-50 text-sm text-gray-600">
                Showing {users.length} of {usersData.pagination.total} users
              </div>
            )}
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
            className="px-3 py-2 border border-gray-200 rounded-md text-sm min-w-[200px]"
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'schools', label: 'Schools', icon: School },
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

      {/* Footer */}
      <AppFooter />
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
    role: 'SCHOOL_ADMIN',
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
              type="text"
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
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="COUNTRY_ADMIN">Country Admin</option>
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
              <option value="SCHOOL_ADMIN">School Admin</option>
              <option value="COUNTRY_ADMIN">Country Admin</option>
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
              type="text"
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

export default SuperuserDashboard;
