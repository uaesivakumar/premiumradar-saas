/**
 * S345: Admin Plane UI Action Bindings (Admin Plane v1.1)
 *
 * Client-side utilities for Admin Plane UI actions.
 * All mutations go through the API and emit business events.
 */

// ============================================================
// API CLIENT
// ============================================================

const API_BASE = '/api/superadmin';

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Admin Plane] API error:', error);
    return { success: false, error: 'Network error' };
  }
}

// ============================================================
// ENTERPRISE ACTIONS
// ============================================================

export interface Enterprise {
  enterprise_id: string;
  name: string;
  type: 'REAL' | 'DEMO';
  status: string;
  plan: string;
  region: string;
  created_at: Date;
}

export const enterpriseActions = {
  list: (params?: { status?: string; plan?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.plan) searchParams.set('plan', params.plan);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiCall<{ enterprises: Enterprise[]; total: number }>(
      `/enterprises?${searchParams.toString()}`
    );
  },

  get: (id: string) => apiCall<Enterprise>(`/enterprises/${id}`),

  create: (data: {
    name: string;
    type?: 'REAL' | 'DEMO';
    region?: string;
    plan?: string;
    max_users?: number;
  }) => apiCall<Enterprise>('/enterprises', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<Enterprise>) =>
    apiCall<Enterprise>(`/enterprises/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiCall<Enterprise>(`/enterprises/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// USER ACTIONS
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  enterprise_id: string | null;
  workspace_id: string | null;
  is_demo: boolean;
  is_active: boolean;
  created_at: Date;
}

export const userActions = {
  list: (params?: { enterprise_id?: string; role?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.enterprise_id) searchParams.set('enterprise_id', params.enterprise_id);
    if (params?.role) searchParams.set('role', params.role);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiCall<{ users: User[]; total: number }>(`/users?${searchParams.toString()}`);
  },

  get: (id: string) => apiCall<User>(`/users/${id}`),

  create: (data: {
    email: string;
    password: string;
    name?: string;
    role?: string;
    enterprise_id?: string;
    workspace_id?: string;
  }) => apiCall<User>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<User>) =>
    apiCall<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  changeRole: (id: string, role: string) =>
    apiCall<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  delete: (id: string) => apiCall<User>(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// WORKSPACE ACTIONS
// ============================================================

export interface Workspace {
  workspace_id: string;
  enterprise_id: string;
  name: string;
  sub_vertical_id: string;
  status: string;
  is_default: boolean;
  created_at: Date;
}

export const workspaceActions = {
  list: (params?: { enterprise_id?: string; status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.enterprise_id) searchParams.set('enterprise_id', params.enterprise_id);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiCall<{ workspaces: Workspace[]; total: number }>(
      `/workspaces?${searchParams.toString()}`
    );
  },

  get: (id: string) => apiCall<Workspace>(`/workspaces/${id}`),

  create: (data: {
    enterprise_id: string;
    name: string;
    sub_vertical_id: string;
    is_default?: boolean;
  }) => apiCall<Workspace>('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: string, data: Partial<Workspace>) =>
    apiCall<Workspace>(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) => apiCall<Workspace>(`/workspaces/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================================
// DEMO ACTIONS
// ============================================================

export interface Demo extends Enterprise {
  demo_expires_at: Date | null;
  days_remaining: number | null;
  is_expired: boolean;
  admin_email?: string;
}

export const demoActions = {
  list: () => apiCall<{ demos: Demo[]; total: number; stats: { active: number; expired: number } }>(
    '/demos'
  ),

  get: (id: string) => apiCall<Demo>(`/demos/${id}`),

  create: (data: {
    enterprise_name?: string;
    admin_email: string;
    admin_name?: string;
    admin_password?: string;
    sub_vertical_id: string;
    demo_days?: number;
    region?: string;
  }) => apiCall<{
    enterprise: Enterprise;
    workspace: Workspace;
    admin_user: User;
    temp_password: string;
    expires_at: Date;
  }>('/demos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  extend: (id: string, days: number = 14) =>
    apiCall<Demo>(`/demos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'extend', days }),
    }),

  convert: (id: string, plan: string = 'starter', options?: { max_users?: number; max_workspaces?: number }) =>
    apiCall<Demo>(`/demos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'convert', plan, ...options }),
    }),
};

// ============================================================
// AUDIT ACTIONS
// ============================================================

export interface AuditEvent {
  event_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_user_id: string;
  actor_email?: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export const auditActions = {
  query: (params?: {
    entity_type?: string;
    entity_id?: string;
    actor_id?: string;
    event_type?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.entity_type) searchParams.set('entity_type', params.entity_type);
    if (params?.entity_id) searchParams.set('entity_id', params.entity_id);
    if (params?.actor_id) searchParams.set('actor_id', params.actor_id);
    if (params?.event_type) searchParams.set('event_type', params.event_type);
    if (params?.from) searchParams.set('from', params.from.toISOString());
    if (params?.to) searchParams.set('to', params.to.toISOString());
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    return apiCall<{
      events: AuditEvent[];
      total: number;
      distribution: { event_type: string; count: number }[];
    }>(`/audit?${searchParams.toString()}`);
  },
};

// ============================================================
// EVIDENCE ACTIONS
// ============================================================

export interface EvidencePack {
  summary: string;
  timeline: Array<{
    timestamp: Date;
    event_type: string;
    description: string;
  }>;
  signals: Array<{
    signal_type: string;
    strength: 'high' | 'medium' | 'low';
    source: string;
  }>;
  counterfactuals: string[];
  confidence: 'High' | 'Medium' | 'Low';
  narrator_version: string;
}

export const evidenceActions = {
  generate: (entityType: 'USER' | 'ENTERPRISE' | 'WORKSPACE', entityId: string) =>
    apiCall<{
      entity_type: string;
      entity_id: string;
      entity_name: string;
      evidence_pack: EvidencePack;
      generated_at: string;
    }>(`/evidence?entity_type=${entityType}&entity_id=${entityId}`),
};

// ============================================================
// EXPORT ALL
// ============================================================

export default {
  enterprises: enterpriseActions,
  users: userActions,
  workspaces: workspaceActions,
  demos: demoActions,
  audit: auditActions,
  evidence: evidenceActions,
};
