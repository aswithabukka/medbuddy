'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { Calendar, Clock, User, ArrowRight, FileText } from 'lucide-react';

export default function DoctorAppointmentsPage() {
  const { data: appointmentsData, isLoading } = useAppointments();

  const appointments = appointmentsData?.data || [];

  const todayAppointments = appointments.filter((apt) =>
    isToday(new Date(apt.scheduledAt))
  );

  const upcomingAppointments = appointments.filter(
    (apt) =>
      isFuture(new Date(apt.scheduledAt)) &&
      !isToday(new Date(apt.scheduledAt)) &&
      apt.status === 'CONFIRMED'
  );

  const pastAppointments = appointments.filter(
    (apt) =>
      (isPast(new Date(apt.scheduledAt)) && !isToday(new Date(apt.scheduledAt))) ||
      apt.status === 'COMPLETED' ||
      apt.status === 'CANCELLED'
  );

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

  const AppointmentCard = ({ appointment }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">
                Patient: {appointment.patient?.user?.email?.split('@')[0] || 'Unknown'}
              </h3>
              <Badge variant={getStatusBadgeVariant(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(appointment.scheduledAt), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(appointment.scheduledAt), 'hh:mm a')} ({appointment.durationMinutes}min)
                </span>
              </div>

              <div className="text-sm">
                <strong>Fee:</strong> ₹{appointment.consultationFee}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {appointment.consultationNote && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {appointment.consultationNote.isFinalized ? 'Notes Finalized' : 'Notes Draft'}
                </Badge>
              )}
              {appointment.prescription && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Prescription Written
                </Badge>
              )}
            </div>
          </div>

          <div className="ml-4 flex flex-col gap-2">
            <Link href={`/doctor/appointments/${appointment.id}`}>
              <Button size="sm">
                View Details
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            {appointment.status === 'CONFIRMED' && (
              <>
                <Link href={`/doctor/appointments/${appointment.id}/notes`}>
                  <Button size="sm" variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Notes
                  </Button>
                </Link>
                <Link href={`/doctor/appointments/${appointment.id}/prescription`}>
                  <Button size="sm" variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Rx
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
            <p className="text-muted-foreground">
              Manage your patient appointments and consultations
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-2">No appointments found</p>
                  <p className="text-sm text-muted-foreground">
                    Your appointments will appear here once patients book with you
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger value="today">
                  Today ({todayAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingAppointments.length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({pastAppointments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="mt-6">
                {todayAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          No appointments scheduled for today
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {todayAppointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="mt-6">
                {upcomingAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          No upcoming appointments
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {upcomingAppointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-6">
                {pastAppointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No past appointments</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pastAppointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
