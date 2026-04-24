const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

function getToken(): string | null {
  return localStorage.getItem('access_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      const retry = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      if (!retry.ok) throw new Error(await retry.text());
      // Check if response is a file download
      const ct = retry.headers.get('content-type');
      if (ct && (ct.includes('spreadsheet') || ct.includes('csv') || ct.includes('wordprocessing'))) {
        return retry.blob() as unknown as T;
      }
      return retry.json();
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error de servidor' }));
    throw new Error(error.detail || 'Error de servidor');
  }

  // Handle file downloads
  const ct = response.headers.get('content-type');
  if (ct && (ct.includes('spreadsheet') || ct.includes('csv') || ct.includes('wordprocessing'))) {
    return response.blob() as unknown as T;
  }

  return response.json();
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Auth
export const api = {
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request('/auth/me'),

  getUsers: () => request('/auth/users'),

  createUser: (data: Record<string, unknown>) =>
    request('/auth/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: number, data: Record<string, unknown>) =>
    request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Fuentes
  getFuentes: () => request('/fuentes/'),
  createFuente: (data: Record<string, unknown>) =>
    request('/fuentes/', { method: 'POST', body: JSON.stringify(data) }),
  updateFuente: (id: number, data: Record<string, unknown>) =>
    request(`/fuentes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFuente: (id: number) =>
    request(`/fuentes/${id}`, { method: 'DELETE' }),

  // Escaneo
  scanFuente: (fuente_id: number) =>
    request('/escaneo/manual', { method: 'POST', body: JSON.stringify({ fuente_id }) }),
  addManualLink: (url: string, fuente_id?: number) =>
    request('/escaneo/link', { method: 'POST', body: JSON.stringify({ url, fuente_id }) }),
  getScanStatus: () => request('/escaneo/status'),

  // Registros
  getApprovalQueue: () => request(`/registros/cola?_t=${Date.now()}`),
  getRegistros: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/registros/?${query}`);
  },
  getRegistroCount: (estado?: string) => {
    const query = estado ? `?estado=${estado}` : '';
    return request(`/registros/count${query}`);
  },
  getRegistro: (id: number) => request(`/registros/${id}`),
  approveRegistro: (id: number, data?: Record<string, unknown>) =>
    request(`/registros/${id}/aprobar`, { method: 'POST', body: JSON.stringify(data || {}) }),
  rejectRegistro: (id: number, motivo: string) =>
    request(`/registros/${id}/rechazar`, { method: 'POST', body: JSON.stringify({ motivo_rechazo: motivo }) }),
  batchAction: (ids: number[], action: string, motivo?: string) =>
    request('/registros/batch', {
      method: 'POST',
      body: JSON.stringify({ ids, action, motivo_rechazo: motivo }),
    }),

  // Exportación
  exportRegistros: (data: Record<string, unknown>) =>
    request('/exportacion/', { method: 'POST', body: JSON.stringify(data) }),

  // Prompts
  getPrompts: () => request('/prompts/'),
  createPrompt: (data: Record<string, unknown>) =>
    request('/prompts/', { method: 'POST', body: JSON.stringify(data) }),
  updatePrompt: (id: number, data: Record<string, unknown>) =>
    request(`/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
