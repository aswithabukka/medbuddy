// User & Auth Types
export interface User {
  id: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// Patient Types
export interface PatientProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCondition {
  id: string;
  patientId: string;
  condition: string;
  diagnosedAt?: string;
  createdAt: string;
}

// Doctor Types
export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experience: number;
  consultationFee: number;
  bio?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timezone?: string;
  profilePhoto?: string;
  user?: {
    email: string;
  };
  specialties?: { id: string; specialtyId: string; specialty: Specialty }[];
  languages?: DoctorLanguage[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorLanguage {
  id: string;
  doctorId: string;
  language: string;
}

export interface DoctorAvailabilityTemplate {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDateAvailabilityDto {
  date: string;
  startTime: string;
  endTime: string;
  recurrenceType?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEnd?: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  patientTimezone?: string;
  doctorTimezone?: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  consultationFee: number;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  doctor?: DoctorProfile;
  patient?: PatientProfile;
  prescription?: Prescription;
  consultationNote?: ConsultationNote;
}

// Consultation Note Types
export interface ConsultationNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  isFinalized: boolean;
  finalizedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Prescription Types
export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  prescriptionNumber: string;
  notes?: string;
  issuedAt: string;
  medicines: PrescriptionMedicine[];
  doctor?: DoctorProfile;
  patient?: PatientProfile;
}

export interface PrescriptionMedicine {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  createdAt: string;
}

// Specialty Type
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// DTO Types for Forms
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: 'PATIENT' | 'DOCTOR';
}

export interface CreateAppointmentDto {
  doctorUserId: string;
  scheduledAt: string;
  durationMinutes: number;
  patientTimezone?: string;
}

export interface UpdateConsultationNoteDto {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface AddMedicineDto {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionDto {
  appointmentId: string;
  notes?: string;
}

export interface UpdateDoctorProfileDto {
  fullName?: string;
  specialty?: string;
  qualifications?: string;
  experience?: number;
  consultationFee?: number;
  bio?: string;
  timezone?: string;
}

export interface UpdatePatientProfileDto {
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  bloodType?: string;
  allergies?: string;
  medications?: string;
}

export interface CancelAppointmentDto {
  reason: string;
}
