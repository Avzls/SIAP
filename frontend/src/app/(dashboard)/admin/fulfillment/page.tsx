'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { AssetRequest, Asset } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { 
  PackageCheck, 
  Search, 
  ChevronRight, 
  Box, 
  User, 
  MapPin, 
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  Package,
  PlusCircle,
  Trash2,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

export default function FulfillmentDashboard() {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [availableAssets, setAvailableAssets] = useState<Record<number, any[]>>({});
  const [fulfillments, setFulfillments] = useState<Record<number, number>>({}); // item_id -> asset_id
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.pendingFulfillment();
      setRequests(data.data);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSelectRequest = async (request: AssetRequest) => {
    setSelectedRequest(request);
    setFulfillments({});
    setNotes('');
    
    // Fetch available assets for each category in request
    const categories = Array.from(new Set(request.items?.map(i => i.category?.id).filter(id => id)));
    
    for (const catId of categories) {
      if (catId && !availableAssets[catId]) {
        try {
          const { data } = await adminApi.availableAssets(catId);
          setAvailableAssets(prev => ({ ...prev, [catId]: data.data }));
        } catch (err) {
          console.error(`Failed to fetch assets for category ${catId}:`, err);
        }
      }
    }
  };

  const handleFulfill = async () => {
    if (!selectedRequest) return;
    
    // Validate: All item_id in request.items must have an asset_id in fulfillments
    const allItemsAssigned = selectedRequest.items?.every(item => fulfillments[item.id]);
    
    if (selectedRequest.request_type.value === 'NEW' && !allItemsAssigned) {
      alert('Mohon pilih aset untuk semua item sebelum memproses.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedRequest.request_type.value === 'NEW') {
        const payload = {
          fulfillments: Object.entries(fulfillments).map(([item_id, asset_id]) => ({
            item_id: Number(item_id),
            asset_id: Number(asset_id),
          })),
          notes,
        };
        await adminApi.fulfill(selectedRequest.id, payload);
      } else if (selectedRequest.request_type.value === 'RETURN') {
        await adminApi.fulfillReturn(selectedRequest.id, { notes });
      } else if (selectedRequest.request_type.value === 'TRANSFER') {
        await adminApi.fulfillTransfer(selectedRequest.id, { notes });
      }
      
      alert('Fulfillment berhasil diproses!');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Fulfillment failed:', err);
      alert('Gagal memproses fulfillment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fulfillment Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan penuhi permintaan aset yang telah disetujui.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - List of Approved Requests */}
        <div className="lg:col-span-1 space-y-4">
          <Card title={`Approved Requests (${requests.length})`}>
            {isLoading ? (
               <div className="flex justify-center p-8">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
               </div>
            ) : requests.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={`
                      w-full text-left p-4 transition-colors hover:bg-blue-50/50 flex flex-col space-y-2
                      ${selectedRequest?.id === req.id ? 'bg-blue-50 ring-1 ring-inset ring-blue-100' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-gray-900">{req.request_number}</span>
                      <Badge variant="blue" className="text-[10px]">{req.request_type.label}</Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-700">{req.requester?.name}</p>
                      <p className="text-[10px] text-gray-500">Approved {format(new Date(req.updated_at), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-400">
                       <Package className="w-3 h-3 mr-1" />
                       {req.items?.length} Items
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50/50">
                <PackageCheck className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending fulfillment</h3>
                <p className="mt-1 text-xs text-gray-500">All approved requests have been processed.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Fulfillment Process */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="space-y-6">
              <Card title="Process Fulfillment">
                <div className="p-6">
                  {/* Requester Summary */}
                  <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-6 border border-slate-100">
                     <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                           {selectedRequest.requester?.name.charAt(0)}
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-400 uppercase">Requester</p>
                           <p className="text-sm font-bold text-gray-900">{selectedRequest.requester?.name}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Type</p>
                        <p className="text-sm font-bold text-blue-600">{selectedRequest.request_type.label}</p>
                     </div>
                  </div>

                  {/* Items to Fulfill */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center">
                      <Box className="w-4 h-4 mr-2 text-blue-600" />
                      Assign Assets
                    </h3>
                    
                    <div className="space-y-4">
                      {selectedRequest.items?.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                               <p className="text-sm font-bold text-gray-900">{item.description}</p>
                               <p className="text-xs text-gray-500 mt-0.5">{item.specifications || 'Standard specifications'}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-bold text-gray-400 uppercase">Req. Qty</p>
                               <p className="text-sm font-bold text-gray-900">{item.quantity}</p>
                            </div>
                          </div>

                          {/* Asset Selection for NEW requests */}
                          {selectedRequest.request_type.value === 'NEW' && (
                            <div className="pt-4 border-t border-gray-50">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Select Asset from Stock</label>
                              <div className="grid grid-cols-1 gap-2">
                                {item.category ? (
                                  <div className="relative">
                                    <select
                                      value={fulfillments[item.id] || ''}
                                      onChange={(e) => setFulfillments(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                                      className="w-full h-11 pl-4 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                      <option value="">-- Choose Asset Tag --</option>
                                      {availableAssets[item.category.id]?.map(asset => (
                                        <option key={asset.id} value={asset.id}>
                                          {asset.asset_tag} - {asset.name} ({asset.brand || ''} {asset.model || ''})
                                        </option>
                                      ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-red-500">Category not specified for this item.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Non-NEW requests usually have asset assigned already, but showing it for confirmation */}
                          {selectedRequest.request_type.value !== 'NEW' && item.asset && (
                             <div className="pt-4 border-t border-gray-50 flex items-center space-x-3">
                               <div className="p-2 bg-slate-100 rounded-lg">
                                 <PlusCircle className="w-4 h-4 text-slate-500" />
                               </div>
                               <div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Target Asset</p>
                                 <p className="text-xs font-bold text-gray-900">{item.asset.asset_tag} - {item.asset.name}</p>
                               </div>
                             </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Fulfill notes */}
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fulfillment Notes</label>
                       <textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         placeholder="Tambahkan catatan serah terima (opsional)..."
                         className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                       />
                    </div>

                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedRequest(null)}>
                        Cancel
                      </Button>
                      <Button className="flex-[2] bg-blue-600 hover:bg-blue-700" onClick={handleFulfill} isLoading={isSubmitting}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Execute Fulfillment
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 min-h-[500px] border-dashed">
               <div className="p-5 bg-blue-50 rounded-full mb-4">
                 <PackageCheck className="h-12 w-12 text-blue-300" />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Select a Request</h3>
               <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">Pilih permintaan dari daftar di sebelah kiri untuk memulai proses penyerahan aset.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
