'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useMyPrescriptions } from '@/lib/hooks/usePrescriptions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { FileText, Download, Calendar, User } from 'lucide-react';

export default function PrescriptionsListPage() {
  const { data: prescriptionsData, isLoading } = useMyPrescriptions();

  const prescriptions = prescriptionsData?.data || [];

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Prescriptions</h1>
            <p className="text-muted-foreground">
              View and download your medical prescriptions
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading prescriptions...</p>
            </div>
          ) : prescriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-2">No prescriptions found</p>
                  <p className="text-sm text-muted-foreground">
                    Your prescriptions will appear here after consultations
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-lg">
                            Prescription #{prescription.prescriptionNumber}
                          </h3>
                          <Badge variant="outline">
                            {prescription.medicines.length} medicine{prescription.medicines.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Doctor:</span>
                            <span className="font-medium">
                              Dr. {prescription.doctor?.fullName || 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Issued:</span>
                            <span className="font-medium">
                              {format(new Date(prescription.issuedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        {prescription.notes && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notes:</strong> {prescription.notes}
                            </p>
                          </div>
                        )}

                        {prescription.medicines && prescription.medicines.length > 0 && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-semibold mb-2">Medicines:</p>
                            <div className="space-y-2">
                              {prescription.medicines.slice(0, 3).map((medicine) => (
                                <div
                                  key={medicine.id}
                                  className="text-sm bg-accent/50 p-2 rounded"
                                >
                                  <p className="font-medium">{medicine.medicineName}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {medicine.dosage} • {medicine.frequency} • {medicine.duration}
                                  </p>
                                </div>
                              ))}
                              {prescription.medicines.length > 3 && (
                                <p className="text-sm text-muted-foreground">
                                  +{prescription.medicines.length - 3} more medicine{prescription.medicines.length - 3 !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Link href={`/patient/prescriptions/${prescription.id}`}>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
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
