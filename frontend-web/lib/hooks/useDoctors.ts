import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { doctorsAPI } from '../api/doctors';
import type { UpdateDoctorProfileDto } from '@/types';

// Search doctors
interface SearchDoctorsParams {
  specialty?: string;
  minFee?: number;
  maxFee?: number;
  language?: string;
  name?: string;
}

export function useDoctors(params: SearchDoctorsParams = {}) {
  return useQuery({
    queryKey: ['doctors', params],
    queryFn: () => doctorsAPI.search(params),
  });
}

// Get single doctor by ID
export function useDoctor(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['doctor', userId],
    queryFn: () => doctorsAPI.getById(userId),
    enabled,
  });
}

// Get doctor slots
export function useDoctorSlots(userId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: ['doctor-slots', userId, date],
    queryFn: () => doctorsAPI.getSlots(userId, date),
    enabled: enabled && !!date,
  });
}

// Get my doctor profile
export function useMyDoctorProfile() {
  return useQuery({
    queryKey: ['my-doctor-profile'],
    queryFn: () => doctorsAPI.getMyProfile(),
  });
}

// Update doctor profile
export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDoctorProfileDto) => doctorsAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    },
  });
}

// Get specialties
export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: () => doctorsAPI.getSpecialties(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
}

// Get my availability
export function useMyAvailability() {
  return useQuery({
    queryKey: ['my-availability'],
    queryFn: () => doctorsAPI.getMyAvailability(),
  });
}

// Create availability
export function useCreateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsAPI.createAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Availability created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create availability';
      toast.error(message);
    },
  });
}

// Delete availability
export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doctorsAPI.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-availability'] });
      toast.success('Availability deleted successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete availability';
      toast.error(message);
    },
  });
}

// Get my languages
export function useMyLanguages() {
  return useQuery({
    queryKey: ['my-languages'],
    queryFn: () => doctorsAPI.getMyLanguages(),
  });
}

// Add language
export function useAddLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (language: string) => doctorsAPI.addLanguage(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-languages'] });
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Language added successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to add language';
      toast.error(message);
    },
  });
}

// Remove language
export function useRemoveLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => doctorsAPI.removeLanguage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-languages'] });
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Language removed successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to remove language';
      toast.error(message);
    },
  });
}

// Update certificates
export function useUpdateCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificates: { name: string; data: string }[]) =>
      doctorsAPI.updateCertificates(certificates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Certificates updated');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update certificates';
      toast.error(message);
    },
  });
}

// Update profile photo
export function useUpdateProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profilePhoto: string | null) => doctorsAPI.updateProfilePhoto(profilePhoto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Profile photo updated');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update profile photo';
      toast.error(message);
    },
  });
}

// Add specialty to doctor profile
export function useAddDoctorSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (specialtyId: string) => doctorsAPI.addSpecialty(specialtyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Specialty added successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to add specialty';
      toast.error(message);
    },
  });
}

// Remove specialty from doctor profile
export function useRemoveDoctorSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (specialtyId: string) => doctorsAPI.removeSpecialty(specialtyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-doctor-profile'] });
      toast.success('Specialty removed successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to remove specialty';
      toast.error(message);
    },
  });
}

// Create a new specialty (for custom specialties)
export function useCreateSpecialty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      doctorsAPI.createSpecialty(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialties'] });
      toast.success('Custom specialty created successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to create specialty';
      toast.error(message);
    },
  });
}

// ========== Date-Specific Availability (New System) ==========

// Get date-specific availability
export function useDateAvailability() {
  return useQuery({
    queryKey: ['my-date-availability'],
    queryFn: () => doctorsAPI.getDateAvailability(),
  });
}

// Create date-specific availability
export function useCreateDateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: import('@/types').CreateDateAvailabilityDto) =>
      doctorsAPI.createDateAvailability(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-date-availability'] });
      toast.success('Availability created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create availability';
      toast.error(message);
    },
  });
}

// Delete date-specific availability
export function useDeleteDateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, mode, fromDate }: { id: string; mode?: string; fromDate?: string }) =>
      doctorsAPI.deleteDateAvailability(id, mode || 'all', fromDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-date-availability'] });
      toast.success('Availability updated successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete availability';
      toast.error(message);
    },
  });
}

// ========== Notifications (admin reminders) ==========

export function useMyNotifications() {
  return useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => doctorsAPI.getMyNotifications(),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => doctorsAPI.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
    },
  });
}
