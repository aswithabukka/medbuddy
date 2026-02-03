import apiClient from './client';
import type {
  PatientProfile,
  UpdatePatientProfileDto,
  PatientCondition,
  ApiResponse,
} from '@/types';

export const patientsAPI = {
  // Get my patient profile
  getMyProfile: async (): Promise<ApiResponse<PatientProfile>> => {
    const response = await apiClient.get<ApiResponse<PatientProfile>>('/patients/me/profile');
    return response.data;
  },

  // Update patient profile
  updateProfile: async (
    data: UpdatePatientProfileDto
  ): Promise<ApiResponse<PatientProfile>> => {
    const response = await apiClient.put<ApiResponse<PatientProfile>>(
      '/patients/me/profile',
      data
    );
    return response.data;
  },

  // Get profile history
  getProfileHistory: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/patients/me/profile/history');
    return response.data;
  },

  // Get conditions
  getConditions: async (): Promise<ApiResponse<PatientCondition[]>> => {
    const response = await apiClient.get<ApiResponse<PatientCondition[]>>(
      '/patients/me/conditions'
    );
    return response.data;
  },

  // Add condition
  addCondition: async (data: {
    condition: string;
    diagnosedAt?: string;
  }): Promise<ApiResponse<PatientCondition>> => {
    const response = await apiClient.post<ApiResponse<PatientCondition>>(
      '/patients/me/conditions',
      data
    );
    return response.data;
  },

  // Remove condition
  removeCondition: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/patients/me/conditions/${id}`
    );
    return response.data;
  },
};
