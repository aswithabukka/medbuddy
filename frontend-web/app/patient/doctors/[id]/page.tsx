'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useDoctor, useDoctorSlots } from '@/lib/hooks/useDoctors';
import { useBookAppointment } from '@/lib/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { format, addDays, isSameDay } from 'date-fns';
import {
  UserCircle,
  Briefcase,
  Languages,
  Calendar as CalendarIcon,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const { data: doctorData, isLoading } = useDoctor(doctorId);
  const { data: slotsData, isLoading: slotsLoading } = useDoctorSlots(
    doctorId,
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    !!selectedDate
  );
  const bookAppointment = useBookAppointment();

  const doctor = doctorData?.data;
  const slots = (slotsData?.data?.slots || []).map((time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const start = new Date(selectedDate!);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    return { start: start.toISOString(), end: end.toISOString(), available: true };
  });

  // Compute which dates have availability based on doctor's rules
  const isDateAvailable = useMemo(() => {
    if (!doctor) return () => false;

    const unavailSet = new Set(
      (doctor.unavailableDates || []).map((d: any) => (d.date as string).split('T')[0])
    );
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    return (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (unavailSet.has(dateStr)) return false;
      const dow = date.getDay();

      // Legacy day-of-week templates
      if ((doctor.availabilityTemplates || []).some((t: any) => t.dayOfWeek === dayNames[dow])) {
        return true;
      }

      // New date-based availability with recurrence
      return (doctor.availability || []).some((avail: any) => {
        const availDateStr = (avail.date as string).split('T')[0];
        if (dateStr < availDateStr) return false;
        if (avail.recurrenceEnd) {
          const endStr = (avail.recurrenceEnd as string).split('T')[0];
          if (dateStr > endStr) return false;
        }
        switch (avail.recurrenceType) {
          case 'NONE': return dateStr === availDateStr;
          case 'DAILY': return true;
          case 'WEEKLY': return dow === new Date(availDateStr + 'T12:00:00Z').getUTCDay();
          case 'MONTHLY': return date.getDate() === new Date(availDateStr + 'T12:00:00Z').getUTCDate();
          default: return false;
        }
      });
    };
  }, [doctor]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBookAppointment = () => {
    if (!selectedSlot) return;

    bookAppointment.mutate(
      {
        doctorUserId: doctorId,
        scheduledAt: selectedSlot.start,
        durationMinutes: 30, // Default 30 minutes
      },
      {
        onSuccess: () => {
          router.push('/patient/appointments');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading doctor profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!doctor) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-destructive">Doctor not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/patient/search-doctors">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doctor Info */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {getInitials(doctor.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-2xl font-bold">{doctor.fullName}</h1>
                          <p className="text-muted-foreground">{doctor.specialty}</p>
                        </div>
                        <Badge
                          variant={
                            doctor.status === 'APPROVED'
                              ? 'default'
                              : doctor.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {doctor.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bio */}
                  {doctor.bio && (
                    <div>
                      <h3 className="font-semibold mb-2">About</h3>
                      <p className="text-muted-foreground">{doctor.bio}</p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Experience</p>
                        <p className="font-semibold">{doctor.experience} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold">₹</span>
                      <div>
                        <p className="text-sm text-muted-foreground">Consultation Fee</p>
                        <p className="font-semibold">₹{doctor.consultationFee}</p>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <h3 className="font-semibold mb-2">Qualifications</h3>
                    <p className="text-muted-foreground">{doctor.qualifications}</p>
                  </div>

                  {/* Languages */}
                  {doctor.languages && doctor.languages.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Languages</h3>
                      <div className="flex gap-2 flex-wrap">
                        {doctor.languages.map((lang) => (
                          <Badge key={lang.id} variant="outline">
                            {lang.language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Book Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctor.status !== 'APPROVED' ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-2">
                        This doctor is not currently accepting appointments
                      </p>
                      <Badge variant="secondary">{doctor.status}</Badge>
                    </div>
                  ) : (
                    <>
                      {/* Date Selection */}
                      <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          disabled={(date) =>
                            date < new Date() ||
                            date > addDays(new Date(), 30) ||
                            !isDateAvailable(date)
                          }
                          modifiers={{
                            available: (date: Date) =>
                              date >= new Date() &&
                              date <= addDays(new Date(), 30) &&
                              isDateAvailable(date),
                          }}
                          modifiersClassNames={{
                            available: 'bg-green-100 text-green-800 font-semibold hover:bg-green-200',
                          }}
                          className="rounded-md border"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <span className="inline-block w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
                          Available days
                        </div>
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className="space-y-2">
                          <Label>Available Slots</Label>
                          {slotsLoading ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground">Loading slots...</p>
                            </div>
                          ) : slots.filter((s) => s.available).length === 0 ? (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground">
                                No available slots for this date
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                              {slots
                                .filter((slot) => slot.available)
                                .map((slot, index) => (
                                  <Button
                                    key={index}
                                    variant={
                                      selectedSlot?.start === slot.start
                                        ? 'default'
                                        : 'outline'
                                    }
                                    size="sm"
                                    className="justify-start"
                                    onClick={() =>
                                      setSelectedSlot({
                                        start: slot.start,
                                        end: slot.end,
                                      })
                                    }
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(new Date(slot.start), 'hh:mm a')}
                                  </Button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking Summary */}
                      {selectedDate && selectedSlot && (
                        <div className="border-t pt-4 space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Date</p>
                            <p className="font-semibold">
                              {format(selectedDate, 'MMMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Time</p>
                            <p className="font-semibold">
                              {format(new Date(selectedSlot.start), 'hh:mm a')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Fee</p>
                            <p className="font-semibold text-lg">
                              ₹{doctor.consultationFee}
                            </p>
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleBookAppointment}
                            disabled={bookAppointment.isPending}
                          >
                            {bookAppointment.isPending
                              ? 'Booking...'
                              : 'Confirm Booking'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
