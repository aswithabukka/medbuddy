import apiClient from './client';
import type { ApiResponse } from '@/types';

interface VideoTokenResponse {
  token: string;
  roomName: string;
  identity: string;
}

export const videoAPI = {
  getToken: async (appointmentId: string): Promise<ApiResponse<VideoTokenResponse>> => {
    const response = await apiClient.post<ApiResponse<VideoTokenResponse>>(
      `/video/${appointmentId}/token`
    );
    return response.data;
  },

  endSession: async (appointmentId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `/video/${appointmentId}/end`
    );
    return response.data;
  },
};
