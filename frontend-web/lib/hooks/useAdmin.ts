import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../api/admin';

export function usePendingDoctors() {
  return useQuery({
    queryKey: ['admin-pending-doctors'],
    queryFn: () => adminAPI.getPendingDoctors(),
  });
}

export function useApproveDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminAPI.approveDoctor(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Doctor approved successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to approve doctor';
      toast.error(message);
    },
  });
}

export function useRejectDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminAPI.rejectDoctor(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Doctor application rejected');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to reject doctor';
      toast.error(message);
    },
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, title, message }: { userId: string; title: string; message: string }) =>
      adminAPI.sendReminder(userId, title, message),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reminders', userId] });
      toast.success('Reminder sent to doctor');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to send reminder';
      toast.error(message);
    },
  });
}

export function useGetReminders(userId: string) {
  return useQuery({
    queryKey: ['admin-reminders', userId],
    queryFn: () => adminAPI.getReminders(userId),
    enabled: !!userId,
  });
}

export function useAllDoctors() {
  return useQuery({
    queryKey: ['admin-all-doctors'],
    queryFn: () => adminAPI.getAllDoctors(),
  });
}

export function useAllPatients() {
  return useQuery({
    queryKey: ['admin-all-patients'],
    queryFn: () => adminAPI.getAllPatients(),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminAPI.getStats(),
  });
}
