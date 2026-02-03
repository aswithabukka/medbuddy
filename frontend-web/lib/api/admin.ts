import apiClient from './client';
import type { ApiResponse } from '@/types';

export const adminAPI = {
  getPendingDoctors: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/doctors/pending');
    return response.data;
  },

  approveDoctor: async (userId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/admin/doctors/${userId}/approve`);
    return response.data;
  },

  rejectDoctor: async (userId: string, reason: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/admin/doctors/${userId}/reject`, {
      reason,
    });
    return response.data;
  },

  sendReminder: async (userId: string, title: string, message: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(`/admin/doctors/${userId}/remind`, {
      title,
      message,
    });
    return response.data;
  },

  getReminders: async (userId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>(`/admin/doctors/${userId}/reminders`);
    return response.data;
  },

  getAllDoctors: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/doctors');
    return response.data;
  },

  getAllPatients: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/patients');
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/stats');
    return response.data;
  },
};
