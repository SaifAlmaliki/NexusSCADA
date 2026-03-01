'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Factory, 
  Activity, 
  CheckCircle, 
  Package, 
  Users, 
  Settings,
  Server,
  FileText,
  Wrench,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navConfig = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Operator App', href: '/operator', icon: Smartphone },
  { 
    name: 'Production', 
    icon: Factory,
    children: [
      { name: 'Orders', href: '/orders' },
      { name: 'Batches', href: '/batches' },
      { name: 'Recipes', href: '/production/recipes' },
      { name: 'ERP Bridge', href: '/production/erp-bridge' },
    ]
  },
  { 
    name: 'SCADA', 
    icon: Activity,
    children: [
      { name: 'Real-Time', href: '/scada/realtime' },
      { name: 'Alarms', href: '/scada/alarms' },
      { name: 'Trends', href: '/scada/trends' },
    ]
  },
  { 
    name: 'Maintenance', 
    icon: Wrench,
    children: [
      { name: 'Predictive (ML)', href: '/maintenance/predictive' },
      { name: 'Digital Twins', href: '/maintenance/digital-twin' },
      { name: 'AR Overlay', href: '/maintenance/ar-overlay' },
    ]
  },
  { 
    name: 'Quality & Traceability', 
    icon: CheckCircle,
    children: [
      { name: 'OEE & Quality', href: '/quality/oee' },
      { name: 'Genealogy', href: '/traceability/batch/BATCH-456' },
      { name: 'Forward Trace', href: '/traceability/product/A123' },
      { name: 'Recall', href: '/traceability/recall/A123' },
      { name: 'Reports', href: '/traceability/reports' },
    ]
  },
  { 
    name: 'Inventory', 
    icon: Package,
    children: [
      { name: 'Materials', href: '/inventory/materials' },
      { name: 'Tanks/Silos', href: '/inventory/tanks' },
    ]
  },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Edge Fleet', href: '/fleet', icon: Server },
  { name: 'Users & Roles', href: '/users', icon: Users },
  { 
    name: 'Settings', 
    icon: Settings,
    children: [
      { name: 'General', href: '/settings' },
      { name: 'Batch Integration', href: '/settings/batch-integration' },
    ]
  },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Production: true,
    SCADA: true,
    Inventory: true
  });

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className={cn(
      "flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 h-screen sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 bg-slate-950">
        {!collapsed && <span className="text-white font-bold text-lg tracking-tight truncate">Nexus SCADA</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
          <Menu size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
        <nav className="space-y-1 px-2">
          {navConfig.map((item) => {
            const isActive = item.href === pathname || (item.children && item.children.some(child => pathname.startsWith(child.href)));
            
            if (item.children) {
              const isExpanded = expandedGroups[item.name];
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => {
                      if (collapsed) setCollapsed(false);
                      toggleGroup(item.name);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-800 hover:text-white transition-colors",
                      isActive ? "text-white" : "text-slate-300"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-teal-400" : "text-slate-400")} />
                      {!collapsed && <span>{item.name}</span>}
                    </div>
                    {!collapsed && (
                      isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </button>
                  
                  {!collapsed && isExpanded && (
                    <div className="pl-10 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              "block px-2 py-1.5 text-sm font-medium rounded-md transition-colors",
                              isChildActive 
                                ? "bg-slate-800 text-teal-400" 
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-slate-800 text-teal-400" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive ? "text-teal-400" : "text-slate-400")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
