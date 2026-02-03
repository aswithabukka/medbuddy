'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import {
  useMyPatientProfile,
  useUpdatePatientProfile,
  useMyConditions,
  useAddCondition,
  useRemoveCondition,
} from '@/lib/hooks/usePatients';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Save, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientProfilePage() {
  const { data: profileData, isLoading } = useMyPatientProfile();
  const { data: conditionsData } = useMyConditions();
  const updateProfile = useUpdatePatientProfile();
  const addCondition = useAddCondition();
  const removeCondition = useRemoveCondition();

  const profile = profileData?.data;
  const conditions = conditionsData?.data || [];

  const [formData, setFormData] = useState({
    dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
    gender: profile?.gender || '',
    height: profile?.height || undefined,
    weight: profile?.weight || undefined,
    bloodType: profile?.bloodType || '',
    allergies: profile?.allergies || '',
    medications: profile?.medications || '',
  });

  const [newCondition, setNewCondition] = useState({
    condition: '',
    diagnosedAt: '',
  });

  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleAddCondition = () => {
    if (!newCondition.condition) return;
    addCondition.mutate(newCondition, {
      onSuccess: () => {
        setNewCondition({ condition: '', diagnosedAt: '' });
        setIsAddConditionOpen(false);
      },
    });
  };

  const handleRemoveCondition = (id: string) => {
    if (confirm('Are you sure you want to remove this condition?')) {
      removeCondition.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your personal health information
            </p>
          </div>

          <div className="space-y-6">
            {/* Personal Information */}
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Keep your information up to date for better care
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleChange('gender', value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Height and Weight */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        value={formData.height || ''}
                        onChange={(e) =>
                          handleChange('height', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        value={formData.weight || ''}
                        onChange={(e) =>
                          handleChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </div>
                  </div>

                  {/* Blood Type */}
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={(value) => handleChange('bloodType', value)}
                    >
                      <SelectTrigger id="bloodType">
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A_POSITIVE">A+</SelectItem>
                        <SelectItem value="A_NEGATIVE">A-</SelectItem>
                        <SelectItem value="B_POSITIVE">B+</SelectItem>
                        <SelectItem value="B_NEGATIVE">B-</SelectItem>
                        <SelectItem value="O_POSITIVE">O+</SelectItem>
                        <SelectItem value="O_NEGATIVE">O-</SelectItem>
                        <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                        <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Allergies */}
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      placeholder="List any allergies (medications, food, environmental, etc.)"
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Current Medications */}
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      value={formData.medications}
                      onChange={(e) => handleChange('medications', e.target.value)}
                      placeholder="List any medications you are currently taking"
                      className="min-h-[100px]"
                    />
                  </div>

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

            {/* Medical Conditions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medical Conditions</CardTitle>
                    <CardDescription>
                      Track your diagnosed medical conditions
                    </CardDescription>
                  </div>
                  <Dialog open={isAddConditionOpen} onOpenChange={setIsAddConditionOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Condition
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Medical Condition</DialogTitle>
                        <DialogDescription>
                          Add a new medical condition to your health record
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newCondition">Condition Name *</Label>
                          <Input
                            id="newCondition"
                            value={newCondition.condition}
                            onChange={(e) =>
                              setNewCondition((prev) => ({
                                ...prev,
                                condition: e.target.value,
                              }))
                            }
                            placeholder="e.g., Type 2 Diabetes, Hypertension"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="diagnosedAt">Diagnosed Date</Label>
                          <Input
                            id="diagnosedAt"
                            type="date"
                            value={newCondition.diagnosedAt}
                            onChange={(e) =>
                              setNewCondition((prev) => ({
                                ...prev,
                                diagnosedAt: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddConditionOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddCondition}
                          disabled={!newCondition.condition || addCondition.isPending}
                        >
                          {addCondition.isPending ? 'Adding...' : 'Add Condition'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {conditions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No medical conditions recorded</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add conditions to help doctors provide better care
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conditions.map((condition) => (
                      <div
                        key={condition.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold">{condition.condition}</h4>
                          {condition.diagnosedAt && (
                            <p className="text-sm text-muted-foreground">
                              Diagnosed: {format(new Date(condition.diagnosedAt), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCondition(condition.id)}
                          disabled={removeCondition.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
