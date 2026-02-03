import apiClient from './client';
import type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  ApiResponse,
} from '@/types';

export const authAPI = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { accessToken: string };
    }>('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/forgot-password', {
      email,
    });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/verify-email', {
      token,
    });
    return response.data;
  },
};
