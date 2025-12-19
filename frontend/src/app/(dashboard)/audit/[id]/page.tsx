'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auditApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RequireRole } from '@/components/auth/RequireRole';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface StockOpnameDetail {
  id: number;
  stock_opname_id: number;
  asset_id: number;
  status: 'FOUND' | 'MISSING' | 'UNLISTED';
  notes?: string;
  scanned_at?: string;
  asset: { 
    id: number; 
    name: string; 
    asset_tag: string;
    brand?: string;
    model?: string;
    current_location?: { name: string };
  };
  scanner?: { name: string };
}

interface StockOpname {
  id: number;
  title: string;
  status: string;
  start_date: string;
  end_date?: string;
  location?: { name: string; code: string };
  creator: { name: string };
}

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [audit, setAudit] = useState<StockOpname | null>(null);
  const [items, setItems] = useState<StockOpnameDetail[]>([]);
  const [stats, setStats] = useState({ total: 0, found: 0, missing: 0, unlisted: 0 });
  const [loading, setLoading] = useState(true);
  const [inputTag, setInputTag] = useState('');
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const response = await auditApi.get(id);
      setAudit(response.data.data);
      setItems(response.data.data.details || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch audit:', error);
      toast.error('Gagal memuat data audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    // Focus input automatically if audit is in progress
    if (audit?.status === 'IN_PROGRESS' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [audit?.status, loading]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTag.trim()) return;

    setScanning(true);
    try {
      const response = await auditApi.scan(id, inputTag);
      
      const { status, detail } = response.data;
      
      // Update local state to reflect scan immediately
      setItems(prev => {
        const index = prev.findIndex(i => i.asset.asset_tag === inputTag);
        if (index >= 0) {
            const newItems = [...prev];
            newItems[index] = { ...newItems[index], status: 'FOUND', scanned_at: new Date().toISOString(), scanner: { name: 'You' } };
            return newItems;
        } else {
            // Check if we already have this unlisted item in list (unlikely in normal flow but possible if rescan)
            const unlistedIndex = prev.findIndex(i => i.asset.asset_tag === inputTag && i.status === 'UNLISTED');
            if (unlistedIndex >= 0) return prev; 
            
            // Add new unlisted item
             if (detail) return [detail, ...prev];
             return prev; 
        }
      });
      
      if (status === 'FOUND') {
        toast.success(`Aset ${inputTag} ditemukan!`);
      } else {
        // Detailed feedback for Unlisted items
        const actualLocation = detail?.asset?.current_location?.name || 'Unknown Location';
        toast.warning(
          <div className="flex flex-col gap-1">
             <span className="font-semibold">Aset Tidak Terdaftar di Sini!</span>
             <span className="text-xs">Aset {inputTag} seharusnya berada di: <b>{actualLocation}</b>.</span>
          </div>,
          { duration: 5000 }
        );
      }

      setInputTag('');
      fetchData(); // Refresh stats and list
    } catch (error: any) {
      console.error('Scan failed:', error);
      if (error.response?.status === 404) {
        toast.error(`Aset ${inputTag} tidak ditemukan di database`);
      } else {
        toast.error(error.response?.data?.message || 'Gagal memproses scan');
      }
    } finally {
      setScanning(false);
      // Keep focus
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const handleFinalize = async () => {
    try {
      await auditApi.finalize(id);
      toast.success('Sesi audit selesai');
      setShowFinalizeModal(false);
      fetchData();
    } catch (error) {
      console.error('Finalize failed:', error);
      toast.error('Gagal menyelesaikan audit');
    }
  };


  const filteredItems = items.filter(item => 
    item.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.asset.asset_tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;
  if (!audit) return <div>Data tidak ditemukan</div>;

  return (
    <RequireRole roles={['asset_admin', 'super_admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{audit.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {audit.location?.name || 'Semua'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {format(new Date(audit.start_date), 'dd MMM yyyy')}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                 audit.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {audit.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* Total */}
          <Card>
             <CardContent className="p-4 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Total Aset</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
             </CardContent>
          </Card>
           {/* Found */}
          <Card>
             <CardContent className="p-4 text-center bg-green-50 border-green-100">
                <p className="text-green-600 text-xs uppercase tracking-wider">Ditemukan</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{stats.found}</p>
             </CardContent>
          </Card>
           {/* Missing */}
          <Card>
             <CardContent className="p-4 text-center bg-red-50 border-red-100">
                <p className="text-red-500 text-xs uppercase tracking-wider">Belum Ditemukan</p>
                <p className="text-2xl font-bold text-red-700 mt-1">{stats.missing}</p>
             </CardContent>
          </Card>
           {/* Unlisted */}
          <Card>
             <CardContent className="p-4 text-center bg-yellow-50 border-yellow-100">
                <p className="text-yellow-600 text-xs uppercase tracking-wider">Salah Lokasi</p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.unlisted}</p>
             </CardContent>
          </Card>
        </div>

        {/* Scanning Area */}
        {audit.status === 'IN_PROGRESS' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <form onSubmit={handleScan} className="max-w-xl mx-auto">
                 <div className="text-center mb-4">
                   <h3 className="font-semibold text-lg text-blue-900">Scan Aset</h3>
                   <p className="text-blue-600 text-sm">Scan QR Code atau ketik Asset Tag untuk memverifikasi.</p>
                 </div>
                 <div className="flex gap-3">
                   <Input 
                     ref={inputRef}
                     value={inputTag}
                     onChange={(e) => setInputTag(e.target.value)}
                     placeholder="Masukan Asset Tag (Contoh: AST-001)..."
                     className="text-lg h-12 text-center uppercase tracking-widest font-mono"
                     autoFocus
                   />
                   <Button type="submit" size="lg" className="h-12 px-8" isLoading={scanning}>
                     Scan
                   </Button>
                 </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        <Card>
           <CardContent className="p-6">
             <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
               <h3 className="font-semibold text-gray-900">Daftar Aset</h3>
               <div className="flex gap-3 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <Input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     placeholder="Cari aset..." 
                     className="pl-9"
                   />
                 </div>
                 {audit.status === 'IN_PROGRESS' && (
                   <Button onClick={() => setShowFinalizeModal(true)} variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                     Selesai Audit
                   </Button>
                 )}
               </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full">
                 <thead className="bg-gray-50 border-b border-gray-100">
                   <tr>
                     <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                     <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Asset Tag</th>
                     <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nama Aset</th>
                     <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Waktu Scan</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {filteredItems.map((item) => (
                     <tr key={item.id} className="hover:bg-gray-50">
                       <td className="px-4 py-3">
                         {item.status === 'FOUND' && (
                           <span className="flex items-center gap-1.5 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded w-fit">
                             <CheckCircle className="w-3.5 h-3.5" /> Ditemukan
                           </span>
                         )}
                         {item.status === 'MISSING' && (
                           <span className="flex items-center gap-1.5 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded w-fit">
                             <XCircle className="w-3.5 h-3.5" /> Belum
                           </span>
                         )}
                         {item.status === 'UNLISTED' && (
                           <span className="flex items-center gap-1.5 text-yellow-600 font-medium text-xs bg-yellow-50 px-2 py-1 rounded w-fit">
                             <AlertTriangle className="w-3.5 h-3.5" /> Unlisted
                           </span>
                         )}
                       </td>
                       <td className="px-4 py-3 font-mono text-sm font-medium text-gray-700">
                         {item.asset.asset_tag}
                       </td>
                       <td className="px-4 py-3 text-sm text-gray-600">
                         <div>{item.asset.name}</div>
                         <div className="text-xs text-gray-400">{item.asset.brand} {item.asset.model}</div>
                       </td>
                       <td className="px-4 py-3 text-sm text-gray-500">
                         {item.scanned_at ? format(new Date(item.scanned_at), 'dd/MM HH:mm') : '-'}
                         {item.scanner && <span className="text-xs ml-1">by {item.scanner.name}</span>}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {filteredItems.length === 0 && (
                 <div className="text-center py-8 text-gray-500">
                   Tidak ada data aset
                 </div>
               )}
             </div>
           </CardContent>
        </Card>

        {/* Finalize Confirmation Modal */}
        <Modal
          isOpen={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          title="Selesaikan Audit?"
        >
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg flex gap-3 text-yellow-800 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p>
                Pastikan semua aset fisik telah discan. Setelah diselesaikan, hasil audit tidak dapat diubah lagi.
              </p>
            </div>
            
            <div className="flex justify-between items-center text-sm py-2 border-y border-gray-100">
              <span className="text-gray-500">Total Ditemukan:</span>
              <span className="font-semibold text-green-600">{stats.found} Aset</span>
            </div>
            <div className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500">Masih Hilang:</span>
              <span className="font-semibold text-red-600">{stats.missing} Aset</span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setShowFinalizeModal(false)}>
                Batal
              </Button>
              <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700 text-white">
                Ya, Selesaikan
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </RequireRole>
  );
}
