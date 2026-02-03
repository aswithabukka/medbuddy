import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { appointmentsAPI } from '../api/appointments';
import type { CreateAppointmentDto, CancelAppointmentDto } from '@/types';

// Get all appointments
interface GetAppointmentsParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export function useAppointments(params: GetAppointmentsParams = {}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsAPI.getAll(params),
  });
}

// Get single appointment
export function useAppointment(id: string, enabled = true) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsAPI.getById(id),
    enabled,
  });
}

// Book appointment
export function useBookAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentDto) => appointmentsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment booked successfully!');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    },
  });
}

// Cancel appointment
export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelAppointmentDto }) =>
      appointmentsAPI.cancel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
      toast.success('Appointment cancelled successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to cancel appointment';
      toast.error(message);
    },
  });
}

// Reschedule appointment
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { scheduledAt: string; durationMinutes?: number };
    }) => appointmentsAPI.reschedule(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', variables.id] });
      toast.success('Appointment rescheduled successfully');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to reschedule appointment';
      toast.error(message);
    },
  });
}

// Complete appointment (doctor only)
export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsAPI.complete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      toast.success('Appointment marked as completed');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Failed to complete appointment';
      toast.error(message);
    },
  });
}
