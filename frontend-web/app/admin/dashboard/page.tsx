'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { usePendingDoctors } from '@/lib/hooks/useAdmin';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Users, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: pendingData, isLoading } = usePendingDoctors();
  const pendingCount = pendingData?.data?.length || 0;

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Manage and oversee the MedBuddy platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Doctor Verification Card */}
            <Card className={pendingCount > 0 ? 'border-amber-300 bg-amber-50/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Users className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Doctor Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        {isLoading ? 'Loading...' : `${pendingCount} pending`}
                      </p>
                    </div>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <Link href="/admin/doctors">
                  <Button variant="outline" className="w-full">
                    Review Applications
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Specialties Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Specialties</h3>
                    <p className="text-sm text-muted-foreground">Manage medical specialties</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" disabled>
                  Coming soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
