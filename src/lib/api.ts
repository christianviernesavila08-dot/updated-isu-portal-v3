const apiBase = (() => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5138`;
  }

  return 'http://localhost:5138';
})();

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${apiBase}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    return response.json();
  } catch (error: any) {
    if (error instanceof TypeError) {
      throw new Error(`Failed to reach API at ${url}. Make sure the backend is running and accessible.`);
    }
    throw error;
  }
}

export interface AuthResponse {
  id: string;
  username: string;
  displayName: string;
}

export interface Ratings {
  quality: number;
  price: number;
  delivery: number;
  completeness: number;
  afterSales: number;
}

export interface EvaluationEntry {
  supplierName: string;
  purchaseOrderNo: string;
  address: string;
  ratings: Ratings;
  comments: string;
}

export interface EvaluationBatchRequest {
  batchId?: string;
  batchName: string;
  dateOfEvaluation: string;
  designation: string;
  department: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluations: EvaluationEntry[];
}

export interface EvaluationRecord {
  id: string;
  batchId: string;
  batchName: string;
  supplierName: string;
  purchaseOrderNo: string;
  address: string;
  ratings: Ratings;
  comments: string;
  dateOfEvaluation: string;
  designation: string;
  department: string;
  evaluatorId: string;
  evaluatorName: string;
  averageScore: number;
  ratingCategory: string;
  createdAt?: any;
}

export interface UserStatsResponse {
  totalEvaluations: number;
  evaluationsToday: number;
  averageScore: number;
  recentRecords: EvaluationRecord[];
}

export async function signup(username: string, password: string, displayName: string) {
  return fetchJson<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName }),
  });
}

export async function login(username: string, password: string) {
  return fetchJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function submitEvaluationBatch(request: EvaluationBatchRequest) {
  return fetchJson<{ records: number }>('/api/evaluations/batch', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getUserStats(evaluatorId: string) {
  return fetchJson<UserStatsResponse>(`/api/evaluations/stats?evaluatorId=${encodeURIComponent(evaluatorId)}`);
}

export async function resetEvaluations(evaluatorId: string) {
  return fetchJson<{ deleted: boolean }>(`/api/evaluations/reset?evaluatorId=${encodeURIComponent(evaluatorId)}`, {
    method: 'DELETE',
  });
}

export async function getAllEvaluations(evaluatorId: string) {
  return fetchJson<EvaluationRecord[]>(`/api/evaluations/all?evaluatorId=${encodeURIComponent(evaluatorId)}`);
}
