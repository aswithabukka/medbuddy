import { useQuery } from '@tanstack/react-query';
import { prescriptionsAPI } from '../api/prescriptions';

// Get single prescription
export function usePrescription(id: string, enabled = true) {
  return useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionsAPI.getById(id),
    enabled,
  });
}

// Get my prescriptions (patient only)
export function useMyPrescriptions() {
  return useQuery({
    queryKey: ['my-prescriptions'],
    queryFn: () => prescriptionsAPI.getMyPrescriptions(),
  });
}
