'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { usePrescription } from '@/lib/hooks/usePrescriptions';
import { prescriptionsAPI } from '@/lib/api/prescriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Download, FileText, User, Calendar, Pill } from 'lucide-react';

export default function PrescriptionDetailPage() {
  const params = useParams();
  const prescriptionId = params.id as string;

  const { data: prescriptionData, isLoading } = usePrescription(prescriptionId);

  const prescription = prescriptionData?.data;

  const handleDownloadPDF = async () => {
    try {
      const blob = await prescriptionsAPI.downloadPdf(prescriptionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescription?.prescriptionNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Prescription downloaded');
    } catch (error) {
      toast.error('Failed to download prescription');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-muted-foreground">Loading prescription...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!prescription) {
    return (
      <ProtectedRoute allowedRoles={['PATIENT']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-destructive">Prescription not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link href="/patient/prescriptions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Prescriptions
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Prescription Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5" />
                      Prescription #{prescription.prescriptionNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Issued on {format(new Date(prescription.issuedAt), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <Button onClick={handleDownloadPDF} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Prescribed By</p>
                      <p className="font-semibold">
                        Dr. {prescription.doctor?.fullName || 'Unknown'}
                      </p>
                      {prescription.doctor?.specialty && (
                        <p className="text-sm text-muted-foreground">
                          {prescription.doctor.specialty}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Issued Date</p>
                      <p className="font-semibold">
                        {format(new Date(prescription.issuedAt), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(prescription.issuedAt), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                {prescription.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold mb-1">General Instructions:</p>
                    <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Medicines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Prescribed Medicines ({prescription.medicines.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prescription.medicines.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No medicines prescribed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prescription.medicines.map((medicine, index) => (
                      <div
                        key={medicine.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <h3 className="font-semibold text-lg">
                                {medicine.medicineName}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Dosage</p>
                            <p className="font-medium">{medicine.dosage}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Frequency</p>
                            <p className="font-medium">{medicine.frequency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{medicine.duration}</p>
                          </div>
                        </div>

                        {medicine.instructions && (
                          <div className="bg-accent/50 p-3 rounded">
                            <p className="text-sm font-semibold mb-1">Instructions:</p>
                            <p className="text-sm">{medicine.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> Please follow the prescription exactly as directed.
                  Do not stop taking medications without consulting your doctor. Contact your
                  healthcare provider if you experience any unusual symptoms or side effects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
