'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { prescriptionsAPI } from '@/lib/api/prescriptions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, X, FileText, Download } from 'lucide-react';
import Link from 'next/link';

export default function PrescriptionWritingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const appointmentId = params.id as string;

  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    medicineName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });

  // Fetch prescription for this appointment
  const { data: appointmentData } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const response = await fetch(`/appointments/${appointmentId}`);
      return response.json();
    },
  });

  const prescription = appointmentData?.data?.prescription;

  // Create prescription mutation
  const createPrescription = useMutation({
    mutationFn: () =>
      prescriptionsAPI.create({
        appointmentId,
        notes: prescriptionNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Prescription created successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create prescription';
      toast.error(message);
    },
  });

  // Add medicine mutation
  const addMedicine = useMutation({
    mutationFn: () =>
      prescriptionsAPI.addMedicine(prescription.id, newMedicine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Medicine added successfully');
      setNewMedicine({
        medicineName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
      setIsAddMedicineOpen(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to add medicine';
      toast.error(message);
    },
  });

  // Remove medicine mutation
  const removeMedicine = useMutation({
    mutationFn: (medicineId: string) =>
      prescriptionsAPI.removeMedicine(prescription.id, medicineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
      toast.success('Medicine removed successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to remove medicine';
      toast.error(message);
    },
  });

  const handleCreatePrescription = () => {
    createPrescription.mutate();
  };

  const handleAddMedicine = () => {
    if (!newMedicine.medicineName || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.duration) {
      toast.error('Please fill in all required fields');
      return;
    }
    addMedicine.mutate();
  };

  const handleRemoveMedicine = (medicineId: string) => {
    if (confirm('Are you sure you want to remove this medicine?')) {
      removeMedicine.mutate(medicineId);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await prescriptionsAPI.downloadPdf(prescription.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescription.prescriptionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Prescription downloaded');
    } catch (error) {
      toast.error('Failed to download prescription');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['DOCTOR']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href={`/doctor/appointments/${appointmentId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Appointment
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Create Prescription */}
            {!prescription ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Create Prescription
                  </CardTitle>
                  <CardDescription>
                    Start by creating a prescription for this appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Prescription Notes</Label>
                    <Textarea
                      id="notes"
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      placeholder="General instructions and notes for the patient..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleCreatePrescription}
                    disabled={createPrescription.isPending}
                  >
                    {createPrescription.isPending
                      ? 'Creating...'
                      : 'Create Prescription'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Prescription Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Prescription #{prescription.prescriptionNumber}
                        </CardTitle>
                        <CardDescription>
                          Issued on {new Date(prescription.issuedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {prescription.notes && (
                      <div>
                        <Label>Notes</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {prescription.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Medicines */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Medicines</CardTitle>
                      <Dialog open={isAddMedicineOpen} onOpenChange={setIsAddMedicineOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Medicine
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Medicine</DialogTitle>
                            <DialogDescription>
                              Add a new medicine to this prescription
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="medicineName">Medicine Name *</Label>
                              <Input
                                id="medicineName"
                                value={newMedicine.medicineName}
                                onChange={(e) =>
                                  setNewMedicine((prev) => ({
                                    ...prev,
                                    medicineName: e.target.value,
                                  }))
                                }
                                placeholder="e.g., Amoxicillin"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dosage">Dosage *</Label>
                              <Input
                                id="dosage"
                                value={newMedicine.dosage}
                                onChange={(e) =>
                                  setNewMedicine((prev) => ({
                                    ...prev,
                                    dosage: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 500mg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="frequency">Frequency *</Label>
                              <Input
                                id="frequency"
                                value={newMedicine.frequency}
                                onChange={(e) =>
                                  setNewMedicine((prev) => ({
                                    ...prev,
                                    frequency: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 3 times daily"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="duration">Duration *</Label>
                              <Input
                                id="duration"
                                value={newMedicine.duration}
                                onChange={(e) =>
                                  setNewMedicine((prev) => ({
                                    ...prev,
                                    duration: e.target.value,
                                  }))
                                }
                                placeholder="e.g., 7 days"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="instructions">Instructions</Label>
                              <Textarea
                                id="instructions"
                                value={newMedicine.instructions}
                                onChange={(e) =>
                                  setNewMedicine((prev) => ({
                                    ...prev,
                                    instructions: e.target.value,
                                  }))
                                }
                                placeholder="Additional instructions (optional)"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsAddMedicineOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddMedicine}
                              disabled={addMedicine.isPending}
                            >
                              {addMedicine.isPending ? 'Adding...' : 'Add Medicine'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!prescription.medicines || prescription.medicines.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No medicines added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prescription.medicines.map((medicine: any) => (
                          <div
                            key={medicine.id}
                            className="flex items-start justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold">{medicine.medicineName}</h4>
                              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Dosage:</span>
                                  <p>{medicine.dosage}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Frequency:</span>
                                  <p>{medicine.frequency}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <p>{medicine.duration}</p>
                                </div>
                              </div>
                              {medicine.instructions && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {medicine.instructions}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMedicine(medicine.id)}
                              disabled={removeMedicine.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
