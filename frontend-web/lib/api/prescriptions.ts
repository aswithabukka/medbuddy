import apiClient from './client';
import type {
  Prescription,
  CreatePrescriptionDto,
  AddMedicineDto,
  ApiResponse,
} from '@/types';

export const prescriptionsAPI = {
  // Create prescription
  create: async (data: CreatePrescriptionDto): Promise<ApiResponse<Prescription>> => {
    const response = await apiClient.post<ApiResponse<Prescription>>(
      '/prescriptions',
      data
    );
    return response.data;
  },

  // Get prescription by ID
  getById: async (id: string): Promise<ApiResponse<Prescription>> => {
    const response = await apiClient.get<ApiResponse<Prescription>>(
      `/prescriptions/${id}`
    );
    return response.data;
  },

  // Get patient's prescriptions
  getMyPrescriptions: async (): Promise<ApiResponse<Prescription[]>> => {
    const response = await apiClient.get<ApiResponse<Prescription[]>>(
      '/prescriptions/me'
    );
    return response.data;
  },

  // Download prescription PDF
  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/prescriptions/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Add medicine to prescription
  addMedicine: async (
    prescriptionId: string,
    data: AddMedicineDto
  ): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>(
      `/prescriptions/${prescriptionId}/medicines`,
      data
    );
    return response.data;
  },

  // Remove medicine from prescription
  removeMedicine: async (
    prescriptionId: string,
    medicineId: string
  ): Promise<ApiResponse> => {
    const response = await apiClient.delete<ApiResponse>(
      `/prescriptions/${prescriptionId}/medicines/${medicineId}`
    );
    return response.data;
  },
};
