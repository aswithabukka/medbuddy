import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { patientsAPI } from '../api/patients';
import type { UpdatePatientProfileDto } from '@/types';

// Get my patient profile
export function useMyPatientProfile() {
  return useQuery({
    queryKey: ['my-patient-profile'],
    queryFn: () => patientsAPI.getMyProfile(),
  });
}

// Update patient profile
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientProfileDto) => patientsAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-patient-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to update profile';
      toast.error(message);
    },
  });
}

// Get conditions
export function useMyConditions() {
  return useQuery({
    queryKey: ['my-conditions'],
    queryFn: () => patientsAPI.getConditions(),
  });
}

// Add condition
export function useAddCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { condition: string; diagnosedAt?: string }) =>
      patientsAPI.addCondition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-conditions'] });
      queryClient.invalidateQueries({ queryKey: ['my-patient-profile'] });
      toast.success('Condition added successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to add condition';
      toast.error(message);
    },
  });
}

// Remove condition
export function useRemoveCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientsAPI.removeCondition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-conditions'] });
      queryClient.invalidateQueries({ queryKey: ['my-patient-profile'] });
      toast.success('Condition removed successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to remove condition';
      toast.error(message);
    },
  });
}
