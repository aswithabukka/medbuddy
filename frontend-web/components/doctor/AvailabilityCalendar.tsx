'use client';

import * as React from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isSameDay, startOfDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, Calendar as CalendarIcon } from 'lucide-react';

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

interface AvailabilitySlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'recurring' | 'specific' | 'blocked';
  dayOfWeek?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: AvailabilitySlot;
}

interface AvailabilityCalendarProps {
  availabilitySlots: AvailabilitySlot[];
  onAddSlot: (date: Date, startTime: string, endTime: string) => void;
  onRemoveSlot: (id: string) => void;
  isLoading?: boolean;
}

export function AvailabilityCalendar({
  availabilitySlots,
  onAddSlot,
  onRemoveSlot,
  isLoading = false,
}: AvailabilityCalendarProps) {
  const [view, setView] = React.useState<View>('month');
  const [date, setDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showSlotDetails, setShowSlotDetails] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<AvailabilitySlot | null>(null);

  // Form state for adding new slot
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');

  // Generate time options (30-minute intervals)
  const timeOptions = React.useMemo(() => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeStr);
      }
    }
    return times;
  }, []);

  // Convert availability slots to calendar events
  const events: CalendarEvent[] = React.useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    const today = startOfDay(new Date());
    const monthsToShow = 3; // Show availability for next 3 months

    availabilitySlots.forEach((slot) => {
      if (slot.type === 'specific') {
        // Specific date availability
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);

        const startDate = new Date(slot.date);
        startDate.setHours(startHour, startMinute, 0, 0);

        const endDate = new Date(slot.date);
        endDate.setHours(endHour, endMinute, 0, 0);

        calendarEvents.push({
          id: slot.id,
          title: `${slot.startTime} - ${slot.endTime}`,
          start: startDate,
          end: endDate,
          resource: slot,
        });
      } else if (slot.type === 'recurring' && slot.dayOfWeek !== undefined) {
        // Recurring weekly availability - generate for next 3 months
        for (let i = 0; i < monthsToShow * 30; i++) {
          const currentDate = addDays(today, i);
          if (getDay(currentDate) === slot.dayOfWeek) {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);

            const startDate = new Date(currentDate);
            startDate.setHours(startHour, startMinute, 0, 0);

            const endDate = new Date(currentDate);
            endDate.setHours(endHour, endMinute, 0, 0);

            calendarEvents.push({
              id: `${slot.id}-${format(currentDate, 'yyyy-MM-dd')}`,
              title: `${slot.startTime} - ${slot.endTime} (Weekly)`,
              start: startDate,
              end: endDate,
              resource: slot,
            });
          }
        }
      } else if (slot.type === 'blocked') {
        // Blocked dates
        const startDate = new Date(slot.date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(slot.date);
        endDate.setHours(23, 59, 59, 999);

        calendarEvents.push({
          id: slot.id,
          title: 'Unavailable',
          start: startDate,
          end: endDate,
          resource: slot,
        });
      }
    });

    return calendarEvents;
  }, [availabilitySlots]);

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setSelectedDate(start);
    setShowAddDialog(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedSlot(event.resource);
    setShowSlotDetails(true);
  };

  const handleAddSlot = () => {
    if (!selectedDate) return;

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    onAddSlot(selectedDate, startTime, endTime);
    setShowAddDialog(false);
    setStartTime('09:00');
    setEndTime('17:00');
  };

  const handleRemoveSlot = () => {
    if (!selectedSlot) return;
    onRemoveSlot(selectedSlot.id);
    setShowSlotDetails(false);
    setSelectedSlot(null);
  };

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const { type } = event.resource;

    let backgroundColor = '#3174ad';
    let borderColor = '#265985';

    if (type === 'recurring') {
      backgroundColor = '#10b981'; // Green for recurring
      borderColor = '#059669';
    } else if (type === 'specific') {
      backgroundColor = '#3b82f6'; // Blue for specific dates
      borderColor = '#2563eb';
    } else if (type === 'blocked') {
      backgroundColor = '#ef4444'; // Red for blocked
      borderColor = '#dc2626';
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

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm">Recurring Weekly</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm">Specific Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-sm">Blocked/Unavailable</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border p-4" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
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

      {/* Add Availability Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Add Availability
            </DialogTitle>
            <DialogDescription>
              Set your available hours for {selectedDate && format(selectedDate, 'MMMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="start-time">
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
              <Label htmlFor="end-time">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="end-time">
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

            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-900">
                This will create availability for the selected date only. For recurring weekly
                availability, use the "Add Weekly Schedule" option.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Details Dialog */}
      <Dialog open={showSlotDetails} onOpenChange={setShowSlotDetails}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Availability Details</DialogTitle>
            <DialogDescription>View and manage this availability slot</DialogDescription>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Badge
                  variant={
                    selectedSlot.type === 'recurring'
                      ? 'default'
                      : selectedSlot.type === 'specific'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {selectedSlot.type === 'recurring'
                    ? 'Recurring Weekly'
                    : selectedSlot.type === 'specific'
                    ? 'Specific Date'
                    : 'Blocked'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <p className="text-sm">{format(selectedSlot.date, 'MMMM dd, yyyy')}</p>
              </div>

              {selectedSlot.type !== 'blocked' && (
                <>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <p className="text-sm">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </p>
                  </div>
                </>
              )}

              {selectedSlot.type === 'recurring' && (
                <div className="p-3 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-green-900">
                    This is a recurring weekly slot. Removing it will affect all future occurrences.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSlotDetails(false)}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleRemoveSlot} disabled={isLoading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
