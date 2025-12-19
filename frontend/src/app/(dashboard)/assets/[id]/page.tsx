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
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'overview' | 'history' | 'attachments';

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
      alert(`Aset berhasil ditetapkan ke ${selectedUser.name}`);
      closeAssignModal();
      // Refresh asset data
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
      setMovements([]); // Reset to refetch
    } catch (err) {
      console.error('Failed to assign asset:', err);
      alert('Gagal menetapkan aset');
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
      alert('Lokasi berhasil diubah');
      closeLocationModal();
      // Refresh asset data
      const response = await assetsApi.get(id as string);
      setAsset(response.data.data);
    } catch (err) {
      console.error('Failed to save location:', err);
      alert('Gagal mengubah lokasi');
    } finally {
      setSavingLocation(false);
    }
  };

  // Print QR Label
  const printLabel = () => {
    if (!asset) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocker aktif. Izinkan popup untuk mencetak label.');
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
          <Button variant="outline">
            Edit Aset
          </Button>
          {asset.status.value === 'IN_STOCK' && (
            <Button onClick={openAssignModal}>
              <UserPlus className="w-4 h-4 mr-2" />
              Tetapkan Pemegang
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Ringkasan', icon: Info },
            { id: 'history', label: 'Riwayat Perpindahan', icon: History },
            { id: 'attachments', label: 'Lampiran', icon: Paperclip },
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
              <div className="p-6 text-center py-12">
                <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada lampiran</h3>
                <p className="mt-1 text-sm text-gray-500">Unggah foto atau dokumen untuk memulai.</p>
                <div className="mt-6">
                  <Button variant="outline">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Unggah File
                  </Button>
                </div>
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
                       <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openLocationModal}>Ubah Lokasi</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">Lokasi belum ditetapkan</p>
                  <Button size="sm" variant="outline" className="mt-3 h-7 text-xs" onClick={openLocationModal}>Tetapkan Lokasi</Button>
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">NIK: {user.nopeg}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : userSearch.length >= 2 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Tidak ada hasil</p>
                ) : null}
              </>
            )}

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan (opsional)
              </label>
              <Input
                placeholder="Catatan untuk assignment ini..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={closeAssignModal}>
                Batal
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={!selectedUser}
                isLoading={assigning}
              >
                <Check className="w-4 h-4 mr-2" />
                Tetapkan
              </Button>
            </div>
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
    </div>
  );
}
