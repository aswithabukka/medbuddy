import { DoctorProfile } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { UserCircle, Star, Briefcase, Languages } from 'lucide-react';

interface DoctorCardProps {
  doctor: DoctorProfile;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(doctor.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{doctor.fullName}</h3>
                <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(doctor.status)}>
                {doctor.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {doctor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {doctor.bio}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{doctor.experience} years exp.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">₹</span>
            <span>{doctor.consultationFee}</span>
          </div>
        </div>

        {doctor.languages && doctor.languages.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {doctor.languages.slice(0, 3).map((lang) => (
                <Badge key={lang.id} variant="outline" className="text-xs">
                  {lang.language}
                </Badge>
              ))}
              {doctor.languages.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{doctor.languages.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Qualifications:</strong> {doctor.qualifications}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {doctor.status === 'APPROVED' ? (
          <Link href={`/patient/doctors/${doctor.userId}`} className="w-full">
            <Button className="w-full">View Profile & Book</Button>
          </Link>
        ) : (
          <Button className="w-full" disabled>
            {doctor.status === 'PENDING'
              ? 'Pending Approval'
              : 'Not Available'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
