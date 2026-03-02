'use client';

import { Bell, MapPin, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useScope } from './ScopeProvider';

type Site = { id: string; name: string };

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { siteId, setSiteId } = useScope();
  const [sites, setSites] = useState<Site[]>([]);

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length === 0) return ['Dashboard'];
    return paths.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  };

  const breadcrumbs = getBreadcrumbs();

  const userInitials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await fetch('/api/sites');
        if (!res.ok) return;
        const data: Site[] = await res.json();
        setSites(data);
        if (!siteId && data.length > 0) {
          setSiteId(data[0].id);
        }
      } catch {
        // ignore
      }
    };
    loadSites();
  }, [siteId, setSiteId]);

  const currentSiteName = sites.find((s) => s.id === siteId)?.name ?? 'All sites';

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center">
              {idx > 0 && <span className="mx-2 text-slate-300">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'font-semibold text-slate-800' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <MapPin size={16} className="text-teal-600" />
          <select
            className="bg-transparent border-none outline-none font-medium cursor-pointer"
            value={siteId ?? ''}
            onChange={(e) => setSiteId(e.target.value || undefined)}
          >
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button className="text-slate-400 hover:text-slate-600 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </button>

        <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{session?.user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-500 mt-1">{session?.user?.role || 'Visitor'}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border border-teal-200">
            {userInitials}
          </div>
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

