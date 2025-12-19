'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assetsApi, usersApi, masterDataApi } from '@/lib/api';
import { Asset, AssetMovement } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  History, 
  Info, 
  Paperclip, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShieldCheck,
  Tag,
  Hash,
  Box,
  ExternalLink,
  ChevronRight,
  X,
  Search,
  UserPlus,
  Check,
  Trash2,
  Download,
  Upload,
  FileText,
  Image,
  Edit,
  Save,
  TrendingDown,
  RotateCcw,
  MoreVertical,
  AlertTriangle,
  Ban,
  Archive,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';

type Tab = 'overview' | 'history' | 'attachments' | 'depreciation';

interface SearchUser {
  id: number;
  nopeg: string;
  name: string;
  email: string;
}

interface Location {
  id: number;
  code: string;
  name: string;
}

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.some(r => ['asset_admin', 'super_admin'].includes(r));

  const [asset, setAsset] = useState<Asset | null>(null);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Location modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  // Attachments state
  interface Attachment {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    type: string;
    url: string;
    is_image: boolean;
    uploaded_by: string;
    created_at: string;
  }
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deleteAttachmentId, setDeleteAttachmentId] = useState<number | null>(null);
  const [deletingAttachment, setDeletingAttachment] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    purchase_price: '',
    useful_life_years: '',
    residual_value: '',
    warranty_end: '',
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    location_id: '',
    notes: '',
  });
  const [returning, setReturning] = useState(false);


  // Disposal / Lost state
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retireReason, setRetireReason] = useState('');
  const [retiring, setRetiring] = useState(false);

  const [showLostModal, setShowLostModal] = useState(false);
  const [lostNotes, setLostNotes] = useState('');
  const [markingLost, setMarkingLost] = useState(false);

  const [showFoundModal, setShowFoundModal] = useState(false);
  const [foundForm, setFoundForm] = useState({ location_id: '', notes: '' });
  const [markingFound, setMarkingFound] = useState(false);

  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  // Depreciation State
  const [depreciationHistory, setDepreciationHistory] = useState<any[]>([]);
  const [loadingDepreciation, setLoadingDepreciation] = useState(false);

  // Wait for client-side hydration before fetching
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const response = await assetsApi.get(id as string);
        // API returns { data: { id, status, ... } }, so access response.data.data
        setAsset(response.data.data);
      } catch (err) {
        console.error('Failed to fetch asset:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (mounted) {
      fetchAsset();
    }
  }, [id, mounted]);

  useEffect(() => {
    if (activeTab === 'history' && movements.length === 0) {
      const fetchHistory = async () => {
        setIsMovementsLoading(true);
        try {
          const { data } = await assetsApi.movements(asset?.id as number);
          setMovements(data.data);
        } catch (err) {
          console.error('Failed to fetch movements:', err);
        } finally {
          setIsMovementsLoading(false);
        }
      };
      
      if (asset) fetchHistory();
    }
  }, [activeTab, asset]);

  // Fetch attachments when tab is active
  useEffect(() => {
    if (activeTab === 'attachments' && attachments.length === 0) {
      const fetchAttachments = async () => {
        setLoadingAttachments(true);
        try {
          const { data } = await assetsApi.attachments(asset?.id as number);
          setAttachments(data.data || []);
        } catch (err) {
          console.error('Failed to fetch attachments:', err);
        } finally {
          setLoadingAttachments(false);
        }
      };
      
      if (asset) fetchAttachments();
    }
  }, [activeTab, asset]);

  // Fetch depreciation when tab is active
  useEffect(() => {
    if (activeTab === 'depreciation' && depreciationHistory.length === 0) {
      const fetchDepreciation = async () => {
        setLoadingDepreciation(true);
        try {
          const { data } = await assetsApi.depreciation(asset?.id as number) as any;
          setDepreciationHistory(data.history);
        } catch (err) {
          console.error('Failed to fetch depreciation:', err);
        } finally {
          setLoadingDepreciation(false);
        }
      };
      
      if (asset) fetchDepreciation();
    }
  }, [activeTab, asset]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !asset) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'photo' : 'document');
      
      const { data } = await assetsApi.uploadAttachment(asset.id, formData);
      setAttachments(prev => [data.data, ...prev]);
      toast.success('File berhasil diupload');
    } catch (err) {
      console.error('Failed to upload file:', err);
      toast.error('Gagal mengupload file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Handle delete attachment
  // Handle delete attachment click
  const handleDeleteAttachment = (attachmentId: number) => {
    setDeleteAttachmentId(attachmentId);
  };

  // Confirm delete attachment
  const confirmDeleteAttachment = async () => {
    if (!asset || !deleteAttachmentId) return;

    setDeletingAttachment(true);
    try {
      await assetsApi.deleteAttachment(asset.id, deleteAttachmentId);
      setAttachments(prev => prev.filter(a => a.id !== deleteAttachmentId));
      toast.success('File berhasil dihapus');
      setDeleteAttachmentId(null);
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      toast.error('Gagal menghapus file');
    } finally {
      setDeletingAttachment(false);
    }
  };

  // Search users with debounce
  useEffect(() => {
    if (!showAssignModal || userSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const { data } = await usersApi.search({ search: userSearch });
        setSearchResults(data.data || []);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch, showAssignModal]);

  const openAssignModal = () => {
    setShowAssignModal(true);
    setUserSearch('');
    setSearchResults([]);
    setSelectedUser(null);
    setAssignNotes('');
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
  };

  const handleAssign = async () => {
    if (!selectedUser || !asset) return;
    
    setAssigning(true);
    try {
      await assetsApi.assign(asset.id, {
        user_id: selectedUser.id,
        notes: assignNotes || undefined,
      });
      toast.success(`Aset berhasil ditetapkan ke ${selectedUser.name}`);
      closeAssignModal();
      // Refresh asset data
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]); // Reset to refetch
    } catch (err) {
      console.error('Failed to assign asset:', err);
      toast.error('Gagal menetapkan aset');
    } finally {
      setAssigning(false);
    }
  };

  // Location modal handlers
  const openLocationModal = async () => {
    setShowLocationModal(true);
    setSelectedLocation(asset?.current_location?.id || null);
    setLoadingLocations(true);
    try {
      const { data } = await masterDataApi.locations({ active_only: true });
      setLocations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation || !asset) return;
    
    setSavingLocation(true);
    try {
      await assetsApi.update(asset.id, { current_location_id: selectedLocation });
      toast.success('Lokasi berhasil diubah');
      closeLocationModal();
      // Refresh asset data
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
    } catch (err) {
      console.error('Failed to save location:', err);
      toast.error('Gagal mengubah lokasi');
    } finally {
      setSavingLocation(false);
    }
  };

  // Edit modal handlers
  const openEditModal = () => {
    if (!asset) return;
    setEditForm({
      name: asset.name || '',
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
      purchase_price: asset.purchase_price?.toString() || '',
      useful_life_years: asset.useful_life_years?.toString() || '',
      residual_value: asset.residual_value?.toString() || '',
      warranty_end: asset.warranty_end ? asset.warranty_end.split('T')[0] : '',
      notes: asset.notes || '',
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const handleSaveEdit = async () => {
    if (!asset) return;
    
    setSavingEdit(true);
    try {
      await assetsApi.update(asset.id, {
        name: editForm.name,
        brand: editForm.brand || null,
        model: editForm.model || null,
        serial_number: editForm.serial_number || null,
        purchase_date: editForm.purchase_date || null,
        purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : null,
        useful_life_years: editForm.useful_life_years ? parseInt(editForm.useful_life_years) : null,
        residual_value: editForm.residual_value ? parseFloat(editForm.residual_value) : null,
        warranty_end: editForm.warranty_end || null,
        notes: editForm.notes || null,
      });
      toast.success('Aset berhasil diperbarui');
      closeEditModal();
      // Refresh asset data
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
    } catch (err) {
      console.error('Failed to update asset:', err);
      toast.error('Gagal memperbarui aset');
    } finally {
      setSavingEdit(false);
    }
  };

  // Return Modal Handlers
  const openReturnModal = async () => {
    if (!asset) return;
    setShowReturnModal(true);
    setReturnForm({
      location_id: '',
      notes: '',
    });
    
    // Reuse locations logic if needed, or fetch if empty
    if (locations.length === 0) {
        setLoadingLocations(true);
        try {
            const { data } = await masterDataApi.locations({ active_only: true });
            setLocations(data.data || []);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setLoadingLocations(false);
        }
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setReturning(true);
    try {
      await assetsApi.return(asset.id, {
        location_id: returnForm.location_id ? Number(returnForm.location_id) : undefined,
        notes: returnForm.notes,
      });
      toast.success('Aset berhasil dikembalikan');
      setShowReturnModal(false);
      // Refresh
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]); // Reset history to refetch
    } catch (err: any) {
      console.error('Failed to return asset:', err);
      toast.error(err.response?.data?.message || 'Gagal mengembalikan aset');
    } finally {
      setReturning(false);
    }
  };



  // Disposal Handlers
  const handleRetire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    
    setRetiring(true);
    try {
      await assetsApi.retire(asset.id, { reason: retireReason });
      toast.success('Aset berhasil dihapus (Retire)');
      setShowRetireModal(false);
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menghapus aset');
    } finally {
      setRetiring(false);
    }
  };

  const handleMarkLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setMarkingLost(true);
    try {
      await assetsApi.markLost(asset.id, { notes: lostNotes });
      toast.success('Aset dilaporkan hilang');
      setShowLostModal(false);
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal melaporkan aset hilang');
    } finally {
      setMarkingLost(false);
    }
  };

  const handleMarkFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setMarkingFound(true);
    try {
      await assetsApi.markFound(asset.id, { 
        location_id: foundForm.location_id ? Number(foundForm.location_id) : undefined,
        notes: foundForm.notes 
      });
      toast.success('Aset berhasil ditemukan kembali');
      setShowFoundModal(false);
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengupdate status aset');
    } finally {
      setMarkingFound(false);
    }
  };

  // Locations for Found modal
  const openFoundModal = async () => {
     setShowFoundModal(true);
     setFoundForm({ location_id: '', notes: '' });
     if (locations.length === 0) {
        setLoadingLocations(true);
        try {
            const { data } = await masterDataApi.locations({ active_only: true });
            setLocations(data.data || []);
        } catch (err) { console.error(err); } 
        finally { setLoadingLocations(false); }
     }
  }

  // Print QR Label
  const printLabel = () => {
    if (!asset) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Popup blocker aktif. Izinkan popup untuk mencetak label.');
      return;
    }

    // Use QR Code API to generate real QR code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(asset.asset_tag)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Label Aset - ${asset.asset_tag}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .label { 
            border: 2px solid #000; 
            padding: 20px; 
            width: 200px; 
            text-align: center;
            display: inline-block;
          }
          .qr-code { margin: 0 auto 10px; }
          .qr-code img { width: 120px; height: 120px; }
          .asset-tag { font-size: 16px; font-weight: bold; font-family: monospace; margin-bottom: 5px; }
          .asset-name { font-size: 11px; color: #333; }
          .company { font-size: 10px; color: #666; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 8px; }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
            .label { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>
          <div class="asset-tag">${asset.asset_tag}</div>
          <div class="asset-name">${asset.name}</div>
          <div class="company">SIAP - Sistem Informasi Aset Perusahaan</div>
        </div>
        <div class="no-print" style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">Cetak</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin-left: 10px; cursor: pointer;">Tutup</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Aset tidak ditemukan</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <span className="text-sm font-medium text-gray-500">{asset.asset_tag}</span>
              <Badge variant={asset.status.color as any}>{asset.status.label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {asset.status.value === 'ASSIGNED' && asset.current_user && isAdmin && (
            <Button onClick={openReturnModal} variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Kembalikan
            </Button>
          )}

          {/* More Actions Dropdown */}
          <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={openEditModal}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Aset
              </Button>
              {asset.status.value === 'IN_STOCK' && (
                <Button onClick={openAssignModal}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tetapkan Pemegang
                </Button>
              )}
              
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowActionsDropdown(!showActionsDropdown)}>
                  <MoreVertical className="w-4 h-4" />
                </Button>

                {showActionsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActionsDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                      {asset.status.value === 'LOST' ? (
                         <button
                            onClick={() => {
                                openFoundModal(); 
                                setShowActionsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center"
                         >
                            <Check className="w-4 h-4 mr-2" />
                            Lapor Ditemukan
                         </button>
                      ) : (
                         <button
                            onClick={() => {
                                setShowLostModal(true);
                                setLostNotes('');
                                setShowActionsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center"
                         >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Lapor Hilang
                         </button>
                      )}
                      
                      {asset.status.value !== 'RETIRED' && (
                          <button
                            onClick={() => {
                                setShowRetireModal(true);
                                setRetireReason('');
                                setShowActionsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center border-t border-gray-100"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Penghapusan (Retire)
                          </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Ringkasan', icon: Info },
            { id: 'history', label: 'Riwayat Perpindahan', icon: History },
            { id: 'attachments', label: 'Lampiran', icon: Paperclip },
            { id: 'depreciation', label: 'Penyusutan', icon: TrendingDown },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Main Info */}
              <Card title="Informasi Aset">
                <div className="grid grid-cols-2 gap-6 p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Tag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Kategori</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.category?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Box className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Merek / Model</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.brand && asset.model ? `${asset.brand} ${asset.model}` : (asset.brand || asset.model || '-')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Hash className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Nomor Seri</p>
                        <p className="text-sm font-bold font-mono text-gray-900">{asset.serial_number || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Tanggal Pembelian</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.purchase_date ? format(new Date(asset.purchase_date), 'dd MMM yyyy') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-yellow-50 rounded-lg">
                        <DollarSign className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Harga Pembelian</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.purchase_price 
                            ? `Rp. ${Number(asset.purchase_price).toLocaleString('id-ID')}` 
                            : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Garansi Berakhir</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.warranty_end ? format(new Date(asset.warranty_end), 'dd MMM yyyy') : '-'}
                          {asset.is_under_warranty && (
                            <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Aktif</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Specifications */}
              <Card title="Spesifikasi">
                <div className="p-6">
                  {asset.specifications && Object.keys(asset.specifications).length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(asset.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-gray-100 pb-2">
                          <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Tidak ada spesifikasi.</p>
                  )}
                </div>
              </Card>
            </>
          )}

          {activeTab === 'history' && (
            <Card title="Riwayat Perpindahan">
              <div className="p-6">
                {isMovementsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : movements.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {movements.map((item, idx) => (
                        <li key={item.id}>
                          <div className="relative pb-8">
                            {idx !== movements.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-gray-100`}>
                                  <History className="w-4 h-4 text-gray-500" />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 flex justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900 font-medium">
                                    {item.movement_type.label}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {item.summary}
                                  </p>
                                  {item.notes && (
                                    <p className="text-xs text-gray-400 mt-1 italic italic">
                                      &ldquo;{item.notes}&rdquo;
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                  <div>{format(new Date(item.created_at), 'dd MMM yyyy')}</div>
                                  <div>{format(new Date(item.created_at), 'HH:mm')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Tidak ada riwayat perpindahan.</p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'attachments' && (
            <Card title="Lampiran">
              <div className="p-6">
                {/* Upload Button */}
                {isAdmin && (
                  <div className="mb-6">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        disabled={uploading}
                      />
                      <div className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg py-6 px-4 hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                        {uploading ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span>Mengupload...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Upload className="w-5 h-5" />
                            <span>Klik untuk upload file (maks 10MB)</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                {/* Attachments List */}
                {loadingAttachments ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((att) => (
                      <div 
                        key={att.id} 
                        className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        {/* Icon/Preview */}
                        <div className="flex-shrink-0">
                          {att.is_image ? (
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                              <img 
                                src={att.url} 
                                alt={att.original_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {att.original_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {att.human_size} • {att.uploaded_by || 'Unknown'} • {att.created_at ? format(new Date(att.created_at), 'dd MMM yyyy') : '-'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">Belum ada lampiran</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'depreciation' && (
            <Card title="Simulasi Penyusutan (Metode Garis Lurus)">
                <div className="p-6">
                    {!asset.purchase_price || !asset.useful_life_years ? (
                        <div className="text-center py-8 text-gray-500">
                             <p>Data penyusutan belum lengkap.</p>
                             <p className="text-xs mt-1">Pastikan Harga Beli dan Umur Ekonomis sudah diisi.</p>
                             <Button variant="outline" size="sm" className="mt-4" onClick={openEditModal}>Lengkapi Data</Button>
                        </div>
                    ) : loadingDepreciation ? (
                        <div className="flex justify-center py-8">
                             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-blue-600 font-medium uppercase">Harga Perolehan</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        Rp {Number(asset.purchase_price).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <p className="text-xs text-green-600 font-medium uppercase">Nilai Buku Saat Ini</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        Rp {depreciationHistory.find(h => h.year === new Date().getFullYear())?.book_value?.toLocaleString('id-ID') || '-'}
                                    </p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <p className="text-xs text-orange-600 font-medium uppercase">Penyusutan / Tahun</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        Rp {depreciationHistory[1]?.depreciation_expense?.toLocaleString('id-ID') || 0}
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={depreciationHistory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="year" />
                                        <YAxis tickFormatter={(value) => `Rp ${value/1000000}jt`} />
                                        <Tooltip 
                                            formatter={(value: number | undefined) => [`Rp ${(value || 0).toLocaleString('id-ID')}`, 'Nilai Buku']}
                                            labelFormatter={(label) => `Tahun ${label}`}
                                        />
                                        <Line type="monotone" dataKey="book_value" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} name="Nilai Buku" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-3">Tahun</th>
                                            <th className="px-6 py-3">Beban Penyusutan</th>
                                            <th className="px-6 py-3">Akumulasi Penyusutan</th>
                                            <th className="px-6 py-3">Nilai Buku</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {depreciationHistory.map((row) => (
                                            <tr key={row.year} className={row.year === new Date().getFullYear() ? "bg-blue-50/50" : ""}>
                                                <td className="px-6 py-3 font-medium">{row.year}</td>
                                                <td className="px-6 py-3">Rp {row.depreciation_expense.toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-3">Rp {row.accumulated_depreciation.toLocaleString('id-ID')}</td>
                                                <td className="px-6 py-3 font-bold text-gray-900">Rp {row.book_value.toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Current Holder */}
          <Card title="Pemegang Saat Ini">
            <div className="p-6">
              {asset.current_user ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {asset.current_user.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{asset.current_user.name}</h4>
                    <p className="text-xs text-gray-500">NIK: {asset.current_user.nopeg}</p>
                    <div className="flex mt-2">
                       <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push(`/admin/users/${asset.current_user?.id}`)}>Lihat User</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">Di Gudang / Tidak ada pemegang</p>
                </div>
              )}
            </div>
          </Card>

          {/* Current Location */}
          <Card title="Lokasi Saat Ini">
            <div className="p-6">
              {asset.current_location ? (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{asset.current_location.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{asset.current_location.code}</p>
                    <div className="mt-3 flex space-x-2">
                       {isAdmin && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openLocationModal}>Ubah Lokasi</Button>
                       )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">Lokasi belum ditetapkan</p>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={openLocationModal}>Tetapkan Lokasi</Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* QR Code */}
          <Card title="Label Aset">
            <div className="p-6 text-center">
              <div className="bg-white p-4 rounded-xl inline-block mb-4 border border-gray-200">
                <QRCodeSVG 
                  value={asset.asset_tag} 
                  size={128}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-sm font-mono font-bold text-gray-900 mb-1">{asset.asset_tag}</p>
              <p className="text-xs text-gray-500 mb-4">Cetak label ini untuk ditempel pada aset.</p>
              <Button variant="outline" className="w-full" size="sm" onClick={printLabel}>
                Cetak Label QR
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Tetapkan Pemegang</h2>
              <Button variant="ghost" size="sm" onClick={closeAssignModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Selected User */}
            {selectedUser ? (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedUser.name}</p>
                      <p className="text-xs text-gray-500">NIK: {selectedUser.nopeg}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cari Karyawan
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Ketik nama atau NIK..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {userSearch.length > 0 && userSearch.length < 2 && (
                    <p className="text-xs text-gray-500 mt-1">Ketik minimal 2 karakter</p>
                  )}
                </div>

                {/* Search Results */}
                {searchingUsers ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.nopeg}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {userSearch ? 'User tidak ditemukan' : 'Ketik untuk mencari...'}
                  </div>
                )}
                
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan (Opsional)
                    </label>
                    <textarea
                        className="w-full border rounded-lg p-2 text-sm"
                        placeholder="Contoh: Kondisi aset baik saat diserahkan"
                        value={assignNotes}
                        onChange={(e) => setAssignNotes(e.target.value)}
                    />
                </div>

                <div className="flex justify-end pt-4 mt-2 border-t border-gray-100">
                    <Button 
                        onClick={handleAssign} 
                        disabled={!selectedUser || assigning}
                        isLoading={assigning}
                    >
                        Simpan
                    </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Kembalikan Aset</h2>
              <button 
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturn}>
                <div className="mb-4">
                    <div className="bg-orange-50 p-3 rounded-lg flex gap-3 mb-4">
                        <RotateCcw className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <div className="text-sm text-orange-800">
                            <p className="font-medium">Konfirmasi Pengembalian</p>
                            <p className="mt-1">
                                Aset akan dikembalikan ke stok dan status kepemilikan user saat ini akan dicabut.
                            </p>
                        </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lokasi Pengembalian (Opsional)
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={returnForm.location_id}
                        onChange={(e) => setReturnForm({ ...returnForm, location_id: e.target.value })}
                        disabled={loadingLocations}
                    >
                        <option value="">-- Pilih Lokasi (Biarkan kosong jika tetap) --</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.code})
                            </option>
                        ))}
                    </select>
                    {loadingLocations && <p className="text-xs text-gray-500 mb-2">Memuat lokasi...</p>}

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catatan / Kondisi
                    </label>
                    <textarea
                        required
                        className="w-full border border-gray-300 rounded-lg p-2 min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Contoh: Aset dikembalikan dalam kondisi baik."
                        value={returnForm.notes}
                        onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button 
                        type="button"
                        variant="ghost" 
                        onClick={() => setShowReturnModal(false)}
                    >
                        Batal
                    </Button>
                    <Button 
                        type="submit"
                        isLoading={returning}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        Kembalikan Aset
                    </Button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Ubah Lokasi</h2>
              <Button variant="ghost" size="sm" onClick={closeLocationModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loadingLocations ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Lokasi
                  </label>
                  <select
                    value={selectedLocation || ''}
                    onChange={(e) => setSelectedLocation(Number(e.target.value) || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Lokasi --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} ({loc.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={closeLocationModal}>
                    Batal
                  </Button>
                  <Button 
                    onClick={handleSaveLocation} 
                    disabled={!selectedLocation}
                    isLoading={savingLocation}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Aset</h2>
              <Button variant="ghost" size="sm" onClick={closeEditModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aset *</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nama aset"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Merek</label>
                  <Input
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    placeholder="Contoh: Dell"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <Input
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    placeholder="Contoh: Latitude 5520"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Seri</label>
                <Input
                  value={editForm.serial_number}
                  onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })}
                  placeholder="Serial number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembelian</label>
                  <Input
                    type="date"
                    value={editForm.purchase_date}
                    onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garansi Berakhir</label>
                  <Input
                    type="date"
                    value={editForm.warranty_end}
                    onChange={(e) => setEditForm({ ...editForm, warranty_end: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Pembelian (Rp)</label>
                <Input
                  type="number"
                  value={editForm.purchase_price}
                  onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Umur Ekonomis (Thn)</label>
                  <Input
                    type="number"
                    value={editForm.useful_life_years}
                    onChange={(e) => setEditForm({ ...editForm, useful_life_years: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nilai Sisa (Rp)</label>
                  <Input
                    type="number"
                    value={editForm.residual_value}
                    onChange={(e) => setEditForm({ ...editForm, residual_value: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeEditModal}>Batal</Button>
                <Button onClick={handleSaveEdit} isLoading={savingEdit} disabled={!editForm.name}>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Retire Modal */}
      {showRetireModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Penghapusan Aset
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowRetireModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleRetire}>
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 border border-red-200">
                  <p className="font-bold mb-1">Peringatan!</p>
                  Aset ini akan dihapus secara permanen dari daftar aktif. Aksi ini akan tercatat dalam riwayat namun aset tidak dapat digunakan kembali.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan Penghapusan *
                  </label>
                  <textarea
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-red-500 focus:outline-none"
                    placeholder="Contoh: Rusak total dan tidak dapat diperbaiki, Dijual, atau Didonasikan..."
                    value={retireReason}
                    onChange={(e) => setRetireReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowRetireModal(false)}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  isLoading={retiring}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Aset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Modal */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Lapor Aset Hilang
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowLostModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleMarkLost}>
              <div className="space-y-4">
                <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 border border-orange-200">
                  Status aset akan diubah menjadi <strong>LOST</strong>. Silakan isi kronologi kejadian.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kronologi / Catatan *
                  </label>
                  <textarea
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder="Jelaskan bagaimana aset bisa hilang..."
                    value={lostNotes}
                    onChange={(e) => setLostNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowLostModal(false)}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  isLoading={markingLost}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                >
                  Laporkan Hilang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Found Modal */}
      {showFoundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-green-600 flex items-center gap-2">
                <Check className="w-5 h-5" />
                Lapor Aset Ditemukan
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFoundModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleMarkFound}>
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg text-sm text-green-800 border border-green-200">
                  Aset yang ditemukan akan dikembalikan ke stok. Silakan update lokasinya.
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lokasi Ditemukan
                    </label>
                    <select
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                        value={foundForm.location_id}
                        onChange={(e) => setFoundForm({ ...foundForm, location_id: e.target.value })}
                        disabled={loadingLocations}
                    >
                        <option value="">-- Pilih Lokasi (Opsional) --</option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name} ({loc.code})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Penemuan
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-green-500 focus:outline-none"
                    placeholder="Catatan kondisi aset saat ditemukan..."
                    value={foundForm.notes}
                    onChange={(e) => setFoundForm({ ...foundForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" type="button" onClick={() => setShowFoundModal(false)}>
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  isLoading={markingFound}
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Simpan Status
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Attachment Confirmation Modal */}
      {deleteAttachmentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Hapus File?</h2>
              <Button variant="ghost" size="sm" onClick={() => setDeleteAttachmentId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Apakah Anda yakin ingin menghapus file ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteAttachmentId(null)} disabled={deletingAttachment}>
                Batal
              </Button>
              <Button 
                onClick={confirmDeleteAttachment} 
                isLoading={deletingAttachment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
