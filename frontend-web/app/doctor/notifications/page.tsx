'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyNotifications, useMarkNotificationRead } from '@/lib/hooks/useDoctors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCircle } from 'lucide-react';

export default function DoctorNotificationsPage() {
  const { data: notificationsData, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationRead();

  const notifications: any[] = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => markRead.mutate(n.id));
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bell className="h-8 w-8 text-indigo-600" />
                <h1 className="text-3xl font-bold">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-indigo-600 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                Messages and reminders from the admin team
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-lg">All clear</h3>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <Card
                  key={n.id}
                  className={`transition-colors ${n.isRead ? '' : 'border-indigo-300 bg-indigo-50/40'}`}
                >
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Icon + content */}
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${
                            n.isRead ? 'bg-gray-100' : 'bg-indigo-100'
                          }`}
                        >
                          <Bell className={`h-5 w-5 ${n.isRead ? 'text-gray-500' : 'text-indigo-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${n.isRead ? 'text-gray-800' : 'text-indigo-900'}`}>
                              {n.title}
                            </h3>
                            {!n.isRead && (
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 whitespace-pre-line ${n.isRead ? 'text-gray-600' : 'text-indigo-700'}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Mark-read button */}
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead.mutate(n.id)}
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
