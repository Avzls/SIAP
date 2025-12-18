'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { assetsApi, requestsApi, approvalsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import {
  Package,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { Asset, AssetRequest } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalAssets: 0,
    myAssets: 0,
    pendingRequests: 0,
    pendingApprovals: 0,
  });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [recentRequests, setRecentRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assets
        const { data: assetsData } = await assetsApi.list({ per_page: 5 });
        setRecentAssets(assetsData.data || []);
        setStats(prev => ({
          ...prev,
          totalAssets: assetsData.meta?.total || assetsData.data?.length || 0,
        }));

        // Fetch requests
        const { data: requestsData } = await requestsApi.list({ per_page: 5 });
        setRecentRequests(requestsData.data || []);
        
        // Count pending requests for current user
        const pendingCount = (requestsData.data || []).filter(
          (r: AssetRequest) => !['FULFILLED', 'CLOSED', 'CANCELLED', 'REJECTED'].includes(r.status.value)
        ).length;
        setStats(prev => ({ ...prev, pendingRequests: pendingCount }));

        // Fetch pending approvals if user is approver
        if (user?.roles?.some(r => ['approver', 'super_admin'].includes(r))) {
          const { data: approvalsData } = await approvalsApi.pending();
          setStats(prev => ({
            ...prev,
            pendingApprovals: approvalsData.meta?.total || approvalsData.data?.length || 0,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500">Here&apos;s what&apos;s happening with your assets today.</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600 font-medium">+12%</span>
              <span className="text-gray-400">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">My Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingRequests}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Active requests</p>
          </CardContent>
        </Card>

        {user?.roles?.some(r => ['approver', 'super_admin'].includes(r)) && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingApprovals}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <Link href="/approvals" className="text-sm text-blue-600 hover:underline mt-4 inline-block">
                Review now →
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Assets</CardTitle>
            <Link href="/assets">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentAssets.slice(0, 5).map((asset) => (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(asset.status.color)}>
                    {asset.status.label}
                  </Badge>
                </Link>
              ))}
              {recentAssets.length === 0 && (
                <p className="p-4 text-center text-gray-500">No assets found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Requests</CardTitle>
            <Link href="/requests">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentRequests.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{request.request_number}</p>
                    <p className="text-sm text-gray-500">{request.request_type.label}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusVariant(request.status.color)}>
                      {request.status.label}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
              {recentRequests.length === 0 && (
                <p className="p-4 text-center text-gray-500">No requests yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
