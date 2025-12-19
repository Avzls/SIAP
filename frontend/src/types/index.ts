export interface User {
  id: number;
  hris_user_id: string;
  nopeg: string;
  name: string;
  email: string;
  id_level: number;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  pending_approvals: number;
}

export interface Asset {
  id: number;
  asset_tag: string;
  name: string;
  status: {
    value: string;
    label: string;
    color: string;
  };
  category?: {
    id: number;
    code: string;
    name: string;
  };
  current_user?: {
    id: number;
    name: string;
    nopeg: string;
  };
  current_location?: {
    id: number;
    code: string;
    name: string;
  };
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: string;
  useful_life_years?: number;
  residual_value?: string;
  warranty_end?: string;
  is_under_warranty: boolean;
  specifications?: Record<string, unknown>;
  notes?: string;
  qr_data: string;
  created_at: string;
  updated_at: string;
}

export interface AssetMovement {
  id: number;
  asset?: {
    id: number;
    asset_tag: string;
    name: string;
  };
  movement_type: {
    value: string;
    label: string;
    icon: string;
  };
  from_status?: string;
  to_status: string;
  from_user?: {
    id: number;
    name: string;
    nopeg: string;
  };
  to_user?: {
    id: number;
    name: string;
    nopeg: string;
  };
  from_location?: {
    id: number;
    name: string;
  };
  to_location?: {
    id: number;
    name: string;
  };
  performer: {
    id: number;
    name: string;
  };
  request_id?: number;
  notes?: string;
  summary: string;
  created_at: string;
}

export interface AssetRequest {
  id: number;
  request_number: string;
  request_type: {
    value: string;
    label: string;
  };
  status: {
    value: string;
    label: string;
    color: string;
  };
  requester?: {
    id: number;
    name: string;
    nopeg: string;
    email: string;
  };
  justification?: string;
  rejection_reason?: string;
  items?: AssetRequestItem[];
  approvals?: AssetRequestApproval[];
  fulfiller?: {
    id: number;
    name: string;
  };
  fulfilled_at?: string;
  fulfillment_notes?: string;
  can_edit: boolean;
  can_submit: boolean;
  can_cancel: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetRequestItem {
  id: number;
  category?: {
    id: number;
    name: string;
  };
  quantity: number;
  specifications?: string;
  asset?: {
    id: number;
    asset_tag: string;
    name: string;
  };
  transfer_to_user?: {
    id: number;
    name: string;
  };
  fulfilled_asset?: {
    id: number;
    asset_tag: string;
    name: string;
  };
  notes?: string;
  description: string;
  is_fulfilled: boolean;
}

export interface AssetRequestApproval {
  id: number;
  approver: {
    id: number;
    name: string;
  };
  status: {
    value: string;
    label: string;
    color: string;
  };
  remarks?: string;
  decided_at?: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  requires_approval: boolean;
  is_active: boolean;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  address?: string;
  is_active: boolean;
}
