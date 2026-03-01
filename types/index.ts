export type UserRole = 'operator' | 'supervisor' | 'engineer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  status: 'active' | 'disabled';
  lastLoginAt?: string;
}

export interface ProductionOrder {
  id: string;
  recipeId: string;
  recipeName: string;
  plannedStart: string;
  plannedEnd: string;
  status: 'planned' | 'running' | 'completed' | 'on_hold' | 'cancelled';
  quantity: number;
}

export interface Batch {
  id: string;
  orderId: string;
  reactorId: string;
  state: 'setup' | 'running' | 'hold' | 'completed' | 'aborted';
  startTime: string;
  endTime?: string;
  operatorName?: string;
  qualityStatus: 'pending' | 'pass' | 'fail';
}

export interface Recipe {
  id: string;
  name: string;
  version: number;
  productType: string;
  updatedAt: string;
  parameters: Record<string, unknown>;
}

export interface Alarm {
  id: string;
  tagName: string;
  unitName: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  active: boolean;
  acknowledged: boolean;
  timestamp: string;
}

export interface TagValue {
  id: string;
  name: string;
  unit: string;
  value: number;
  quality: 'good' | 'bad' | 'uncertain';
  timestamp: string;
}
