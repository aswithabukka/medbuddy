import apiClient from './client';
import type {
  ConsultationNote,
  UpdateConsultationNoteDto,
  ApiResponse,
} from '@/types';

export const consultationsAPI = {
  // Get SOAP template
  getSoapTemplate: async (): Promise<ApiResponse> => {
    const response = await apiClient.get<ApiResponse>('/consultations/soap-template');
    return response.data;
  },

  // Get consultation note for appointment
  getNote: async (appointmentId: string): Promise<ApiResponse<ConsultationNote>> => {
    const response = await apiClient.get<ApiResponse<ConsultationNote>>(
      `/consultations/${appointmentId}`
    );
    return response.data;
  },

  // Create or update consultation note (auto-save)
  createOrUpdateNote: async (
    appointmentId: string,
    data: UpdateConsultationNoteDto
  ): Promise<ApiResponse<ConsultationNote>> => {
    const response = await apiClient.put<ApiResponse<ConsultationNote>>(
      `/consultations/${appointmentId}`,
      data
    );
    return response.data;
  },

  // Finalize consultation note (lock editing)
  finalizeNote: async (
    appointmentId: string
  ): Promise<ApiResponse<ConsultationNote>> => {
    const response = await apiClient.post<ApiResponse<ConsultationNote>>(
      `/consultations/${appointmentId}/finalize`
    );
    return response.data;
  },
};
