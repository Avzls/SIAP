import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (nopeg: string, password: string) => api.post('/auth/login', { nopeg, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string, newPasswordConfirmation: string) => 
    api.post('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    }),
};

// Assets API
export const assetsApi = {
  list: (params?: Record<string, unknown>) => api.get('/assets', { params }),
  get: (id: number | string) => api.get(`/assets/${id}`),
  create: (data: Record<string, unknown>) => api.post('/assets', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/assets/${id}`, data),
  delete: (id: number) => api.delete(`/assets/${id}`),
  available: (params?: Record<string, unknown>) => api.get('/assets/available', { params }),
  movements: (id: number) => api.get(`/assets/${id}/movements`),
  // Actions
  assign: (id: number, data: { user_id: number; notes?: string }) => 
    api.post(`/assets/${id}/assign`, data),
  return: (id: number, data?: { location_id?: number; notes?: string }) => 
    api.post(`/assets/${id}/return`, data),
  transfer: (id: number, data: { user_id: number; notes?: string }) => 
    api.post(`/assets/${id}/transfer`, data),
  // Attachments
  attachments: (id: number) => api.get(`/assets/${id}/attachments`),
  uploadAttachment: (id: number, formData: FormData) => 
    api.post(`/assets/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  deleteAttachment: (assetId: number, attachmentId: number) => 
    api.delete(`/assets/${assetId}/attachments/${attachmentId}`),
  // Import
  import: (formData: FormData) => 
    api.post('/assets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  importFormat: () => api.get('/assets/import/format'),
};

// Requests API
export const requestsApi = {
  list: (params?: Record<string, unknown>) => api.get('/requests', { params }),
  get: (id: number) => api.get(`/requests/${id}`),
  create: (data: Record<string, unknown>) => api.post('/requests', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/requests/${id}`, data),
  delete: (id: number) => api.delete(`/requests/${id}`),
  submit: (id: number) => api.post(`/requests/${id}/submit`),
  cancel: (id: number) => api.post(`/requests/${id}/cancel`),
};

// Approvals API
export const approvalsApi = {
  pending: () => api.get('/approvals/pending'),
  history: () => api.get('/approvals/history'),
  approve: (requestId: number, remarks?: string) => 
    api.post(`/requests/${requestId}/approve`, { remarks }),
  reject: (requestId: number, reason: string) => 
    api.post(`/requests/${requestId}/reject`, { reason }),
};

// Admin API
export const adminApi = {
  pendingFulfillment: () => api.get('/admin/requests/pending'),
  availableAssets: (categoryId?: number) => 
    api.get('/admin/assets/available', { params: { category_id: categoryId } }),
  fulfill: (requestId: number, data: { fulfillments: Array<{ item_id: number; asset_id: number }>; notes?: string }) =>
    api.post(`/admin/requests/${requestId}/fulfill`, data),
  fulfillReturn: (requestId: number, data?: { location_id?: number; notes?: string }) =>
    api.post(`/admin/requests/${requestId}/fulfill-return`, data),
  fulfillTransfer: (requestId: number, data?: { notes?: string }) =>
    api.post(`/admin/requests/${requestId}/fulfill-transfer`, data),
};

// Dashboard API
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// Users API (Admin)
export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  get: (id: number) => api.get(`/admin/users/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  assignRoles: (id: number, roles: string[]) => api.post(`/admin/users/${id}/roles`, { roles }),
  availableRoles: () => api.get('/admin/users/roles'),
  search: (params?: { search?: string }) => api.get('/admin/users/search', { params }),
};

// Roles API (Admin)
export const rolesApi = {
  list: () => api.get('/admin/roles'),
  get: (id: number) => api.get(`/admin/roles/${id}`),
  create: (data: { name: string; permissions?: string[] }) => api.post('/admin/roles', data),
  update: (id: number, data: { name?: string; permissions?: string[] }) => api.put(`/admin/roles/${id}`, data),
  delete: (id: number) => api.delete(`/admin/roles/${id}`),
  permissions: () => api.get('/admin/roles/permissions'),
};

// Reports API (Admin)
export const reportsApi = {
  assetsSummary: (params?: { category_id?: number; location_id?: number }) => 
    api.get('/reports/assets-summary', { params }),
  movements: (params?: { from_date?: string; to_date?: string; type?: string; per_page?: number }) => 
    api.get('/reports/movements', { params }),
  requests: (params?: { from_date?: string; to_date?: string; status?: string }) => 
    api.get('/reports/requests', { params }),
};

// Master Data API (Admin)
export const masterDataApi = {
  // Categories
  categories: (params?: { search?: string; active_only?: boolean }) => 
    api.get('/master/categories', { params }),
  createCategory: (data: { code: string; name: string; description?: string; requires_approval?: boolean; is_active?: boolean }) => 
    api.post('/master/categories', data),
  updateCategory: (id: number, data: { code: string; name: string; description?: string; requires_approval?: boolean; is_active?: boolean }) => 
    api.put(`/master/categories/${id}`, data),
  deleteCategory: (id: number) => 
    api.delete(`/master/categories/${id}`),

  // Locations
  locations: (params?: { search?: string; active_only?: boolean }) => 
    api.get('/master/locations', { params }),
  createLocation: (data: { code: string; name: string; building?: string; floor?: string; room?: string; address?: string; is_active?: boolean }) => 
    api.post('/master/locations', data),
  updateLocation: (id: number, data: { code: string; name: string; building?: string; floor?: string; room?: string; address?: string; is_active?: boolean }) => 
    api.put(`/master/locations/${id}`, data),
  deleteLocation: (id: number) => 
    api.delete(`/master/locations/${id}`),
};

// Notifications API
export const notificationsApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};
