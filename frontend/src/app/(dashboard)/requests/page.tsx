'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import { FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { AssetRequest } from '@/types';

export default function RequestsPage() {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await requestsApi.list({
        status: statusFilter || undefined,
        per_page: 50,
      });
      setRequests(data.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permintaan Saya</h1>
          <p className="text-gray-500">Lacak dan kelola permintaan aset Anda</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Permintaan
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'FULFILLED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            className={`p-4 rounded-xl border transition-all ${
              statusFilter === status
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <p className="text-xs text-gray-500 capitalize">
              {status.replace('_', ' ').toLowerCase()}
            </p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {requests.filter(r => r.status.value === status).length}
            </p>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Permintaan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(request.status.value)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {request.request_number}
                      </p>
                      <Badge variant={getStatusVariant(request.status.color)}>
                        {request.status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        {request.request_type.label}
                      </span>
                      {request.items && request.items.length > 0 && (
                        <span className="text-sm text-gray-400">
                          • {request.items.length} item
                        </span>
                      )}
                    </div>
                    {request.justification && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {request.justification}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-gray-400">
                      {formatDateTime(request.created_at)}
                    </p>
                    {request.can_submit && (
                      <span className="text-xs text-blue-600">Siap diajukan</span>
                    )}
                  </div>
                </Link>
              ))}
              {requests.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada permintaan ditemukan</p>
                  <Link href="/requests/new">
                    <Button variant="outline" className="mt-4">
                      Buat permintaan pertama Anda
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
