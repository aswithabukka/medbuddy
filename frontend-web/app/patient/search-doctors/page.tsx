'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useDoctors, useSpecialties } from '@/lib/hooks/useDoctors';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Search, User, Star, Filter, X } from 'lucide-react';

export default function SearchDoctorsPage() {
  const [filters, setFilters] = useState({
    name: '',
    specialty: '',
    minFee: '',
    maxFee: '',
    language: '',
  });

  // Strip empty strings and convert fee fields to numbers before sending
  const searchParams = Object.fromEntries(
    Object.entries(filters)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => (k === 'minFee' || k === 'maxFee' ? [k, Number(v)] : [k, v]))
  );

  const { data: doctorsData, isLoading } = useDoctors(searchParams);
  const { data: specialtiesData } = useSpecialties();

  const doctors = doctorsData?.data || [];
  const specialties = specialtiesData?.data || [];

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      name: '',
      specialty: '',
      minFee: '',
      maxFee: '',
      language: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <ProtectedRoute allowedRoles={['PATIENT']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find a Doctor</h1>
            <p className="text-muted-foreground">
              Search for doctors by specialty, fee, and language
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filters</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="ml-auto"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Doctor Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g. John"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select
                    value={filters.specialty || undefined}
                    onValueChange={(value) => handleFilterChange('specialty', value)}
                  >
                    <SelectTrigger id="specialty">
                      <SelectValue placeholder="All specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty: any) => (
                        <SelectItem key={specialty.id} value={specialty.name}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minFee">Min Fee (₹)</Label>
                  <Input
                    id="minFee"
                    type="number"
                    placeholder="0"
                    value={filters.minFee}
                    onChange={(e) => handleFilterChange('minFee', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxFee">Max Fee (₹)</Label>
                  <Input
                    id="maxFee"
                    type="number"
                    placeholder="1000"
                    value={filters.maxFee}
                    onChange={(e) => handleFilterChange('maxFee', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={filters.language || undefined}
                    onValueChange={(value) => handleFilterChange('language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="All languages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Gujarati">Gujarati</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Punjabi">Punjabi</SelectItem>
                      <SelectItem value="Odia">Odia</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                      <SelectItem value="Assamese">Assamese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                'Loading doctors...'
              ) : (
                <>
                  Found {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
                  {hasActiveFilters && ' matching your filters'}
                </>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-2">No doctors found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {doctors.map((doctor: any) => (
                <Card key={doctor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-blue-100 rounded-full">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">
                              Dr. {doctor.fullName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {doctor.specialty}
                            </p>
                          </div>
                        </div>

                        {doctor.bio && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {doctor.bio}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Experience</p>
                            <p className="text-sm font-medium">
                              {doctor.experience} years
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Consultation Fee</p>
                            <p className="text-sm font-medium">
                              ₹{doctor.consultationFee}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Qualifications</p>
                            <p className="text-sm font-medium line-clamp-1">
                              {doctor.qualifications}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge
                              variant={
                                doctor.status === 'APPROVED' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {doctor.status}
                            </Badge>
                          </div>
                        </div>

                        {doctor.languages && doctor.languages.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-3">
                            <p className="text-xs text-muted-foreground">Languages:</p>
                            {doctor.languages.map((lang: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {lang.language}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {doctor.averageRating ? (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {doctor.averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({doctor.totalReviews} reviews)
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="ml-4">
                        <Link href={`/patient/doctors/${doctor.userId}`}>
                          <Button>
                            View Profile & Book
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
