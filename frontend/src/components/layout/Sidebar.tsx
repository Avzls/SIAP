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
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  Shield,
  BarChart3,
  Settings,
  ArrowRightLeft,
  Box,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  roles?: string[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { name: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Aset', href: '/assets', icon: Package },
  { name: 'Permintaan Saya', href: '/requests', icon: FileText },
  { name: 'Persetujuan', href: '/approvals', icon: ClipboardCheck, roles: ['approver', 'super_admin'] },
  { name: 'Pemenuhan', href: '/admin/fulfillment', icon: ClipboardCheck, roles: ['asset_admin', 'super_admin'] },
  { 
    name: 'Laporan', 
    icon: BarChart3, 
    roles: ['asset_admin', 'super_admin'],
    children: [
      { name: 'Ringkasan Aset', href: '/reports/assets', icon: Box },
      { name: 'Pergerakan', href: '/reports/movements', icon: ArrowRightLeft },
      { name: 'Permintaan', href: '/reports/requests', icon: FileText },
    ],
  },
  { 
    name: 'Master Data', 
    icon: Settings, 
    roles: ['asset_admin', 'super_admin'],
    children: [
      { name: 'Kategori Aset', href: '/master/categories', icon: Box },
      { name: 'Lokasi', href: '/master/locations', icon: Box },
    ],
  },
  { 
    name: 'Admin', 
    icon: Shield, 
    roles: ['super_admin'],
    children: [
      { name: 'Kelola Pengguna', href: '/admin/users', icon: Users },
      { name: 'Kelola Role', href: '/admin/roles', icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Laporan', 'Admin']);

  const hasAccess = (item: NavItem): boolean => {
    if (!item.roles) return true;
    return item.roles.some((role) => user?.roles?.includes(role));
  };

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const isGroupActive = (item: NavItem): boolean => {
    if (item.children) {
      return item.children.some((child) => child.href && pathname.startsWith(child.href));
    }
    return item.href ? pathname.startsWith(item.href) : false;
  };

  const renderNavItem = (item: NavItem) => {
    if (!hasAccess(item)) return null;

    const Icon = item.icon;
    const isActive = item.href ? pathname.startsWith(item.href) : isGroupActive(item);
    const isOpen = openGroups.includes(item.name);

    // Group with children
    if (item.children) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleGroup(item.name)}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              {!collapsed && <span>{item.name}</span>}
            </div>
            {!collapsed && (
              <ChevronDown
                size={16}
                className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
              />
            )}
          </button>
          {!collapsed && isOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
              {item.children.map((child) => {
                if (!hasAccess(child)) return null;
                const ChildIcon = child.icon;
                const isChildActive = child.href && pathname.startsWith(child.href);

                return (
                  <Link
                    key={child.name}
                    href={child.href!}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isChildActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    )}
                  >
                    <ChildIcon size={16} />
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Single item
    return (
      <Link
        key={item.name}
        href={item.href!}
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
  };

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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {navigation.map(renderNavItem)}
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
