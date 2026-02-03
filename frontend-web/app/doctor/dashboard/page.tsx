'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, isToday, isFuture } from 'date-fns';
import { Calendar, Clock, User, FileText, ArrowRight, Users } from 'lucide-react';

export default function DoctorDashboardPage() {
  const router = useRouter();
  const todayRef = useRef<HTMLDivElement>(null);
  const upcomingRef = useRef<HTMLDivElement>(null);
  const { data: appointmentsData, isLoading } = useAppointments();

  const appointments = appointmentsData?.data || [];

  // Today's appointments
  const todayAppointments = appointments
    .filter((apt) => isToday(new Date(apt.scheduledAt)))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Upcoming appointments (future, not today)
  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        apt.status === 'CONFIRMED' &&
        isFuture(new Date(apt.scheduledAt)) &&
        !isToday(new Date(apt.scheduledAt))
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  // Statistics
  const stats = {
    today: todayAppointments.length,
    upcoming: upcomingAppointments.length,
    completed: appointments.filter((apt) => apt.status === 'COMPLETED').length,
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

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Doctor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your appointments and patient consultations
            </p>
          </div>

          {/* Statistics Cards — clickable */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
              onClick={() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <h3 className="text-2xl font-bold">{stats.today}</h3>
                    <p className="text-xs text-muted-foreground">appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
              onClick={() => upcomingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <h3 className="text-2xl font-bold">{stats.upcoming}</h3>
                    <p className="text-xs text-muted-foreground">appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
              onClick={() => router.push('/doctor/appointments')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <h3 className="text-2xl font-bold">{stats.completed}</h3>
                    <p className="text-xs text-muted-foreground">consultations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card ref={todayRef} className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(), 'EEEE, MMMM dd, yyyy')}
                  </CardDescription>
                </div>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading schedule...</p>
                </div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No appointments scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">
                              Patient: {appointment.patient?.user?.email?.split('@')[0] || 'Unknown'}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(appointment.scheduledAt), 'hh:mm a')}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {appointment.durationMinutes} minutes
                            </div>
                            <div className="text-muted-foreground">
                              Fee: ₹{appointment.consultationFee}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
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
                        <div className="flex flex-col gap-2">
                          <Link href={`/doctor/appointments/${appointment.id}`}>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </Link>
                          {appointment.status === 'CONFIRMED' && (
                            <>
                              <Link href={`/doctor/appointments/${appointment.id}/notes`}>
                                <Button size="sm" variant="ghost" className="w-full">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Notes
                                </Button>
                              </Link>
                              <Link href={`/doctor/appointments/${appointment.id}/prescription`}>
                                <Button size="sm" variant="ghost" className="w-full">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Rx
                                </Button>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Appointments */}
          <Card ref={upcomingRef}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Next 5 upcoming appointments</CardDescription>
                </div>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading appointments...</p>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {appointment.patient?.user?.email?.split('@')[0] || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{format(new Date(appointment.scheduledAt), 'MMM dd, yyyy')}</span>
                            <span>{format(new Date(appointment.scheduledAt), 'hh:mm a')}</span>
                          </div>
                        </div>
                        <Link href={`/doctor/appointments/${appointment.id}`}>
                          <Button size="sm" variant="ghost">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
