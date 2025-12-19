'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { notificationsApi } from '@/lib/api';
import { Bell, Search, Check, X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function Header() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and periodically
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await notificationsApi.unreadCount();
        setUnreadCount(data.count || 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && notifications.length === 0) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          const { data } = await notificationsApi.list();
          setNotifications(data.data || []);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchNotifications();
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await notificationsApi.markAsRead(notifId);
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request_approved':
        return 'bg-green-100 text-green-600';
      case 'request_rejected':
        return 'bg-red-100 text-red-600';
      case 'request_created':
        return 'bg-blue-100 text-blue-600';
      case 'request_fulfilled':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets, requests..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  ) : notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(notif.type)}`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-400">
                                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                                </span>
                                <div className="flex items-center gap-1">
                                  {notif.link && (
                                    <Link 
                                      href={notif.link}
                                      onClick={() => {
                                        if (!notif.is_read) handleMarkAsRead(notif.id);
                                        setShowDropdown(false);
                                      }}
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      Lihat
                                    </Link>
                                  )}
                                  {!notif.is_read && (
                                    <button 
                                      onClick={() => handleMarkAsRead(notif.id)}
                                      className="p-1 text-gray-400 hover:text-green-600"
                                      title="Tandai dibaca"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.roles?.[0]?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
