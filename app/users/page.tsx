"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Shield,
  UserX,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/components/Sidebar";
import {
  User,
  UserRole,
  roleToDisplayRole,
  statusToDisplay,
} from "@/types";
import { permissionsMatrixForUI } from "@/lib/permissions";

const rolesList: UserRole[] = ["operator", "supervisor", "engineer", "admin"];

const prismaRoleToUserRole: Record<string, UserRole> = {
  ADMIN: "admin",
  MANAGER: "supervisor",
  ENGINEER: "engineer",
  OPERATOR: "operator",
};

function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return "Never";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Never";
  }
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string; location?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterStatus) params.set("status", filterStatus);
      if (filterRole) params.set("role", filterRole);
      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus, filterRole]);

  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch("/api/sites");
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (showAddModal || selectedUser) fetchSites();
  }, [showAddModal, selectedUser, fetchSites]);

  const filteredUsers = users;

  const handleResetPassword = async (user: User, newPassword: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      alert("Password reset successfully");
      setResetPasswordUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = user.status === "ACTIVE" ? "disable" : "enable";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      await fetchUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (formData: {
    name: string;
    email: string;
    role: string;
    status: string;
    siteId: string | null;
  }) => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          siteId: formData.siteId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      await fetchUsers();
      setSelectedUser(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (formData: {
    name: string;
    email: string;
    password: string;
    role: string;
    siteId: string | null;
  }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          siteId: formData.siteId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setShowAddModal(false);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (role: string) => prismaRoleToUserRole[role] || role.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            User Management & RBAC
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage users, roles, and system access permissions.
          </p>
        </div>
        {activeTab === "users" && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Add User
          </button>
        )}
      </div>

      <Card>
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-6" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab("users");
                setSelectedUser(null);
              }}
              className={cn(
                "whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors",
                activeTab === "users"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab("roles");
                setSelectedUser(null);
              }}
              className={cn(
                "whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm transition-colors",
                activeTab === "roles"
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              Roles & Permissions
            </button>
          </nav>
        </div>

        {activeTab === "users" && !selectedUser && (
          <>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <option value="">All roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Supervisor</option>
                  <option value="ENGINEER">Engineer</option>
                  <option value="OPERATOR">Operator</option>
                </select>
                <button
                  onClick={fetchUsers}
                  className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Filter size={16} className="mr-2" />
                  Filter
                </button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <XCircle className="h-8 w-8 text-rose-500 mb-3" />
                  <p className="text-base font-medium text-slate-900">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="mt-2 text-sm text-teal-600 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Role(s)</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Last Login</th>
                      <th className="px-6 py-3 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const displayRole = getRoleLabel(user.role);
                        const displayStatus = statusToDisplay(user.status);
                        return (
                          <tr
                            key={user.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-slate-900">
                              {user.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {user.email}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                  displayRole === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : displayRole === "engineer"
                                      ? "bg-blue-100 text-blue-700"
                                      : displayRole === "supervisor"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {displayRole}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {displayStatus === "active" ? (
                                <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                                  <CheckCircle2 size={14} className="mr-1" />{" "}
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-slate-500 text-xs font-medium">
                                  <XCircle size={14} className="mr-1" />{" "}
                                  Disabled
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {formatLastLogin(user.lastLoginAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedUser(user)}
                                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                                  title="Edit User"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => setResetPasswordUser(user)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Reset Password"
                                >
                                  <Key size={16} />
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(user)}
                                  disabled={saving}
                                  className={cn(
                                    "p-1.5 rounded transition-colors",
                                    displayStatus === "active"
                                      ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                  )}
                                  title={
                                    displayStatus === "active"
                                      ? "Disable User"
                                      : "Enable User"
                                  }
                                >
                                  {displayStatus === "active" ? (
                                    <UserX size={16} />
                                  ) : (
                                    <CheckCircle2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 text-slate-300 mb-3" />
                            <p className="text-base font-medium text-slate-900">
                              No users found
                            </p>
                            <p className="text-sm mt-1">
                              Try adjusting your search or filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {activeTab === "users" && selectedUser && (
          <EditUserForm
            user={selectedUser}
            sites={sites}
            onCancel={() => setSelectedUser(null)}
            onSave={handleSaveEdit}
            saving={saving}
          />
        )}

        {activeTab === "roles" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Permissions Matrix
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Overview of access levels across different modules by role.
                </p>
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                <Shield size={18} className="mr-2" />
                Manage Custom Roles
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-r border-slate-200 w-1/4">
                      Module
                    </th>
                    {rolesList.map((role) => (
                      <th
                        key={role}
                        className="px-4 py-4 font-semibold text-center capitalize border-r border-slate-200 last:border-0"
                      >
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {permissionsMatrixForUI.map((row) => (
                    <tr
                      key={row.module}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-200 bg-slate-50/50">
                        {row.module}
                      </td>
                      {rolesList.map((role) => {
                        const perms = row[role as keyof typeof row] as string[];
                        return (
                          <td
                            key={role}
                            className="px-4 py-4 text-center border-r border-slate-200 last:border-0"
                          >
                            {perms && perms.length > 0 ? (
                              <div className="flex flex-wrap justify-center gap-1">
                                {perms.map((p) => (
                                  <span
                                    key={p}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                      p === "view"
                                        ? "bg-slate-100 text-slate-600"
                                        : p === "edit"
                                          ? "bg-blue-100 text-blue-700"
                                          : p === "control"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-purple-100 text-purple-700"
                                    )}
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">
                Permission Legend
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                    VIEW
                  </span>
                  <span className="text-xs text-slate-600">
                    Read-only access
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                    EDIT
                  </span>
                  <span className="text-xs text-slate-600">
                    Modify configurations
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                    CONTROL
                  </span>
                  <span className="text-xs text-slate-600">
                    Change setpoints/states
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                    ADMIN
                  </span>
                  <span className="text-xs text-slate-600">
                    Full management
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {showAddModal && (
        <AddUserModal
          sites={sites}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddUser}
          saving={saving}
        />
      )}

      {resetPasswordUser && (
        <ResetPasswordModal
          user={resetPasswordUser}
          onClose={() => setResetPasswordUser(null)}
          onConfirm={(newPassword) =>
            handleResetPassword(resetPasswordUser, newPassword)
          }
          saving={saving}
        />
      )}
    </div>
  );
}

function EditUserForm({
  user,
  sites,
  onCancel,
  onSave,
  saving,
}: {
  user: User;
  sites: { id: string; name: string; location?: string | null }[];
  onCancel: () => void;
  onSave: (data: {
    name: string;
    email: string;
    role: string;
    status: string;
    siteId: string | null;
  }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [siteId, setSiteId] = useState<string | null>(user.siteId ?? null);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Edit User: {user.name}
        </h2>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700 font-medium"
        >
          Back to Users
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Profile Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ACTIVE" | "DISABLED")
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Plant Access
            </h3>
            <div className="space-y-2">
              <select
                value={siteId ?? ""}
                onChange={(e) =>
                  setSiteId(e.target.value || null)
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No site assigned</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Role Assignment
            </h3>
            <div className="space-y-3">
              {(["ADMIN", "MANAGER", "ENGINEER", "OPERATOR"] as const).map(
                (r) => (
                  <label
                    key={r}
                    className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="w-4 h-4 mt-0.5 text-teal-600 border-slate-300 focus:ring-teal-500"
                    />
                    <div>
                      <span className="block text-sm font-medium text-slate-900 capitalize">
                        {roleToDisplayRole(r)}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {r === "ADMIN"
                          ? "Full access to all system features and settings."
                          : r === "ENGINEER"
                            ? "Can modify recipes, parameters, and view all data."
                            : r === "MANAGER"
                              ? "Can manage orders, batches, and oversee operations."
                              : "Can view data, acknowledge alarms, and control assigned units."}
                      </span>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ name, email, role, status, siteId })}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({
  sites,
  onClose,
  onSave,
  saving,
}: {
  sites: { id: string; name: string; location?: string | null }[];
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    siteId: string | null;
  }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [siteId, setSiteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      alert("Please fill in name, email, and password");
      return;
    }
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    onSave({ name: name.trim(), email: email.trim(), password, role, siteId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Add User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="OPERATOR">Operator</option>
              <option value="ENGINEER">Engineer</option>
              <option value="MANAGER">Supervisor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Plant Access
            </label>
            <select
              value={siteId ?? ""}
              onChange={(e) => setSiteId(e.target.value || null)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">No site assigned</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onConfirm,
  saving,
}: {
  user: User;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
  saving: boolean;
}) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Reset Password
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Set a new password for {user.name}.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || password.length < 8}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
