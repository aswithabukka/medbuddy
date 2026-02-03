'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('PATIENT' | 'DOCTOR' | 'ADMIN')[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // If no user, redirect to login
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // If specific roles are required and user doesn't have access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their appropriate dashboard or unauthorized page
      if (user.role === 'PATIENT') {
        router.push('/patient/dashboard');
      } else if (user.role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, allowedRoles, router]);

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  // Don't render if user doesn't have required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
