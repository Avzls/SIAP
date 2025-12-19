'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import {
  LayoutDashboard,
  Package,
  FileText,
  ClipboardCheck,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Aset', href: '/assets', icon: Package },
  { name: 'Permintaan Saya', href: '/requests', icon: FileText },
  { name: 'Persetujuan', href: '/approvals', icon: ClipboardCheck, roles: ['approver', 'super_admin'] },
  { name: 'Pemenuhan', href: '/admin/fulfillment', icon: Users, roles: ['asset_admin', 'super_admin'] },
  { name: 'Laporan', href: '/reports', icon: BarChart3, roles: ['asset_admin', 'super_admin'] },
  { name: 'Kelola Pengguna', href: '/admin/users', icon: Users, roles: ['super_admin'] },
  { name: 'Kelola Role', href: '/admin/roles', icon: Shield, roles: ['super_admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => user?.roles?.includes(role));
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            SIAP
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700 p-4">
        {!collapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
