'use client';

import { useEffect, useState } from 'react';
import { rolesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Plus, Trash2, Edit, Users, Key, X, Check } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  permissions: string[];
  users_count: number;
}

interface Permission {
  id: number;
  name: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const systemRoles = ['super_admin', 'asset_admin', 'approver', 'employee'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rolesApi.list(),
        rolesApi.permissions(),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    try {
      await rolesApi.create({ name: newRoleName, permissions: selectedPermissions });
      setShowCreateModal(false);
      setNewRoleName('');
      setSelectedPermissions([]);
      fetchData();
    } catch (error) {
      console.error('Failed to create role:', error);
      alert('Gagal membuat role');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await rolesApi.update(editingRole.id, { permissions: selectedPermissions });
      setEditingRole(null);
      setSelectedPermissions([]);
      fetchData();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Gagal mengupdate role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (systemRoles.includes(role.name)) {
      alert('Role sistem tidak dapat dihapus');
      return;
    }
    if (!confirm(`Hapus role "${role.name}"?`)) return;
    try {
      await rolesApi.delete(role.id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert('Gagal menghapus role');
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions);
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName)
        ? prev.filter((p) => p !== permName)
        : [...prev, permName]
    );
  };

  // Group permissions by category (prefix before the dot)
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const parts = perm.name.split('.');
    const category = parts[0];
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get action name from permission (part after the category)
  const getActionName = (permName: string) => {
    const parts = permName.split('.');
    return parts.slice(1).join('.');
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
  };

  // Toggle all permissions in a category
  const toggleCategory = (category: string) => {
    const categoryPerms = groupedPermissions[category]?.map(p => p.name) || [];
    const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  // Check if all permissions in category are selected
  const isCategorySelected = (category: string) => {
    const categoryPerms = groupedPermissions[category]?.map(p => p.name) || [];
    return categoryPerms.length > 0 && categoryPerms.every(p => selectedPermissions.includes(p));
  };

  // Check if some (but not all) permissions in category are selected
  const isCategoryPartial = (category: string) => {
    const categoryPerms = groupedPermissions[category]?.map(p => p.name) || [];
    const selectedCount = categoryPerms.filter(p => selectedPermissions.includes(p)).length;
    return selectedCount > 0 && selectedCount < categoryPerms.length;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'asset_admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'approver': return 'bg-green-100 text-green-700 border-green-200';
      case 'employee': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Role</h1>
          <p className="text-gray-500">Kelola role dan permission akses</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Buat Role Baru
        </Button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getRoleBadgeColor(role.name)}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-xs text-gray-500">
                        {role.permissions.length} permission
                      </p>
                    </div>
                  </div>
                  {!systemRoles.includes(role.name) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{role.users_count} pengguna</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Key className="w-4 h-4" />
                    <span>{role.permissions.length} permission</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {role.permissions.slice(0, 3).map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      +{role.permissions.length - 3} lainnya
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openEditModal(role)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Permission
                  {systemRoles.includes(role.name) && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-600 rounded">
                      Sistem
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Buat Role Baru</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Role
                </label>
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Contoh: finance_admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-4">
                  {Object.keys(groupedPermissions).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Belum ada permission
                    </p>
                  )}
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isCategorySelected(category)}
                          ref={(el) => {
                            if (el) el.indeterminate = isCategoryPartial(category);
                          }}
                          onChange={() => toggleCategory(category)}
                          className="rounded"
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCategoryName(category)}
                        </span>
                      </div>
                      <div className="ml-6 grid grid-cols-2 gap-1">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.name)}
                              onChange={() => togglePermission(perm.name)}
                              className="rounded text-blue-600"
                            />
                            <span className="text-sm text-gray-600">{getActionName(perm.name)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Batal
              </Button>
              <Button onClick={handleCreateRole} isLoading={saving}>
                <Check className="w-4 h-4 mr-2" />
                Buat Role
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Permission: {editingRole.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingRole(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <div className="max-h-80 overflow-y-auto border rounded-lg p-3 space-y-4">
                {Object.keys(groupedPermissions).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada permission
                  </p>
                )}
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isCategorySelected(category)}
                        ref={(el) => {
                          if (el) el.indeterminate = isCategoryPartial(category);
                        }}
                        onChange={() => toggleCategory(category)}
                        className="rounded"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {formatCategoryName(category)}
                      </span>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-1">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.name)}
                            onChange={() => togglePermission(perm.name)}
                            className="rounded text-blue-600"
                          />
                          <span className="text-sm text-gray-600">{getActionName(perm.name)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingRole(null)}>
                Batal
              </Button>
              <Button onClick={handleUpdateRole} isLoading={saving}>
                <Check className="w-4 h-4 mr-2" />
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
