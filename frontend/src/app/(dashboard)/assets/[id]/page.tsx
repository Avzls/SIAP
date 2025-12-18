'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { assetsApi } from '@/lib/api';
import { Asset, AssetMovement } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
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
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'overview' | 'history' | 'attachments';

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await assetsApi.get(id as string);
        setAsset(data);
      } catch (err) {
        console.error('Failed to fetch asset:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

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
        <h2 className="text-2xl font-bold text-gray-900">Asset not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
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
            Back
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
            Edit Asset
          </Button>
          {asset.status.value === 'IN_STOCK' && (
            <Button>Assign Asset</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Info },
            { id: 'history', label: 'Movement History', icon: History },
            { id: 'attachments', label: 'Attachments', icon: Paperclip },
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
              <Card title="Asset Information">
                <div className="grid grid-cols-2 gap-6 p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Tag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.category?.name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Box className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Brand / Model</p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase">Serial Number</p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase">Purchase Date</p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase">Purchase Price</p>
                        <p className="text-sm font-semibold text-gray-900">{asset.purchase_price || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Warranty End</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {asset.warranty_end ? format(new Date(asset.warranty_end), 'dd MMM yyyy') : '-'}
                          {asset.is_under_warranty && (
                            <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Specifications */}
              <Card title="Specifications">
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
                    <p className="text-sm text-gray-500">No specifications provided.</p>
                  )}
                </div>
              </Card>
            </>
          )}

          {activeTab === 'history' && (
            <Card title="Movement History">
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
                  <p className="text-sm text-gray-500 text-center py-4">No movement history found.</p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'attachments' && (
            <Card title="Attachments">
              <div className="p-6 text-center py-12">
                <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No attachments</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by uploading a photo or document.</p>
                <div className="mt-6">
                  <Button variant="outline">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Current Holder */}
          <Card title="Current Holder">
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
                       <Button size="sm" variant="outline" className="h-7 text-xs">View User</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">In Warehouse / No holder</p>
                </div>
              )}
            </div>
          </Card>

          {/* Current Location */}
          <Card title="Current Location">
            <div className="p-6">
              {asset.current_location ? (
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{asset.current_location.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{asset.current_location.code}</p>
                    <div className="mt-3 flex space-x-2">
                       <Button size="sm" variant="outline" className="h-7 text-xs">Change Location</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">Location not assigned</p>
                </div>
              )}
            </div>
          </Card>

          {/* QR Code */}
          <Card title="Asset Label">
            <div className="p-6 text-center">
              <div className="bg-gray-50 p-4 rounded-xl inline-block mb-4 border-2 border-dashed border-gray-200">
                {/* Mock QR */}
                <div className="w-32 h-32 bg-white flex items-center justify-center relative">
                  <div className="w-full h-full p-2">
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-[10px] text-center font-mono overflow-hidden">
                      {asset.asset_tag}
                    </div>
                  </div>
                  <div className="absolute inset-0 border-2 border-slate-900 opacity-20"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Print this label to attach on the asset.</p>
              <Button variant="outline" className="w-full" size="sm">
                Print QR Label
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
