'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RequireRole, useHasRole } from '@/components/auth/RequireRole';
import { 
  ArrowRightLeft, 
  ArrowLeft, 
  User,
  Package,
  Calendar,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

interface Movement {
  id: number;
  movement_type: string | { value: string; label: string };
  asset: {
    id: number;
    asset_tag: string;
    name: string;
  };
  performer: {
    id: number;
    name: string;
  };
  from_user?: { name: string };
  to_user?: { name: string };
  from_location?: { name: string };
  to_location?: { name: string };
  notes?: string;
  created_at: string;
}

const movementTypeLabels: Record<string, { label: string; color: string }> = {
  ASSIGN: { label: 'Assign', color: 'bg-blue-100 text-blue-700' },
  RETURN: { label: 'Return', color: 'bg-green-100 text-green-700' },
  TRANSFER: { label: 'Transfer', color: 'bg-purple-100 text-purple-700' },
  REPAIR: { label: 'Repair', color: 'bg-yellow-100 text-yellow-700' },
  REPAIR_COMPLETE: { label: 'Repair Complete', color: 'bg-teal-100 text-teal-700' },
  RETIRE: { label: 'Retire', color: 'bg-gray-100 text-gray-700' },
  LOST: { label: 'Lost', color: 'bg-red-100 text-red-700' },
  FOUND: { label: 'Found', color: 'bg-emerald-100 text-emerald-700' },
};

// Helper to get movement type value (handles both string and object)
const getMovementTypeValue = (type: string | { value: string; label: string }): string => {
  if (typeof type === 'string') return type;
  return type.value || '';
};

export default function MovementsReportPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Check if user has access before making API calls
  // Returns null during hydration, then true/false
  const hasAccess = useHasRole(['asset_admin', 'super_admin']);

  const fetchMovements = async () => {
    // Wait until hasAccess is determined (not null = hydration complete)
    if (hasAccess === null) return;
    
    // No access - don't fetch
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await reportsApi.movements({
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        type: typeFilter || undefined,
        per_page: 100,
      });
      setMovements(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch movements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when hasAccess is determined (not null)
    if (hasAccess !== null) {
      fetchMovements();
    }
  }, [hasAccess]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovements();
  };

  return (
    <RequireRole roles={['asset_admin', 'super_admin']}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/reports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Pergerakan</h1>
          <p className="text-gray-500">Log pergerakan aset (assign, return, transfer)</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua</option>
                <option value="ASSIGN">Assign</option>
                <option value="RETURN">Return</option>
                <option value="TRANSFER">Transfer</option>
                <option value="REPAIR">Repair</option>
                <option value="RETIRE">Retire</option>
              </select>
            </div>
            <Button type="submit">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tipe</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aset</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Detail</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((movement) => {
                    const typeValue = getMovementTypeValue(movement.movement_type);
                    const typeConfig = movementTypeLabels[typeValue] || { 
                      label: typeValue || 'Unknown', 
                      color: 'bg-gray-100 text-gray-700' 
                    };
                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{movement.asset?.name}</p>
                              <p className="text-xs text-gray-500">{movement.asset?.asset_tag}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {movement.from_user && movement.to_user && (
                            <span>{movement.from_user.name} → {movement.to_user.name}</span>
                          )}
                          {movement.to_user && !movement.from_user && (
                            <span>→ {movement.to_user.name}</span>
                          )}
                          {movement.from_user && !movement.to_user && (
                            <span>{movement.from_user.name} →</span>
                          )}
                          {movement.to_location && (
                            <span>→ {movement.to_location.name}</span>
                          )}
                          {movement.notes && (
                            <p className="text-xs text-gray-400 mt-1">{movement.notes}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{movement.performer?.name}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p>Tidak ada data pergerakan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RequireRole>
  );
}
