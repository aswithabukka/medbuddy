'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Show navbar for authenticated routes (patient, doctor, admin)
  const showNavbar = pathname?.startsWith('/patient') || 
                     pathname?.startsWith('/doctor') || 
                     pathname?.startsWith('/admin');
  
  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
