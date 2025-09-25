import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiResponse } from '@advisor-ai/shared';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${this.client.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data.data!;
        const currentRefreshToken = this.getRefreshToken()!;
        this.setTokens(accessToken, currentRefreshToken);

        return accessToken;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>>('/auth/login', { email, password });

    if (response.data.success) {
      this.setTokens(
        response.data.data!.tokens.accessToken,
        response.data.data!.tokens.refreshToken
      );
    }

    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post<ApiResponse<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>>('/auth/register', data);

    if (response.data.success) {
      this.setTokens(
        response.data.data!.tokens.accessToken,
        response.data.data!.tokens.refreshToken
      );
    }

    return response.data;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    try {
      await this.client.post('/auth/logout', { refreshToken });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    const response = await this.client.get<ApiResponse<{ user: any }>>('/auth/me');
    return response.data;
  }

  // Business endpoints
  async getBusinesses() {
    const response = await this.client.get<ApiResponse<any[]>>('/businesses');
    return response.data;
  }

  async getBusiness(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/businesses/${id}`);
    return response.data;
  }

  async createBusiness(data: any) {
    const response = await this.client.post<ApiResponse<any>>('/businesses', data);
    return response.data;
  }

  async updateBusiness(id: string, data: any) {
    const response = await this.client.put<ApiResponse<any>>(`/businesses/${id}`, data);
    return response.data;
  }

  async getBusinessStats(id: string) {
    const response = await this.client.get<ApiResponse<any>>(`/businesses/${id}/stats`);
    return response.data;
  }

  // AI endpoints
  async generateAI(businessId: string, data: any) {
    const response = await this.client.post<ApiResponse<any>>(
      `/ai/generate/${businessId}`,
      data
    );
    return response.data;
  }

  async getAIHistory(businessId: string, moduleType?: string) {
    const params = moduleType ? { moduleType } : {};
    const response = await this.client.get<ApiResponse<any[]>>(
      `/ai/history/${businessId}`,
      { params }
    );
    return response.data;
  }

  async getAITemplates(moduleType: string) {
    const response = await this.client.get<ApiResponse<any[]>>(
      `/ai/templates/${moduleType}`
    );
    return response.data;
  }

  // Generic request method
  async request<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    const response = await this.client[method]<ApiResponse<T>>(url, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
