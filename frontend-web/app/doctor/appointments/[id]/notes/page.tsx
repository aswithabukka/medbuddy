'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { SOAPNoteEditor } from '@/components/doctor/SOAPNoteEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConsultationNotesPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href={`/doctor/appointments/${appointmentId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appointment
              </Button>
            </Link>
          </div>

          <SOAPNoteEditor appointmentId={appointmentId} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
