'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { ShieldX } from 'lucide-react';

interface RequireRoleProps {
  children: React.ReactNode;
  roles: string[];
  fallback?: 'redirect' | 'forbidden';
}

// Hook to check if current user has any of the specified roles
// Returns null during hydration (loading), then true/false when ready
export function useHasRole(roles: string[]): boolean | null {
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During hydration, return null to indicate loading
  if (!mounted) return null;
  
  if (!isAuthenticated || !user) return false;
  return roles.some((role) => user?.roles?.includes(role));
}

// Helper function to check roles (for use outside React components)
export function checkUserRoles(user: { roles?: string[] } | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.some((role) => user?.roles?.includes(role));
}

export function RequireRole({ children, roles, fallback = 'forbidden' }: RequireRoleProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted (avoid hydration issues)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Check if user has any of the required roles
  const hasAccess = roles.some((role) => user?.roles?.includes(role));

  if (!hasAccess) {
    if (fallback === 'redirect') {
      router.push('/dashboard');
      return null;
    }

    // Show forbidden message
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 max-w-md">
          Anda tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
