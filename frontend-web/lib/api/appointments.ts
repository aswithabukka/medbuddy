import apiClient from './client';
import type {
  Appointment,
  CreateAppointmentDto,
  CancelAppointmentDto,
  ApiResponse,
} from '@/types';

interface RescheduleAppointmentDto {
  scheduledAt: string;
  durationMinutes?: number;
}

export const appointmentsAPI = {
  // Create appointment
  create: async (data: CreateAppointmentDto): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.post<ApiResponse<Appointment>>(
      '/appointments',
      data
    );
    return response.data;
  },

  // Get all appointments (filtered by role automatically on backend)
  getAll: async (params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ApiResponse<Appointment[]>> => {
    const response = await apiClient.get<ApiResponse<Appointment[]>>(
      '/appointments',
      { params }
    );
    return response.data;
  },

  // Get single appointment
  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.get<ApiResponse<Appointment>>(
      `/appointments/${id}`
    );
    return response.data;
  },

  // Cancel appointment
  cancel: async (
    id: string,
    data: CancelAppointmentDto
  ): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.put<ApiResponse<Appointment>>(
      `/appointments/${id}/cancel`,
      data
    );
    return response.data;
  },

  // Reschedule appointment
  reschedule: async (
    id: string,
    data: RescheduleAppointmentDto
  ): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.put<ApiResponse<Appointment>>(
      `/appointments/${id}/reschedule`,
      data
    );
    return response.data;
  },

  // Mark as completed (doctor only)
  complete: async (id: string): Promise<ApiResponse<Appointment>> => {
    const response = await apiClient.put<ApiResponse<Appointment>>(
      `/appointments/${id}/complete`
    );
    return response.data;
  },
};
