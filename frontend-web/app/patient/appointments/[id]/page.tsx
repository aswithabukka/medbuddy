'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { AppointmentDetails } from '@/components/shared/AppointmentDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PatientAppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/patient/appointments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appointments
              </Button>
            </Link>
          </div>

          <AppointmentDetails appointmentId={appointmentId} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
