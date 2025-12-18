'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { approvalsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, getStatusVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';
import { ClipboardCheck, CheckCircle, XCircle, User } from 'lucide-react';
import type { AssetRequest } from '@/types';

export default function ApprovalsPage() {
  const [pending, setPending] = useState<AssetRequest[]>([]);
  const [history, setHistory] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        approvalsApi.pending(),
        approvalsApi.history(),
      ]);
      setPending(pendingRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (requestId: number) => {
    setProcessing(requestId);
    try {
      await approvalsApi.approve(requestId, 'Approved');
      await fetchData();
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;
    
    setProcessing(requestId);
    try {
      await approvalsApi.reject(requestId, reason);
      await fetchData();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(null);
    }
  };

  const requests = activeTab === 'pending' ? pending : history;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Persetujuan</h1>
        <p className="text-gray-500">Tinjau dan setujui permintaan aset</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pending')}
        >
          Menunggu ({pending.length})
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          Riwayat
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.requester?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {request.requester?.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {request.request_number}
                          </span>
                          <Badge variant={getStatusVariant(request.status.color)}>
                            {request.status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>Jenis:</strong> {request.request_type.label}
                        </p>
                        {request.justification && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Alasan:</strong> {request.justification}
                          </p>
                        )}
                        {request.items && request.items.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600"><strong>Item:</strong></p>
                            <ul className="list-disc list-inside text-sm text-gray-500 mt-1">
                              {request.items.map((item, idx) => (
                                <li key={idx}>
                                  {item.quantity}x {item.category?.name || item.asset?.name || 'Item'}
                                  {item.specifications && ` - ${item.specifications}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Diajukan: {formatDateTime(request.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {activeTab === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          isLoading={processing === request.id}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Setujui
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="p-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {activeTab === 'pending'
                      ? 'Tidak ada persetujuan yang menunggu'
                      : 'Tidak ada riwayat persetujuan'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
