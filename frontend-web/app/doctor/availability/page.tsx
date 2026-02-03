'use client';

import { useState, useMemo } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import {
  useDateAvailability,
  useCreateDateAvailability,
  useDeleteDateAvailability,
} from '@/lib/hooks/useDoctors';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComp, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, addMonths, isSameDay, startOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, Clock, Plus, Repeat, Trash2, LayoutGrid, List } from 'lucide-react';
import { toast } from 'react-hot-toast';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

export default function DoctorAvailabilityPage() {
  const { data: availabilityData, isLoading } = useDateAvailability();
  const createAvailability = useCreateDateAvailability();
  const deleteAvailability = useDeleteDateAvailability();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [calendarView, setCalendarView] = useState<View>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showSlotDetails, setShowSlotDetails] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'this_only' | 'this_and_following' | 'all'>('this_only');
  const [formData, setFormData] = useState({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    recurrenceType: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recurrenceEnd: '',
  });

  const availability = availabilityData?.data || [];

  // Generate time options (30-minute intervals)
  const timeOptions = useMemo(() => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    return times;
  }, []);

  // Convert availability to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];
    const today = startOfDay(new Date());
    const monthsToShow = 6; // Show 6 months of recurring events

    availability.forEach((slot: any) => {
      const slotDate = new Date(slot.date);
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);

      if (slot.recurrenceType === 'NONE') {
        // One-time availability
        const startDate = new Date(slotDate);
        startDate.setHours(startHour, startMinute, 0, 0);
        const endDate = new Date(slotDate);
        endDate.setHours(endHour, endMinute, 0, 0);

        events.push({
          id: slot.id,
          title: `${slot.startTime} - ${slot.endTime}`,
          start: startDate,
          end: endDate,
          resource: { ...slot, type: 'one-time' },
        });
      } else if (slot.recurrenceType === 'DAILY') {
        // Daily recurrence
        const endDate = slot.recurrenceEnd ? new Date(slot.recurrenceEnd) : addMonths(today, monthsToShow);
        let currentDate = new Date(Math.max(slotDate.getTime(), today.getTime()));

        while (currentDate <= endDate) {
          const startDate = new Date(currentDate);
          startDate.setHours(startHour, startMinute, 0, 0);
          const eventEndDate = new Date(currentDate);
          eventEndDate.setHours(endHour, endMinute, 0, 0);

          events.push({
            id: `${slot.id}-${format(currentDate, 'yyyy-MM-dd')}`,
            title: `${slot.startTime} - ${slot.endTime} (Daily)`,
            start: startDate,
            end: eventEndDate,
            resource: { ...slot, type: 'daily', instanceDate: currentDate },
          });

          currentDate = addDays(currentDate, 1);
        }
      } else if (slot.recurrenceType === 'WEEKLY') {
        // Weekly recurrence
        const targetDayOfWeek = getDay(slotDate);
        const endDate = slot.recurrenceEnd ? new Date(slot.recurrenceEnd) : addMonths(today, monthsToShow);
        let currentDate = new Date(Math.max(slotDate.getTime(), today.getTime()));

        // Find the next occurrence of the target day
        while (getDay(currentDate) !== targetDayOfWeek) {
          currentDate = addDays(currentDate, 1);
        }

        while (currentDate <= endDate) {
          const startDate = new Date(currentDate);
          startDate.setHours(startHour, startMinute, 0, 0);
          const eventEndDate = new Date(currentDate);
          eventEndDate.setHours(endHour, endMinute, 0, 0);

          events.push({
            id: `${slot.id}-${format(currentDate, 'yyyy-MM-dd')}`,
            title: `${slot.startTime} - ${slot.endTime} (Weekly)`,
            start: startDate,
            end: eventEndDate,
            resource: { ...slot, type: 'weekly', instanceDate: currentDate },
          });

          currentDate = addDays(currentDate, 7);
        }
      } else if (slot.recurrenceType === 'MONTHLY') {
        // Monthly recurrence
        const targetDate = slotDate.getDate();
        const endDate = slot.recurrenceEnd ? new Date(slot.recurrenceEnd) : addMonths(today, monthsToShow);
        let currentDate = new Date(Math.max(slotDate.getTime(), today.getTime()));

        while (currentDate <= endDate) {
          // Set to the target date of the month
          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), targetDate);

          if (monthDate >= today && monthDate <= endDate) {
            const startDate = new Date(monthDate);
            startDate.setHours(startHour, startMinute, 0, 0);
            const eventEndDate = new Date(monthDate);
            eventEndDate.setHours(endHour, endMinute, 0, 0);

            events.push({
              id: `${slot.id}-${format(monthDate, 'yyyy-MM-dd')}`,
              title: `${slot.startTime} - ${slot.endTime} (Monthly)`,
              start: startDate,
              end: eventEndDate,
              resource: { ...slot, type: 'monthly', instanceDate: monthDate },
            });
          }

          currentDate = addMonths(currentDate, 1);
        }
      }
    });

    return events;
  }, [availability]);

  const handleSubmit = () => {
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    const submitData: any = {
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      recurrenceType: formData.recurrenceType,
    };

    if (formData.recurrenceType !== 'NONE' && formData.recurrenceEnd) {
      submitData.recurrenceEnd = formData.recurrenceEnd;
    }

    createAvailability.mutate(submitData, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setFormData({
          date: '',
          startTime: '09:00',
          endTime: '17:00',
          recurrenceType: 'NONE',
          recurrenceEnd: '',
        });
      },
    });
  };

  const handleDeleteAll = (id: string) => {
    if (confirm('Are you sure you want to delete this availability?')) {
      deleteAvailability.mutate({ id, mode: 'all' });
    }
  };

  const handleDeleteWithMode = () => {
    if (!selectedSlot) return;
    const instanceDateStr = selectedSlot.instanceDate
      ? format(new Date(selectedSlot.instanceDate), 'yyyy-MM-dd')
      : format(new Date(selectedSlot.date), 'yyyy-MM-dd');

    deleteAvailability.mutate({
      id: selectedSlot.id,
      mode: deleteMode,
      fromDate: instanceDateStr,
    });
    setShowSlotDetails(false);
    setSelectedSlot(null);
  };

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setFormData({
      ...formData,
      date: format(start, 'yyyy-MM-dd'),
    });
    setIsAddDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedSlot({
      ...event.resource,
      instanceDate: event.resource.instanceDate || new Date(event.resource.date),
    });
    setDeleteMode(event.resource.recurrenceType === 'NONE' ? 'all' : 'this_only');
    setShowSlotDetails(true);
  };

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const type = event.resource.recurrenceType;
    let backgroundColor = '#3b82f6'; // Blue for one-time
    let borderColor = '#2563eb';

    if (type === 'DAILY') {
      backgroundColor = '#10b981'; // Green for daily
      borderColor = '#059669';
    } else if (type === 'WEEKLY') {
      backgroundColor = '#8b5cf6'; // Purple for weekly
      borderColor = '#7c3aed';
    } else if (type === 'MONTHLY') {
      backgroundColor = '#f97316'; // Orange for monthly
      borderColor = '#ea580c';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 4px',
      },
    };
  };

  const getRecurrenceBadge = (type: string) => {
    const colors = {
      NONE: 'bg-blue-100 text-blue-800',
      DAILY: 'bg-green-100 text-green-800',
      WEEKLY: 'bg-purple-100 text-purple-800',
      MONTHLY: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      NONE: 'One-time',
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
    };
    return {
      color: colors[type as keyof typeof colors] || colors.NONE,
      label: labels[type as keyof typeof labels] || 'One-time',
    };
  };

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Manage Availability</h1>
            <p className="text-muted-foreground">
              Set your availability for specific dates with optional recurring patterns
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Your Availability Schedule
                  </CardTitle>
                  <CardDescription>
                    Add specific dates when you're available - with daily, weekly, or monthly recurrence options
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Availability
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add Availability</DialogTitle>
                      <DialogDescription>
                        Set your availability for a specific date with optional recurrence
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {/* Date Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      {/* Time Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Select
                            value={formData.startTime}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, startTime: value }))
                            }
                          >
                            <SelectTrigger id="startTime">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <Select
                            value={formData.endTime}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, endTime: value }))
                            }
                          >
                            <SelectTrigger id="endTime">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Recurrence Type */}
                      <div className="space-y-2">
                        <Label htmlFor="recurrence" className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          Recurrence
                        </Label>
                        <Select
                          value={formData.recurrenceType}
                          onValueChange={(value: any) =>
                            setFormData((prev) => ({ ...prev, recurrenceType: value }))
                          }
                        >
                          <SelectTrigger id="recurrence">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">One-time only</SelectItem>
                            <SelectItem value="DAILY">Repeat daily</SelectItem>
                            <SelectItem value="WEEKLY">Repeat weekly</SelectItem>
                            <SelectItem value="MONTHLY">Repeat monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {formData.recurrenceType === 'DAILY' && 'This availability will repeat every day'}
                          {formData.recurrenceType === 'WEEKLY' && 'This availability will repeat on the same day each week'}
                          {formData.recurrenceType === 'MONTHLY' && 'This availability will repeat on the same date each month'}
                          {formData.recurrenceType === 'NONE' && 'This availability is for the selected date only'}
                        </p>
                      </div>

                      {/* Recurrence End Date (only if recurring) */}
                      {formData.recurrenceType !== 'NONE' && (
                        <div className="space-y-2">
                          <Label htmlFor="recurrenceEnd">Recurrence End Date (Optional)</Label>
                          <Input
                            id="recurrenceEnd"
                            type="date"
                            value={formData.recurrenceEnd}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, recurrenceEnd: e.target.value }))
                            }
                            min={formData.date || new Date().toISOString().split('T')[0]}
                          />
                          <p className="text-xs text-muted-foreground">
                            Leave empty for indefinite recurrence
                          </p>
                        </div>
                      )}
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createAvailability.isPending}
                      >
                        {createAvailability.isPending ? 'Creating...' : 'Add Availability'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading availability...</p>
                </div>
              ) : availability.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-2">
                    No availability set
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click "Add Availability" to start accepting appointments
                  </p>
                </div>
              ) : viewMode === 'calendar' ? (
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500" />
                      <span className="text-sm">One-time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span className="text-sm">Daily</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-500" />
                      <span className="text-sm">Weekly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      <span className="text-sm">Monthly</span>
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="bg-white rounded-lg border" style={{ height: '700px' }}>
                    <CalendarComp
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      view={calendarView}
                      onView={setCalendarView}
                      date={calendarDate}
                      onNavigate={setCalendarDate}
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={handleSelectEvent}
                      selectable
                      eventPropGetter={eventStyleGetter}
                      views={['month', 'week', 'day']}
                      step={30}
                      showMultiDayTimes
                      defaultView="month"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {availability
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((slot: any) => {
                      const badge = getRecurrenceBadge(slot.recurrenceType);
                      return (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  {format(new Date(slot.date), 'EEEE, MMMM d, yyyy')}
                                </span>
                                <Badge className={badge.color}>
                                  {badge.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                {slot.recurrenceEnd && (
                                  <span className="text-xs">
                                    • Until {format(new Date(slot.recurrenceEnd), 'MMM d, yyyy')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (slot.recurrenceType === 'NONE') {
                                handleDeleteAll(slot.id);
                              } else {
                                setSelectedSlot({ ...slot, instanceDate: new Date(slot.date) });
                                setDeleteMode('all');
                                setShowSlotDetails(true);
                              }
                            }}
                            disabled={deleteAvailability.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Repeat className="h-5 w-5" />
                  How Recurrence Works
                </h3>
                <ul className="space-y-2 text-sm text-blue-900 ml-7 list-disc">
                  <li><strong>One-time:</strong> Available only on the selected date</li>
                  <li><strong>Daily:</strong> Repeats every day starting from the selected date</li>
                  <li><strong>Weekly:</strong> Repeats on the same day of the week (e.g., every Monday)</li>
                  <li><strong>Monthly:</strong> Repeats on the same date each month (e.g., the 15th)</li>
                  <li>Set an end date to limit how long the recurrence continues</li>
                  <li>Patients can book appointments during your available slots</li>
                  <li><strong>Tip:</strong> Click on any date in calendar view to quickly add availability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slot Details Dialog */}
        <Dialog open={showSlotDetails} onOpenChange={(open) => {
          setShowSlotDetails(open);
          if (open && selectedSlot?.recurrenceType !== 'NONE') {
            setDeleteMode('this_only');
          }
        }}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Availability Details</DialogTitle>
              <DialogDescription>View and manage this availability slot</DialogDescription>
            </DialogHeader>

            {selectedSlot && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
                    <Badge className={getRecurrenceBadge(selectedSlot.recurrenceType).color}>
                      {getRecurrenceBadge(selectedSlot.recurrenceType).label}
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Time</Label>
                    <p className="text-sm font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date</Label>
                  <p className="text-sm font-medium">
                    {selectedSlot.instanceDate
                      ? format(new Date(selectedSlot.instanceDate), 'EEEE, MMMM dd, yyyy')
                      : format(new Date(selectedSlot.date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>

                {selectedSlot.recurrenceEnd && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Series ends</Label>
                    <p className="text-sm">{format(new Date(selectedSlot.recurrenceEnd), 'MMMM dd, yyyy')}</p>
                  </div>
                )}

                {/* Delete options for recurring slots */}
                {selectedSlot.recurrenceType !== 'NONE' && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-sm font-semibold">How do you want to remove this?</Label>
                    <div className="space-y-2">
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteMode === 'this_only' ? 'border-blue-500 bg-blue-50' : 'border-muted hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="deleteMode"
                          checked={deleteMode === 'this_only'}
                          onChange={() => setDeleteMode('this_only')}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">Only this slot</p>
                          <p className="text-xs text-muted-foreground">
                            Remove only {selectedSlot.instanceDate ? format(new Date(selectedSlot.instanceDate), 'MMM dd') : format(new Date(selectedSlot.date), 'MMM dd')}. All other slots in this series stay.
                          </p>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteMode === 'this_and_following' ? 'border-blue-500 bg-blue-50' : 'border-muted hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="deleteMode"
                          checked={deleteMode === 'this_and_following'}
                          onChange={() => setDeleteMode('this_and_following')}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">This and following slots</p>
                          <p className="text-xs text-muted-foreground">
                            Remove from {selectedSlot.instanceDate ? format(new Date(selectedSlot.instanceDate), 'MMM dd') : format(new Date(selectedSlot.date), 'MMM dd')} onward. Earlier slots remain.
                          </p>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${deleteMode === 'all' ? 'border-red-400 bg-red-50' : 'border-muted hover:bg-muted/50'}`}>
                        <input
                          type="radio"
                          name="deleteMode"
                          checked={deleteMode === 'all'}
                          onChange={() => setDeleteMode('all')}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium">All slots in this series</p>
                          <p className="text-xs text-muted-foreground">
                            Permanently remove the entire recurring series.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSlotDetails(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteWithMode}
                disabled={deleteAvailability.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {selectedSlot?.recurrenceType === 'NONE'
                  ? 'Remove Slot'
                  : deleteMode === 'this_only'
                    ? 'Remove This Slot'
                    : deleteMode === 'this_and_following'
                      ? 'Remove This & Following'
                      : 'Remove All'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
