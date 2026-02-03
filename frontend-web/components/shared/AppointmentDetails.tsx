'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useAppointment, useCancelAppointment } from '@/lib/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  X,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { VideoRoom } from '@/components/shared/VideoRoom';

interface AppointmentDetailsProps {
  appointmentId: string;
}

export function AppointmentDetails({ appointmentId }: AppointmentDetailsProps) {
  const { user } = useAuthStore();
  const { data: appointmentData, isLoading } = useAppointment(appointmentId);
  const cancelAppointment = useCancelAppointment();

  const [cancelReason, setCancelReason] = useState('');
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const appointment = appointmentData?.data;
  const isDoctor = user?.role === 'DOCTOR';
  const isPatient = user?.role === 'PATIENT';

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleCancelAppointment = () => {
    if (!cancelReason.trim()) return;

    cancelAppointment.mutate(
      { id: appointmentId, data: { reason: cancelReason } },
      {
        onSuccess: () => {
          setIsCancelDialogOpen(false);
          setCancelReason('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading appointment details...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Appointment not found</p>
      </div>
    );
  }

  const otherPerson = isDoctor ? appointment.patient : appointment.doctor;
  const otherPersonName = isDoctor
    ? appointment.patient?.user?.email?.split('@')[0] || 'Patient'
    : appointment.doctor?.fullName || 'Doctor';

  const canCancel = appointment.status === 'CONFIRMED' && new Date(appointment.scheduledAt) > new Date();

  return (
    <div className="space-y-6">
      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 mb-2">
                Appointment Details
                <Badge variant={getStatusBadgeVariant(appointment.status)}>
                  {appointment.status}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ID: {appointment.id.slice(0, 8)}...
              </p>
            </div>
            {canCancel && (
              <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Appointment</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for cancellation. This cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
                      <Textarea
                        id="cancelReason"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Enter your reason..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCancelDialogOpen(false)}
                    >
                      Keep Appointment
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelAppointment}
                      disabled={!cancelReason.trim() || cancelAppointment.isPending}
                    >
                      {cancelAppointment.isPending
                        ? 'Cancelling...'
                        : 'Confirm Cancellation'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Participant Info */}
          <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {getInitials(otherPersonName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {isDoctor ? 'Patient' : 'Doctor'}
              </p>
              <p className="font-semibold">{otherPersonName}</p>
              {isPatient && appointment.doctor?.specialty && (
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor.specialty}
                </p>
              )}
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">
                  {format(new Date(appointment.scheduledAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">
                  {format(new Date(appointment.scheduledAt), 'hh:mm a')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {appointment.durationMinutes} minutes
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-muted-foreground font-semibold mt-0.5">₹</span>
              <div>
                <p className="text-sm text-muted-foreground">Consultation Fee</p>
                <p className="font-semibold text-lg">
                  ₹{appointment.consultationFee}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Timezone</p>
                <p className="font-semibold">
                  {isPatient
                    ? appointment.patientTimezone || 'Not specified'
                    : appointment.doctorTimezone || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Info */}
          {appointment.status === 'CANCELLED' && appointment.cancelReason && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-1">Cancellation Reason:</p>
              <p className="text-sm">{appointment.cancelReason}</p>
              {appointment.cancelledAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cancelled on {format(new Date(appointment.cancelledAt), 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Consultation Notes */}
          {isDoctor ? (
            <Link href={`/doctor/appointments/${appointmentId}/notes`}>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                {appointment.consultationNote
                  ? 'View/Edit Consultation Notes'
                  : 'Write Consultation Notes'}
              </Button>
            </Link>
          ) : (
            appointment.consultationNote &&
            appointment.consultationNote.isFinalized && (
              <Link href={`/patient/appointments/${appointmentId}/notes`}>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Consultation Notes
                </Button>
              </Link>
            )
          )}

          {/* Prescription */}
          {isDoctor ? (
            <Link href={`/doctor/appointments/${appointmentId}/prescription`}>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                {appointment.prescription
                  ? 'View/Edit Prescription'
                  : 'Write Prescription'}
              </Button>
            </Link>
          ) : (
            appointment.prescription && (
              <Link href={`/patient/prescriptions/${appointment.prescription.id}`}>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Prescription
                </Button>
              </Link>
            )
          )}

          {/* Video Call */}
          {appointment.status === 'CONFIRMED' && (
            <VideoRoom
              appointmentId={appointmentId}
              role={user?.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
