import type {
  Audit,
  Brand,
  BrandGuidelines,
  ApprovalEvent,
} from './types';

const API_BASE = '/api';

export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    server: {
      online: boolean;
      port: number;
    };
    mysql: {
      configured: boolean;
      host: string;
      port: number;
      database: string;
      mode: string;
    };
    gemini: {
      configured: boolean;
      model: string;
      mode: string;
    };
  };
}

const TOKEN_STORAGE_KEY = 'brandguard_auth_token';
let currentAuthToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const authHeaders: Record<string, string> = {};
    if (currentAuthToken) {
      authHeaders['Authorization'] = `Bearer ${currentAuthToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options?.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      console.warn(`[API] HTTP ${res.status} on ${path}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] Network error on ${path}:`, err);
    return null;
  }
}

export const api = {
  async getHealth(): Promise<HealthResponse | null> {
    return request<HealthResponse>('/health');
  },

  async getBrands(): Promise<Brand[] | null> {
    return request<Brand[]>('/brands');
  },

  async createBrand(name: string, description: string): Promise<Brand | null> {
    return request<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async deleteBrand(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/brands/${id}`, {
      method: 'DELETE',
    });
    return Boolean(res?.success);
  },

  async getGuidelines(): Promise<BrandGuidelines[] | null> {
    return request<BrandGuidelines[]>('/guidelines');
  },

  async saveGuidelines(guidelines: BrandGuidelines): Promise<BrandGuidelines | null> {
    return request<BrandGuidelines>(`/guidelines/${guidelines.id}`, {
      method: 'PUT',
      body: JSON.stringify(guidelines),
    });
  },

  async getAudits(): Promise<Audit[] | null> {
    return request<Audit[]>('/audits');
  },

  async getAuditById(id: string): Promise<Audit | null> {
    return request<Audit>(`/audits/${id}`);
  },

  async createAudit(data: {
    title: string;
    campaign: string;
    contentType: Audit['contentType'];
    content: string;
    referenceUrl?: string;
    brandId: string;
    imageUrl?: string;
    imageName?: string;
    submitter?: string;
  }): Promise<Audit | null> {
    return request<Audit>('/audits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async runAudit(auditId: string): Promise<Audit | null> {
    return request<Audit>(`/audits/${auditId}/run`, {
      method: 'POST',
    });
  },

  async updateRevision(
    auditId: string,
    revisedContent: string,
    note: string,
    source: Audit['revisions'][number]['source']
  ): Promise<Audit | null> {
    return request<Audit>(`/audits/${auditId}/revisions`, {
      method: 'PUT',
      body: JSON.stringify({ revisedContent, note, source }),
    });
  },

  async updateFindingStatus(
    auditId: string,
    findingId: string,
    status: Audit['findings'][number]['status']
  ): Promise<Audit | null> {
    return request<Audit>(`/audits/${auditId}/findings/${findingId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async handleApproval(
    auditId: string,
    action: 'submit' | 'approve' | 'request-changes' | 'reject',
    reviewer?: string,
    comment?: string
  ): Promise<Audit | null> {
    return request<Audit>(`/audits/${auditId}/approval`, {
      method: 'POST',
      body: JSON.stringify({ action, reviewer, comment }),
    });
  },

  async getApprovalEvents(): Promise<ApprovalEvent[] | null> {
    return request<ApprovalEvent[]>('/approval-events');
  },

  async resetData(): Promise<boolean> {
    const res = await request<{ success: boolean }>('/settings/reset', {
      method: 'POST',
    });
    return Boolean(res?.success);
  },

  async getAuthStatus(): Promise<any> {
    return request<any>('/auth/status');
  },

  async getAuthMe(): Promise<any> {
    return request<any>('/auth/me');
  },

  async fetchSessionToken(role: string, name?: string, email?: string): Promise<{ token: string; user: any } | null> {
    const res = await request<{ token: string; user: any }>('/auth/token', {
      method: 'POST',
      body: JSON.stringify({ role, name, email }),
    });
    if (res?.token) {
      setAuthToken(res.token);
    }
    return res;
  },

  getAuthToken(): string | null {
    return getAuthToken();
  },

  setAuthToken(token: string | null) {
    setAuthToken(token);
  },
};
