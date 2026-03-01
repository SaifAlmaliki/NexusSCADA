"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
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
} from "lucide-react";
import { cn } from "@/components/Sidebar";
import { User, UserRole } from "@/types";

const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Jane Doe",
    email: "jane.doe@nexus.com",
    roles: ["admin", "engineer"],
    status: "active",
    lastLoginAt: "2023-10-25 08:30",
  },
  {
    id: "USR-002",
    name: "John Smith",
    email: "john.smith@nexus.com",
    roles: ["supervisor"],
    status: "active",
    lastLoginAt: "2023-10-25 07:15",
  },
  {
    id: "USR-003",
    name: "Alice Jones",
    email: "alice.jones@nexus.com",
    roles: ["operator"],
    status: "active",
    lastLoginAt: "2023-10-24 14:20",
  },
  {
    id: "USR-004",
    name: "Bob Brown",
    email: "bob.brown@nexus.com",
    roles: ["operator"],
    status: "disabled",
    lastLoginAt: "2023-10-10 09:00",
  },
  {
    id: "USR-005",
    name: "Charlie Davis",
    email: "charlie.davis@nexus.com",
    roles: ["engineer"],
    status: "active",
    lastLoginAt: "2023-10-25 10:05",
  },
];

const rolesList: UserRole[] = ["operator", "supervisor", "engineer", "admin"];

const permissionsMatrix = [
  {
    module: "Dashboard",
    operator: ["view"],
    supervisor: ["view"],
    engineer: ["view"],
    admin: ["view", "edit"],
  },
  {
    module: "Production Orders",
    operator: ["view"],
    supervisor: ["view", "edit", "control"],
    engineer: ["view"],
    admin: ["view", "edit", "control", "admin"],
  },
  {
    module: "Batches",
    operator: ["view", "control"],
    supervisor: ["view", "edit", "control"],
    engineer: ["view"],
    admin: ["view", "edit", "control", "admin"],
  },
  {
    module: "Recipes",
    operator: ["view"],
    supervisor: ["view"],
    engineer: ["view", "edit", "admin"],
    admin: ["view", "edit", "admin"],
  },
  {
    module: "SCADA Real-Time",
    operator: ["view", "control"],
    supervisor: ["view", "control"],
    engineer: ["view", "control", "edit"],
    admin: ["view", "control", "edit", "admin"],
  },
  {
    module: "Alarms",
    operator: ["view", "control"],
    supervisor: ["view", "control"],
    engineer: ["view", "control"],
    admin: ["view", "control", "admin"],
  },
  {
    module: "Users & Roles",
    operator: [],
    supervisor: ["view"],
    engineer: ["view"],
    admin: ["view", "edit", "admin"],
  },
];

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleResetPassword = (id: string) => {
    if (
      confirm(
        "Are you sure you want to send a password reset email to this user?",
      )
    ) {
      alert(`Password reset email sent to user ${id}`);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const action = currentStatus === "active" ? "disable" : "enable";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      alert(
        `User ${id} status changed to ${currentStatus === "active" ? "disabled" : "active"}`,
      );
    }
  };

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
          <button className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
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
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
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
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
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
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <Filter size={16} className="mr-2" />
                  Filter
                </button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
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
                    filteredUsers.map((user) => (
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
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span
                                key={role}
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs font-medium capitalize",
                                  role === "admin"
                                    ? "bg-purple-100 text-purple-700"
                                    : role === "engineer"
                                      ? "bg-blue-100 text-blue-700"
                                      : role === "supervisor"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-700",
                                )}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.status === "active" ? (
                            <span className="inline-flex items-center text-emerald-600 text-xs font-medium">
                              <CheckCircle2 size={14} className="mr-1" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-slate-500 text-xs font-medium">
                              <XCircle size={14} className="mr-1" /> Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {user.lastLoginAt || "Never"}
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
                              onClick={() => handleResetPassword(user.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Reset Password"
                            >
                              <Key size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleStatus(user.id, user.status)
                              }
                              className={cn(
                                "p-1.5 rounded transition-colors",
                                user.status === "active"
                                  ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50",
                              )}
                              title={
                                user.status === "active"
                                  ? "Disable User"
                                  : "Enable User"
                              }
                            >
                              {user.status === "active" ? (
                                <UserX size={16} />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
            </div>
          </>
        )}

        {activeTab === "users" && selectedUser && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Edit User: {selectedUser.name}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
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
                        defaultValue={selectedUser.name}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={selectedUser.email}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <select
                        defaultValue={selectedUser.status}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                    Plant Access
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Plant Alpha (NY)",
                      "Plant Beta (TX)",
                      "Plant Gamma (CA)",
                    ].map((plant) => (
                      <label
                        key={plant}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={plant === "Plant Alpha (NY)"}
                          className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm text-slate-700">{plant}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                    Role Assignment
                  </h3>
                  <div className="space-y-3">
                    {rolesList.map((role) => (
                      <label
                        key={role}
                        className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          defaultChecked={selectedUser.roles.includes(role)}
                          className="w-4 h-4 mt-0.5 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                        />
                        <div>
                          <span className="block text-sm font-medium text-slate-900 capitalize">
                            {role}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            {role === "admin"
                              ? "Full access to all system features and settings."
                              : role === "engineer"
                                ? "Can modify recipes, parameters, and view all data."
                                : role === "supervisor"
                                  ? "Can manage orders, batches, and oversee operations."
                                  : "Can view data, acknowledge alarms, and control assigned units."}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      alert("User updated successfully");
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                  {permissionsMatrix.map((row) => (
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
                                            : "bg-purple-100 text-purple-700",
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
    </div>
  );
}
