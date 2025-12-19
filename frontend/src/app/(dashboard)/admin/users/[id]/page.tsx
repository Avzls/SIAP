'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Shield, User, Mail, Hash, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface UserDetail {
  id: number;
  nopeg: string;
  name: string;
  email: string;
  is_active: boolean;
  id_level: number;
  hris_user_id: string;
  created_at: string;
  roles: { id: number; name: string }[];
  permissions: string[];
}

interface Role {
  id: number;
  name: string;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, rolesRes] = await Promise.all([
          usersApi.get(Number(id)),
          usersApi.availableRoles(),
        ]);
        const userData = userRes.data.data;
        setUser(userData);
        setSelectedRoles(userData.roles.map((r: Role) => r.name));
        setAvailableRoles(rolesRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchData();
    }
  }, [id, mounted]);

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = async () => {
    setSaving(true);
    try {
      await usersApi.assignRoles(Number(id), selectedRoles);
      toast.success('Role berhasil diperbarui');
    } catch (error) {
      console.error('Failed to save roles:', error);
      toast.error('Gagal menyimpan role');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersApi.update(Number(id), { is_active: !user.is_active });
      setUser({ ...user, is_active: !user.is_active });
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Gagal mengubah status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Pengguna tidak ditemukan</h2>
        <Button className="mt-4" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Pengguna</h1>
          <p className="text-gray-500">Kelola informasi dan role pengguna</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2">
          <Card title="Informasi Pengguna">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">NIK</p>
                    <p className="font-medium font-mono">{user.nopeg}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Level</p>
                    <p className="font-medium">{user.id_level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">HRIS ID</p>
                    <p className="font-medium font-mono">{user.hris_user_id || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <div>
          <Card title="Status">
            <CardContent className="p-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                  user.is_active ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <User className={`w-8 h-8 ${user.is_active ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <p className={`text-lg font-semibold ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active ? 'Aktif' : 'Nonaktif'}
                </p>
                <Button
                  variant={user.is_active ? 'destructive' : 'success'}
                  className="mt-4 w-full"
                  onClick={handleToggleActive}
                  isLoading={saving}
                >
                  {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Assignment */}
      <Card title="Role Pengguna">
        <CardContent className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Pilih role yang akan diberikan ke pengguna. Role menentukan akses dan permission.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableRoles.map((role) => (
              <label
                key={role.id}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedRoles.includes(role.name)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => handleRoleToggle(role.name)}
                  className="sr-only"
                />
                <Shield className={`w-5 h-5 ${
                  selectedRoles.includes(role.name) ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  selectedRoles.includes(role.name) ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {role.name}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveRoles} isLoading={saving}>
              <Save className="w-4 h-4 mr-2" />
              Simpan Role
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
