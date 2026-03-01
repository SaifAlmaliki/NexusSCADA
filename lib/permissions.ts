import { Role } from "@prisma/client";

export type Permission = "view" | "edit" | "control" | "admin";

export type Module =
  | "Dashboard"
  | "Production Orders"
  | "Batches"
  | "Recipes"
  | "SCADA Real-Time"
  | "Alarms"
  | "Users & Roles";

type RoleKey = "operator" | "supervisor" | "engineer" | "admin";

const roleToKey: Record<Role, RoleKey> = {
  ADMIN: "admin",
  MANAGER: "supervisor",
  ENGINEER: "engineer",
  OPERATOR: "operator",
};

const permissionsMatrix: Record<Module, Record<RoleKey, Permission[]>> = {
  Dashboard: {
    operator: ["view"],
    supervisor: ["view"],
    engineer: ["view"],
    admin: ["view", "edit"],
  },
  "Production Orders": {
    operator: ["view"],
    supervisor: ["view", "edit", "control"],
    engineer: ["view"],
    admin: ["view", "edit", "control", "admin"],
  },
  Batches: {
    operator: ["view", "control"],
    supervisor: ["view", "edit", "control"],
    engineer: ["view"],
    admin: ["view", "edit", "control", "admin"],
  },
  Recipes: {
    operator: ["view"],
    supervisor: ["view"],
    engineer: ["view", "edit", "admin"],
    admin: ["view", "edit", "admin"],
  },
  "SCADA Real-Time": {
    operator: ["view", "control"],
    supervisor: ["view", "control"],
    engineer: ["view", "control", "edit"],
    admin: ["view", "control", "edit", "admin"],
  },
  Alarms: {
    operator: ["view", "control"],
    supervisor: ["view", "control"],
    engineer: ["view", "control"],
    admin: ["view", "control", "admin"],
  },
  "Users & Roles": {
    operator: [],
    supervisor: ["view"],
    engineer: ["view"],
    admin: ["view", "edit", "admin"],
  },
};

export function getPermissionsForRole(role: Role): Record<Module, Permission[]> {
  const key = roleToKey[role];
  const result: Partial<Record<Module, Permission[]>> = {};
  for (const mod of Object.keys(permissionsMatrix) as Module[]) {
    result[mod] = permissionsMatrix[mod][key];
  }
  return result as Record<Module, Permission[]>;
}

export function canAccess(
  role: Role,
  module: Module,
  permission: Permission
): boolean {
  const perms = getPermissionsForRole(role)[module];
  if (!perms) return false;
  return perms.includes(permission);
}

export function roleToLabel(role: Role): string {
  return roleToKey[role].charAt(0).toUpperCase() + roleToKey[role].slice(1);
}

export const permissionsMatrixForUI: {
  module: Module;
  operator: Permission[];
  supervisor: Permission[];
  engineer: Permission[];
  admin: Permission[];
}[] = Object.entries(permissionsMatrix).map(([module, perms]) => ({
  module: module as Module,
  operator: perms.operator,
  supervisor: perms.supervisor,
  engineer: perms.engineer,
  admin: perms.admin,
}));
