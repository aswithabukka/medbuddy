'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import {
  usePendingDoctors,
  useApproveDoctor,
  useRejectDoctor,
  useSendReminder,
  useGetReminders,
  useAllDoctors,
  useAllPatients,
  useStats,
} from '@/lib/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Clock,
  Bell,
  AlertCircle,
  Users,
  Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helper: detect which fields are missing for a doctor
// ---------------------------------------------------------------------------
function getMissingFields(doctor: any): string[] {
  const missing: string[] = [];
  if (!doctor.profilePhoto) missing.push('Profile photo');
  if (!doctor.licenseNumber) missing.push('License number');
  if (!doctor.bio) missing.push('Bio / about me');
  if (!doctor.clinicName) missing.push('Clinic name');
  if (!doctor.specialties || doctor.specialties.length === 0) missing.push('Specialties');
  if (!doctor.languages || doctor.languages.length === 0) missing.push('Languages');
  if (!doctor.certificates || doctor.certificates.length === 0) missing.push('Verification certificates');
  return missing;
}

function generateReminderMessage(missing: string[]): string {
  if (missing.length === 0) return 'Please review your profile to ensure all information is accurate before approval.';
  return `Your application is under review. The following details are still missing or incomplete:\n\n${missing.map((m) => `• ${m}`).join('\n')}\n\nPlease update your profile so we can proceed with verification. Thank you.`;
}

