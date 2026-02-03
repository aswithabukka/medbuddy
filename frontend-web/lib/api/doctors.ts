import apiClient from './client';
import type {
  DoctorProfile,
  AvailableSlot,
  ApiResponse,
  UpdateDoctorProfileDto,
  DoctorAvailabilityTemplate,
  DoctorAvailability,
  CreateDateAvailabilityDto,
  Specialty,
} from '@/types';

interface SearchDoctorsParams {
  specialty?: string;
  minFee?: number;
  maxFee?: number;
  language?: string;
  name?: string;
}

export const doctorsAPI = {
  // Public endpoints
  search: async (params: SearchDoctorsParams): Promise<ApiResponse<DoctorProfile[]>> => {
    const response = await apiClient.get<ApiResponse<DoctorProfile[]>>('/doctors/search', {
      params,
    });
    return response.data;
  },

  getById: async (userId: string): Promise<ApiResponse<DoctorProfile>> => {
    const response = await apiClient.get<ApiResponse<DoctorProfile>>(`/doctors/${userId}/profile`);
    return response.data;
  },

  getSlots: async (userId: string, date: string): Promise<ApiResponse<AvailableSlot[]>> => {
    const response = await apiClient.get<ApiResponse<AvailableSlot[]>>(
      `/doctors/${userId}/slots`,
      {
        params: { date },
      }
    );
    return response.data;
  },

  // Protected endpoints (doctor only)
  getMyProfile: async (): Promise<ApiResponse<DoctorProfile>> => {
    const response = await apiClient.get<ApiResponse<DoctorProfile>>('/doctors/me/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateDoctorProfileDto): Promise<ApiResponse<DoctorProfile>> => {
    const response = await apiClient.put<ApiResponse<DoctorProfile>>('/doctors/me/profile', data);
    return response.data;
  },

  // Availability management
  getMyAvailability: async (): Promise<ApiResponse<DoctorAvailabilityTemplate[]>> => {
    const response = await apiClient.get<ApiResponse<DoctorAvailabilityTemplate[]>>(
      '/doctors/me/availability'
    );
    return response.data;
  },

  createAvailability: async (
    data: Omit<DoctorAvailabilityTemplate, 'id' | 'doctorId'>
  ): Promise<ApiResponse<DoctorAvailabilityTemplate>> => {
    const response = await apiClient.post<ApiResponse<DoctorAvailabilityTemplate>>(
      '/doctors/me/availability',
      data
    );
    return response.data;
  },

  updateAvailability: async (
    id: string,
    data: Partial<DoctorAvailabilityTemplate>
  ): Promise<ApiResponse<DoctorAvailabilityTemplate>> => {
    const response = await apiClient.put<ApiResponse<DoctorAvailabilityTemplate>>(
      `/doctors/me/availability/${id}`,
      data
    );
    return response.data;
  },

  deleteAvailability: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/doctors/me/availability/${id}`
    );
    return response.data;
  },

  // Date-specific availability (New System)
  getDateAvailability: async (): Promise<ApiResponse<DoctorAvailability[]>> => {
    const response = await apiClient.get<ApiResponse<DoctorAvailability[]>>(
      '/doctors/me/date-availability'
    );
    return response.data;
  },

  createDateAvailability: async (
    data: CreateDateAvailabilityDto
  ): Promise<ApiResponse<DoctorAvailability>> => {
    const response = await apiClient.post<ApiResponse<DoctorAvailability>>(
      '/doctors/me/date-availability',
      data
    );
    return response.data;
  },

  deleteDateAvailability: async (id: string, mode: string = 'all', fromDate?: string): Promise<ApiResponse> => {
    const params: Record<string, string> = { mode };
    if (fromDate) params.fromDate = fromDate;
    const response = await apiClient.delete<ApiResponse>(
      `/doctors/me/date-availability/${id}`,
      { params }
    );
    return response.data;
  },

  // Certificates
  updateCertificates: async (certificates: { name: string; data: string }[]): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/doctors/me/certificates', {
      certificates,
    });
    return response.data;
  },

  // Profile photo
  updateProfilePhoto: async (profilePhoto: string | null): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>('/doctors/me/profile-photo', {
      profilePhoto,
    });
    return response.data;
  },

  // Specialties
  getSpecialties: async (): Promise<ApiResponse<Specialty[]>> => {
    const response = await apiClient.get<ApiResponse<Specialty[]>>('/specialties');
    return response.data;
  },

  // Languages
  getMyLanguages: async (): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/doctors/me/languages');
    return response.data;
  },

  addLanguage: async (language: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/doctors/me/languages', {
      language,
    });
    return response.data;
  },

  removeLanguage: async (id: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/doctors/me/languages/${id}`);
    return response.data;
  },

  // Specialty management for doctors
  addSpecialty: async (specialtyId: string): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/doctors/me/specialties', {
      specialtyId,
    });
    return response.data;
  },

  removeSpecialty: async (specialtyId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(`/doctors/me/specialties/${specialtyId}`);
    return response.data;
  },

  // Create a new specialty (for custom specialties)
  createSpecialty: async (name: string, description?: string): Promise<ApiResponse<Specialty>> => {
    const response = await apiClient.post<ApiResponse<Specialty>>('/specialties', {
      name,
      description,
    });
    return response.data;
  },

  // Notifications (admin reminders visible to doctor)
  getMyNotifications: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/doctors/me/notifications');
    return response.data;
  },

  markNotificationRead: async (notificationId: string): Promise<ApiResponse> => {
    const response = await apiClient.put<ApiResponse>(`/doctors/me/notifications/${notificationId}/read`);
    return response.data;
  },
};
