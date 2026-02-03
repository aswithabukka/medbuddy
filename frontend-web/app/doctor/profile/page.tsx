'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import {
  useMyDoctorProfile,
  useUpdateDoctorProfile,
  useSpecialties,
  useAddDoctorSpecialty,
  useRemoveDoctorSpecialty,
  useCreateSpecialty,
  useMyLanguages,
  useAddLanguage,
  useRemoveLanguage,
  useUpdateProfilePhoto,
  useUpdateCertificates,
} from '@/lib/hooks/useDoctors';
import { useAuthStore } from '@/lib/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SpecialtyCombobox } from '@/components/shared/SpecialtyCombobox';
import { User, Save, AlertCircle, Plus, X, Stethoscope, Languages, Camera, Mail, Trash2, Upload, FileText } from 'lucide-react';

// Curated list of languages — same set shown on patient-facing doctor cards
const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Hindi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu',
  'Arabic', 'Persian (Farsi)', 'Turkish', 'Hebrew',
  'Mandarin (Chinese)', 'Cantonese', 'Japanese', 'Korean', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
  'Russian', 'Polish', 'Ukrainian', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Swahili', 'Afrikaans', 'Greek', 'Romanian',
];

export default function DoctorProfilePage() {
  const { data: profileData, isLoading } = useMyDoctorProfile();
  const { data: specialtiesData } = useSpecialties();
  const { data: languagesData } = useMyLanguages();
  const updateProfile = useUpdateDoctorProfile();
  const addSpecialty = useAddDoctorSpecialty();
  const removeSpecialty = useRemoveDoctorSpecialty();
  const createSpecialty = useCreateSpecialty();
  const addLanguage = useAddLanguage();
  const removeLanguage = useRemoveLanguage();
  const updateProfilePhoto = useUpdateProfilePhoto();
  const updateCertificates = useUpdateCertificates();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const profile = profileData?.data;
  const allSpecialties = specialtiesData?.data || [];
  const doctorSpecialties = profile?.specialties || [];
  const doctorLanguages = languagesData?.data || [];

  // Derive which languages are already added (string set for fast lookup)
  const addedLanguageSet = new Set(doctorLanguages.map((l: any) => l.language));

  const [formData, setFormData] = useState({
    fullName: '',
    qualifications: '',
    experience: 0,
    consultationFee: 0,
    bio: '',
    timezone: '',
    licenseNumber: '',
    clinicName: '',
  });

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<{ name: string; data: string }[]>([]);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        qualifications: profile.qualifications || '',
        experience: profile.experience || 0,
        consultationFee: profile.consultationFee || 0,
        bio: profile.bio || '',
        timezone: profile.timezone || '',
        licenseNumber: (profile as any).licenseNumber || '',
        clinicName: (profile as any).clinicName || '',
      });
      setPhotoPreview(profile.profilePhoto || null);
      if ((profile as any).certificates) {
        setCertificates((profile as any).certificates);
      }
    }
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleAddSpecialty = () => {
    if (!selectedSpecialty) return;

    // Find the specialty in the list
    const existingSpecialty = allSpecialties.find((s) => s.name === selectedSpecialty);

    if (existingSpecialty) {
      // Check if already added
      const alreadyAdded = doctorSpecialties.some(
        (ds: any) => ds.specialty.name === selectedSpecialty
      );

      if (alreadyAdded) {
        toast.error('This specialty is already added to your profile');
        setSelectedSpecialty('');
        return;
      }

      // Add specialty
      addSpecialty.mutate(existingSpecialty.id);
      setSelectedSpecialty('');
    } else {
      toast.error('Please select a specialty from the list');
    }
  };

  const handleRemoveSpecialty = (specialtyId: string) => {
    if (confirm('Are you sure you want to remove this specialty?')) {
      removeSpecialty.mutate(specialtyId);
    }
  };

  // --- Language handlers ---
  const handleAddLanguage = () => {
    if (!selectedLanguage) return;
    addLanguage.mutate(selectedLanguage);
    setSelectedLanguage('');
  };

  const handleRemoveLanguage = (id: string) => {
    removeLanguage.mutate(id);
  };

  // --- Profile photo handlers ---
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: image only, max 2 MB
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      updateProfilePhoto.mutate(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    updateProfilePhoto.mutate(null);
  };

  // --- Certificate handlers ---
  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Certificate file must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...certificates, { name: file.name, data: reader.result as string }];
      setCertificates(updated);
      updateCertificates.mutate(updated);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCertificate = (index: number) => {
    const updated = certificates.filter((_, i) => i !== index);
    setCertificates(updated);
    updateCertificates.mutate(updated);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['DOCTOR']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Doctor Profile</h1>
            <p className="text-muted-foreground">
              Manage your professional information and settings
            </p>
          </div>

          {profile?.status !== 'APPROVED' && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">
                      Account Status: {profile?.status || 'PENDING'}
                    </h3>
                    <p className="text-sm text-yellow-800">
                      {profile?.status === 'PENDING'
                        ? 'Your profile is under review by our admin team. You will be able to accept appointments once approved.'
                        : 'Your profile has not been approved yet. Please ensure all information is accurate and complete.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Profile Photo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photo
                </CardTitle>
                <CardDescription>
                  Upload a professional photo — patients will see this on your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {/* Preview circle */}
                  <div className="flex-shrink-0 w-28 h-28 rounded-full border-2 border-dashed border-muted-foreground/40 overflow-hidden flex items-center justify-center bg-muted">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="sr-only"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updateProfilePhoto.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={handleRemovePhoto}
                        disabled={updateProfilePhoto.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or WebP — max 2 MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Specialties
                </CardTitle>
                <CardDescription>
                  Add your medical specialties - choose from 30+ available specialties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Specialties */}
                {doctorSpecialties.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Your Specialties</Label>
                    <div className="flex flex-wrap gap-2">
                      {doctorSpecialties.map((item: any) => (
                        <Badge key={item.id} variant="secondary" className="px-3 py-1.5 text-sm">
                          {item.specialty.name}
                          <button
                            onClick={() => handleRemoveSpecialty(item.specialtyId)}
                            className="ml-2 hover:text-destructive"
                            disabled={removeSpecialty.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Specialty */}
                <div className="space-y-2">
                  <Label>Add Specialty</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SpecialtyCombobox
                        specialties={allSpecialties}
                        value={selectedSpecialty}
                        onChange={setSelectedSpecialty}
                        placeholder="Search and select specialty..."
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddSpecialty}
                      disabled={!selectedSpecialty || addSpecialty.isPending || createSpecialty.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select from 30+ available medical specialties
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Languages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
                <CardDescription>
                  Languages you can consult in — shown to patients when browsing doctors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current languages */}
                {doctorLanguages.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Your Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {doctorLanguages.map((item: any) => (
                        <Badge key={item.id} variant="secondary" className="px-3 py-1.5 text-sm">
                          {item.language}
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(item.id)}
                            className="ml-2 hover:text-destructive"
                            disabled={removeLanguage.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add language */}
                <div className="space-y-2">
                  <Label>Add Language</Label>
                  <div className="flex gap-2">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a language..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[240px]">
                        {LANGUAGE_OPTIONS.filter((lang) => !addedLanguageSet.has(lang)).map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={handleAddLanguage}
                      disabled={!selectedLanguage || addLanguage.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certificates & Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Certificates & Documents
                </CardTitle>
                <CardDescription>
                  Upload your medical degree, license, and other professional certificates — the admin will review these during verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Uploaded certificates list */}
                {certificates.length > 0 && (
                  <div className="space-y-2">
                    {certificates.map((cert, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{cert.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveCertificate(i)}
                          disabled={updateCertificates.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div>
                  <input
                    ref={certInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleCertSelect}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => certInputRef.current?.click()}
                    disabled={updateCertificates.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PDF, JPG, PNG or WebP — max 5 MB each. Upload your medical degree, license certificate, and any other relevant documents.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Professional Information
                  </CardTitle>
                  <CardDescription>
                    This information will be visible to patients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || profile?.user?.email || ''}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is your registered account email and cannot be changed here
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications *</Label>
                    <Input
                      id="qualifications"
                      value={formData.qualifications}
                      onChange={(e) => handleChange('qualifications', e.target.value)}
                      placeholder="MBBS, MD (Internal Medicine)"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your medical degrees and certifications
                    </p>
                  </div>

                  {/* License Number */}
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">Medical License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      placeholder="e.g. MED-2024-123456"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for admin verification — must match your uploaded license certificate
                    </p>
                  </div>

                  {/* Clinic Name */}
                  <div className="space-y-2">
                    <Label htmlFor="clinicName">Clinic / Hospital Name</Label>
                    <Input
                      id="clinicName"
                      value={formData.clinicName}
                      onChange={(e) => handleChange('clinicName', e.target.value)}
                      placeholder="e.g. Heart Care Clinic"
                    />
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value ? parseInt(e.target.value) : 0)}
                      required
                    />
                  </div>

                  {/* Consultation Fee */}
                  <div className="space-y-2">
                    <Label htmlFor="consultationFee">Consultation Fee (₹) *</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.consultationFee}
                      onChange={(e) =>
                        handleChange('consultationFee', e.target.value ? parseFloat(e.target.value) : 0)
                      }
                      required
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Tell patients about your experience and approach to healthcare..."
                      className="min-h-[120px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      This will be displayed on your public profile
                    </p>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleChange('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Current Status Badge */}
                  {profile?.status && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Account Status:</span>
                        <Badge
                          variant={
                            profile.status === 'APPROVED'
                              ? 'default'
                              : profile.status === 'PENDING'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {profile.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={updateProfile.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