// ---------------------------------------------------------------------------
// Reminder panel rendered inline inside each doctor card
// ---------------------------------------------------------------------------
function ReminderPanel({ doctor }: { doctor: any }) {
  const [open, setOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Action Required – Profile Incomplete');
  const [reminderMessage, setReminderMessage] = useState(() => generateReminderMessage(getMissingFields(doctor)));
  const sendReminder = useSendReminder();
  const { data: remindersData } = useGetReminders(doctor.userId);
  const reminders: any[] = remindersData?.data || [];

  const handleSend = () => {
    if (!reminderTitle.trim() || !reminderMessage.trim()) return;
    sendReminder.mutate({ userId: doctor.userId, title: reminderTitle, message: reminderMessage });
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 w-full"
        onClick={() => {
          setReminderTitle('Action Required – Profile Incomplete');
          setReminderMessage(generateReminderMessage(getMissingFields(doctor)));
          setOpen(true);
        }}
      >
        <Bell className="h-4 w-4 mr-2" />
        Send Reminder / Message
      </Button>

      {reminders.length > 0 && (
        <div className="border border-indigo-100 rounded-md overflow-hidden">
          <div className="bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 flex items-center justify-between">
            <span>Messages Sent ({reminders.length})</span>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {reminders.map((r: any) => (
              <div key={r.id} className="px-3 py-2 border-t border-indigo-100 text-xs">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-semibold text-gray-700">{r.title}</span>
                  <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-600 whitespace-pre-line">{r.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Send Reminder to {doctor.fullName}</DialogTitle>
            <DialogDescription>
              Compose a message for this doctor. It will appear in their in-app notifications.
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const missing = getMissingFields(doctor);
            return missing.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {missing.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-green-600 mb-2">All fields are filled in.</p>
            );
          })()}

          <div className="space-y-3">
            <div>
              <Label htmlFor="reminder-title">Title</Label>
              <input
                id="reminder-title"
                type="text"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <Label htmlFor="reminder-message">Message</Label>
              <Textarea
                id="reminder-message"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSend}
              disabled={!reminderTitle.trim() || !reminderMessage.trim() || sendReminder.isPending}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${styles[status] || styles.INACTIVE}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// All Doctors table row
// ---------------------------------------------------------------------------
function DoctorRow({ doctor }: { doctor: any }) {
  const specialtyNames = (doctor.specialties || []).map((s: any) => s.specialty?.name).filter(Boolean);
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            {doctor.profilePhoto ? (
              <span className="text-xs text-white">P</span>
            ) : (
              <User className="h-4 w-4 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{doctor.fullName}</p>
            <p className="text-xs text-muted-foreground">{doctor.user?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={doctor.status} />
      </td>
      <td className="px-4 py-3">
        {specialtyNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specialtyNames.map((name: string) => (
              <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">{doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '—'}</td>
      <td className="px-4 py-3 text-sm text-center">{doctor.appointmentCount ?? 0}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(doctor.createdAt).toLocaleDateString()}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// All Patients table row
// ---------------------------------------------------------------------------
function PatientRow({ patient }: { patient: any }) {
  const conditionNames = (patient.conditions || []).map((c: any) => c.condition);
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">{patient.user?.email?.split('@')[0] || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{patient.user?.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {patient.gender || '—'}{patient.dateOfBirth ? ` · DOB ${new Date(patient.dateOfBirth).toLocaleDateString()}` : ''}
      </td>
      <td className="px-4 py-3">
        {conditionNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {conditionNames.map((name: string) => (
              <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-center">{patient.appointmentCount ?? 0}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(patient.createdAt).toLocaleDateString()}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminPendingDoctorsPage() {
  const { data: pendingData, isLoading: pendingLoading } = usePendingDoctors();
  const { data: statsData } = useStats();
  const { data: allDoctorsData, isLoading: doctorsLoading } = useAllDoctors();
  const { data: allPatientsData, isLoading: patientsLoading } = useAllPatients();

  const approveDoctor = useApproveDoctor();
  const rejectDoctor = useRejectDoctor();

  const pendingDoctors = pendingData?.data || [];
  const stats = statsData?.data || {};
  const allDoctors: any[] = allDoctorsData?.data || [];
  const allPatients: any[] = allPatientsData?.data || [];

  // Tab: 'pending' | 'doctors' | 'patients'
  const [activeTab, setActiveTab] = useState<'pending' | 'doctors' | 'patients'>('pending');

  // Reject dialog state
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Certificate preview modal
  const [previewCert, setPreviewCert] = useState<{ name: string; data: string } | null>(null);

  // Doctor filter for All Doctors tab
  const [doctorFilter, setDoctorFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const handleApprove = (userId: string) => {
    approveDoctor.mutate(userId);
  };

  const handleReject = () => {
    if (!rejectUserId || !rejectReason.trim()) return;
    rejectDoctor.mutate({ userId: rejectUserId, reason: rejectReason });
    setRejectUserId(null);
    setRejectReason('');
  };

  const filteredDoctors = doctorFilter === 'ALL' ? allDoctors : allDoctors.filter((d) => d.status === doctorFilter);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Manage doctors, patients, and verifications
            </p>
          </div>

          {/* Stats bar — clickable cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card
              className="cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
              onClick={() => setActiveTab('pending')}
            >
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-3xl font-bold text-amber-600">{stats.pending ?? '—'}</p>
                </div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all"
              onClick={() => { setActiveTab('doctors'); setDoctorFilter('ALL'); }}
            >
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalDoctors ?? 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total Doctors</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
              onClick={() => setActiveTab('patients')}
            >
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <User className="h-4 w-4 text-purple-600" />
                  <p className="text-3xl font-bold text-purple-600">{stats.totalPatients ?? 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
              onClick={() => { setActiveTab('doctors'); setDoctorFilter('APPROVED'); }}
            >
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-3xl font-bold text-green-600">{stats.approvedToday ?? 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Approved Today</p>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md hover:border-red-300 transition-all"
              onClick={() => { setActiveTab('doctors'); setDoctorFilter('REJECTED'); }}
            >
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <p className="text-3xl font-bold text-red-500">{stats.rejectedToday ?? 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Rejected Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <p className="text-3xl font-bold text-blue-600">{stats.totalAdmins ?? 0}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total Admins</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-white border rounded-lg p-1 w-fit">
            {([
              { key: 'pending', label: 'Pending Review', icon: Clock, count: stats.pending },
              { key: 'doctors', label: 'All Doctors', icon: Users, count: stats.totalDoctors },
              { key: 'patients', label: 'All Patients', icon: User, count: stats.totalPatients },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-indigo-500' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count ?? '…'}
                </span>
              </button>
            ))}
          </div>

          {/* ===== PENDING TAB ===== */}
          {activeTab === 'pending' && (
            <>
              {pendingLoading ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <p className="text-muted-foreground">Loading pending applications…</p>
                  </CardContent>
                </Card>
              ) : pendingDoctors.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-lg">All caught up</h3>
                    <p className="text-sm text-muted-foreground">No pending doctor applications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingDoctors.map((doctor: any) => {
                    const certs: { name: string; data: string }[] = doctor.certificates || [];
                    return (
                      <Card key={doctor.id} className="border-l-4 border-l-amber-400">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                {doctor.profilePhoto ? (
                                  <img src={doctor.profilePhoto} alt={doctor.fullName} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <User className="h-6 w-6 text-primary-foreground" />
                                )}
                              </div>
                              <div>
                                <CardTitle className="text-lg">{doctor.fullName}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-0.5">
                                  <span>{doctor.user?.email}</span>
                                  <Badge variant="secondary" className="text-xs">PENDING</Badge>
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Applied {new Date(doctor.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Info grid */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Qualifications</span>
                              <p className="font-medium">{doctor.qualifications || '— not provided'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Experience</span>
                              <p className="font-medium">{doctor.experience != null ? `${doctor.experience} years` : '— not provided'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Consultation Fee</span>
                              <p className="font-medium">{doctor.consultationFee != null ? `₹${doctor.consultationFee}` : '— not provided'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">License Number</span>
                              <p className="font-medium">{doctor.licenseNumber || '— not provided'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Clinic Name</span>
                              <p className="font-medium">{doctor.clinicName || '— not provided'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Profile Photo</span>
                              <p className="font-medium">{doctor.profilePhoto ? 'Uploaded' : '— not provided'}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Bio</span>
                              <p className="font-medium">{doctor.bio || '— not provided'}</p>
                            </div>
                          </div>

                          {/* Specialties */}
                          <div>
                            <span className="text-xs text-muted-foreground">Specialties</span>
                            {doctor.specialties?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doctor.specialties.map((s: any) => (
                                  <Badge key={s.id} variant="outline" className="text-xs">{s.specialty.name}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-muted-foreground">— not provided</p>
                            )}
                          </div>

                          {/* Languages */}
                          <div>
                            <span className="text-xs text-muted-foreground">Languages</span>
                            {doctor.languages?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doctor.languages.map((l: any) => (
                                  <Badge key={l.id} variant="outline" className="text-xs">{l.language}</Badge>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-muted-foreground">— not provided</p>
                            )}
                          </div>

                          {/* Certificates */}
                          <div>
                            <span className="text-xs text-muted-foreground">Uploaded Certificates</span>
                            {certs.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {certs.map((cert, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPreviewCert(cert)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    {cert.name}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                <p className="text-xs text-amber-800 font-medium">No certificates uploaded — consider asking the doctor to upload verification documents before approving.</p>
                              </div>
                            )}
                          </div>

                          {/* Reminder panel */}
                          <div className="pt-2 border-t">
                            <ReminderPanel doctor={doctor} />
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-end gap-3 pt-2 border-t">
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => { setRejectUserId(doctor.userId); setRejectReason(''); }}
                              disabled={approveDoctor.isPending || rejectDoctor.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(doctor.userId)}
                              disabled={approveDoctor.isPending || rejectDoctor.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ===== ALL DOCTORS TAB ===== */}
          {activeTab === 'doctors' && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">All Registered Doctors</CardTitle>
                  <div className="flex gap-2">
                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDoctorFilter(s)}
                        className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                          doctorFilter === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {doctorsLoading ? (
                  <p className="text-center text-muted-foreground py-10">Loading doctors…</p>
                ) : filteredDoctors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No doctors match this filter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="px-4 py-3">Doctor</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Specialties</th>
                          <th className="px-4 py-3">Fee</th>
                          <th className="px-4 py-3 text-center">Appts</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctors.map((doctor: any) => (
                          <DoctorRow key={doctor.id} doctor={doctor} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== ALL PATIENTS TAB ===== */}
          {activeTab === 'patients' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Registered Patients</CardTitle>
                <CardDescription>
                  {allPatients.length} patient{allPatients.length !== 1 ? 's' : ''} registered
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {patientsLoading ? (
                  <p className="text-center text-muted-foreground py-10">Loading patients…</p>
                ) : allPatients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">No patients registered yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 border-b text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3">Conditions</th>
                          <th className="px-4 py-3 text-center">Appts</th>
                          <th className="px-4 py-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPatients.map((patient: any) => (
                          <PatientRow key={patient.id} patient={patient} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject reason dialog */}
      <Dialog open={rejectUserId !== null} onOpenChange={() => { setRejectUserId(null); setRejectReason(''); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for the rejection. The doctor will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reject-reason">Reason *</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. License number could not be verified, missing required documents..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectUserId(null); setRejectReason(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim() || rejectDoctor.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate preview modal */}
      <Dialog open={previewCert !== null} onOpenChange={() => setPreviewCert(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewCert?.name}</DialogTitle>
            <DialogDescription>Certificate preview</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] rounded-md border">
            {previewCert?.data && (
              <img
                src={previewCert.data}
                alt={previewCert.name}
                className="w-full object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewCert(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
