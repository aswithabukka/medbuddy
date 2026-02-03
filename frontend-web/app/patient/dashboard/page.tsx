'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useAppointments } from '@/lib/hooks/useAppointments';
import { useMyPrescriptions } from '@/lib/hooks/usePrescriptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, isFuture, isToday } from 'date-fns';
import { Calendar, Clock, FileText, Search, User, ArrowRight } from 'lucide-react';

export default function PatientDashboardPage() {
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments();
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useMyPrescriptions();

  const appointments = appointmentsData?.data || [];
  const prescriptions = prescriptionsData?.data || [];

  // Upcoming appointments (all future confirmed)
  const upcomingAppointments = appointments
    .filter(
      (apt) =>
        apt.status === 'CONFIRMED' &&
        (isFuture(new Date(apt.scheduledAt)) || isToday(new Date(apt.scheduledAt)))
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  // Recent prescriptions
  const recentPrescriptions = prescriptions
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    .slice(0, 3);

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Here's an overview of your health appointments and prescriptions
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/patient/search-doctors">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Find Doctors</h3>
                      <p className="text-sm text-muted-foreground">Search and book</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/patient/appointments">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">My Appointments</h3>
                      <p className="text-sm text-muted-foreground">
                        {appointments.length} total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/patient/prescriptions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Prescriptions</h3>
                      <p className="text-sm text-muted-foreground">
                        {prescriptions.length} total
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Upcoming Appointments */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Appointments
                  </CardTitle>
                  <CardDescription>Your upcoming confirmed appointments</CardDescription>
                </div>
                <Link href="/patient/appointments">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading appointments...</p>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  <Link href="/patient/search-doctors">
                    <Button>Book an Appointment</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">
                              Dr. {appointment.doctor?.fullName || 'Unknown'}
                            </h3>
                            {isToday(new Date(appointment.scheduledAt)) && (
                              <Badge variant="default">Today</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {appointment.doctor?.specialty}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(appointment.scheduledAt), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(appointment.scheduledAt), 'hh:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/patient/appointments/${appointment.id}`}>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Prescriptions
                  </CardTitle>
                  <CardDescription>Your latest prescriptions</CardDescription>
                </div>
                <Link href="/patient/prescriptions">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {prescriptionsLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading prescriptions...</p>
                </div>
              ) : recentPrescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No prescriptions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPrescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              Prescription #{prescription.prescriptionNumber}
                            </h3>
                            <Badge variant="outline">
                              {prescription.medicines.length} medicine
                              {prescription.medicines.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <p>
                              Dr. {prescription.doctor?.fullName || 'Unknown'} •{' '}
                              {format(new Date(prescription.issuedAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {prescription.medicines.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {prescription.medicines.slice(0, 2).map((medicine) => (
                                <Badge key={medicine.id} variant="secondary" className="text-xs">
                                  {medicine.medicineName}
                                </Badge>
                              ))}
                              {prescription.medicines.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{prescription.medicines.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Link href={`/patient/prescriptions/${prescription.id}`}>
                          <Button size="sm" variant="outline">
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
