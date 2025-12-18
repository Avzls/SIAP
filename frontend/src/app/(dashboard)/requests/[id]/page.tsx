'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { requestsApi, approvalsApi } from '@/lib/api';
import { AssetRequest, User as UserType } from '@/types';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  Package,
  Send,
  Trash2,
  Check,
  X,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [request, setRequest] = useState<AssetRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);

  const fetchRequest = async () => {
    try {
      const { data } = await requestsApi.get(Number(id));
      setRequest(data);
    } catch (err) {
      console.error('Failed to fetch request:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleSubmit = async () => {
    if (!confirm('Submit request ini untuk approval?')) return;
    setIsActionLoading(true);
    try {
      await requestsApi.submit(Number(id));
      await fetchRequest();
    } catch (err) {
      console.error('Failed to submit:', err);
      alert('Gagal submit request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan request ini?')) return;
    setIsActionLoading(true);
    try {
      await requestsApi.cancel(Number(id));
      await fetchRequest();
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Gagal membatalkan request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await approvalsApi.approve(Number(id), remarks);
      await fetchRequest();
      setShowApprovalPanel(false);
      setRemarks('');
    } catch (err) {
      console.error('Failed to approve:', err);
      alert('Gagal menyetujui request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remarks) {
      alert('Mohon masukkan alasan penolakan di kolom catatan.');
      return;
    }
    setIsActionLoading(true);
    try {
      await approvalsApi.reject(Number(id), remarks);
      await fetchRequest();
      setShowApprovalPanel(false);
      setRemarks('');
    } catch (err) {
      console.error('Failed to reject:', err);
      alert('Gagal menolak request');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Request not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const isPendingApprovalByMe = request.approvals?.some(
    a => a.approver.id === user?.id && a.status.value === 'PENDING'
  ) && request.status.value === 'PENDING_APPROVAL';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <button onClick={() => router.push('/requests')} className="hover:text-blue-600">Requests</button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">{request.request_number}</span>
        </div>
        <div className="flex space-x-3">
          {request.can_submit && (
            <Button onClick={handleSubmit} isLoading={isActionLoading}>
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </Button>
          )}
          {request.can_cancel && (
            <Button variant="outline" onClick={handleCancel} isLoading={isActionLoading} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
          {isPendingApprovalByMe && !showApprovalPanel && (
            <Button onClick={() => setShowApprovalPanel(true)} className="bg-indigo-600 hover:bg-indigo-700">
              Process Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Stepper */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Request</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{request.status.label}</h2>
                </div>
                <Badge variant={request.status.color as any} className="px-3 py-1 text-sm">
                  {request.status.label}
                </Badge>
              </div>
              
              <div className="relative flex justify-between items-center px-4">
                {/* Stepper Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                <div 
                   className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500"
                   style={{ 
                     width: request.status.value === 'DRAFT' ? '0%' : 
                            request.status.value === 'SUBMITTED' || request.status.value === 'PENDING_APPROVAL' ? '33%' :
                            request.status.value === 'APPROVED' || request.status.value === 'PENDING_FULFILLMENT' ? '66%' :
                            request.status.value === 'FULFILLED' || request.status.value === 'CLOSED' ? '100%' : '0%'
                   }}
                ></div>

                {/* Steps */}
                {[
                  { key: 'DRAFT', label: 'Draft', icon: FileText },
                  { key: 'PENDING_APPROVAL', label: 'Approval', icon: Clock },
                  { key: 'APPROVED', label: 'Processing', icon: Package },
                  { key: 'FULFILLED', label: 'Done', icon: CheckCircle2 },
                ].map((step, idx) => {
                  const isActive = request.status.value === step.key;
                  const isDone = ['SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'PENDING_FULFILLMENT', 'FULFILLED', 'CLOSED'].includes(request.status.value) && idx === 0 
                               || ['APPROVED', 'PENDING_FULFILLMENT', 'FULFILLED', 'CLOSED'].includes(request.status.value) && idx <= 2
                               || ['FULFILLED', 'CLOSED'].includes(request.status.value);
                  
                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 border-white
                        ${isActive ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-50' : 
                          isDone ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
                      `}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] sm:text-xs font-bold mt-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Request Info */}
          <Card title="Request Information">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Request Type</p>
                  <p className="text-sm font-bold text-gray-900">{request.request_type.label}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Created Date</p>
                  <p className="text-sm font-bold text-gray-900">{format(new Date(request.created_at), 'dd MMM yyyy, HH:mm')}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Justification / Reason</p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed italic">
                  &ldquo;{request.justification || 'Tidak ada keterangan tambahan.'}&rdquo;
                </div>
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card title="Requested Items">
            <div className="p-0">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                     <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                     <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {request.items?.map((item) => (
                     <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center space-x-3">
                           <div className="p-2 bg-blue-50 rounded-lg">
                             <Package className="w-5 h-5 text-blue-600" />
                           </div>
                           <div>
                             <p className="text-sm font-bold text-gray-900">{item.description}</p>
                             <p className="text-xs text-gray-500">{item.specifications || 'Any standard specs'}</p>
                           </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                       </td>
                       <td className="px-6 py-4">
                         {item.is_fulfilled ? (
                           <div className="flex items-center text-green-600 text-xs font-bold">
                             <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                             {item.fulfilled_asset?.asset_tag}
                           </div>
                         ) : (
                           <span className="text-xs text-gray-400 font-medium">Pending fulfillment</span>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </Card>

          {/* Rejection Panel */}
          {request.status.value === 'REJECTED' && (
             <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start space-x-4">
               <div className="p-2 bg-red-100 rounded-lg">
                 <XCircle className="w-6 h-6 text-red-600" />
               </div>
               <div>
                  <h3 className="text-sm font-bold text-red-900">Request Ditolak</h3>
                  <p className="text-sm text-red-700 mt-1 leading-relaxed">
                    Alasan: {request.rejection_reason || 'Tidak ada alasan spesifik yang diberikan.'}
                  </p>
               </div>
             </div>
          )}
        </div>

        {/* Right Column - Workflow & Approvals */}
        <div className="space-y-6">
          {/* Approval Panel (If needed) */}
          {showApprovalPanel && (
            <Card className="ring-2 ring-indigo-500 shadow-2xl overflow-hidden">
               <div className="bg-indigo-600 px-6 py-3 flex justify-between items-center">
                 <h3 className="text-white font-bold text-sm">Action Approval</h3>
                 <button onClick={() => setShowApprovalPanel(false)} className="text-indigo-200 hover:text-white">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="p-6 space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Catatan / Remarks</label>
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Masukkan catatan persetujuan atau alasan penolakan..."
                      className="w-full h-32 p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-gray-400"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={handleReject} isLoading={isActionLoading} className="text-red-600 border-red-200 hover:bg-red-50">
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button onClick={handleApprove} isLoading={isActionLoading} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                 </div>
               </div>
            </Card>
          )}

          {/* Requester Info */}
          <Card title="Requester">
            <div className="p-6">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                    <User className="w-6 h-6 text-slate-400" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-gray-900">{request.requester?.name}</h4>
                    <p className="text-xs text-gray-500">{request.requester?.nopeg} / {request.requester?.email}</p>
                 </div>
               </div>
            </div>
          </Card>

          {/* Approval Workflow */}
          <Card title="Approval History">
            <div className="p-6">
              {request.approvals && request.approvals.length > 0 ? (
                <div className="space-y-6">
                  {request.approvals.map((approval, idx) => (
                    <div key={approval.id} className="relative flex space-x-3">
                      {idx !== request.approvals!.length - 1 && (
                        <div className="absolute top-10 left-5 -ml-px h-full w-px bg-gray-100"></div>
                      )}
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2
                        ${approval.status.value === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-600' : 
                          approval.status.value === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-600' : 
                          'bg-gray-50 border-gray-200 text-gray-400'}
                      `}>
                        {approval.status.value === 'APPROVED' ? <Check className="w-5 h-5" /> : 
                         approval.status.value === 'REJECTED' ? <X className="w-5 h-5" /> : 
                         <Clock className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-gray-900">{approval.approver.name}</p>
                          <span className="text-[10px] text-gray-400">{approval.decided_at ? format(new Date(approval.decided_at), 'dd MMM') : ''}</span>
                        </div>
                        <p className="text-xs font-medium text-gray-500">{approval.status.label}</p>
                        {approval.remarks && (
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                             <p className="text-xs text-gray-600 flex items-start">
                               <MessageSquare className="w-3 h-3 mr-1.5 mt-0.5 text-gray-400 flex-shrink-0" />
                               {approval.remarks}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-xs text-gray-500 mt-2">No approvals recorded yet.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline / System Info */}
          <div className="text-center px-6">
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">System Audit</p>
             <p className="text-[10px] text-gray-400">Request ID: {request.id} • Created by {request.requester?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
