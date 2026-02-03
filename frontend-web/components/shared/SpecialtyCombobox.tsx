'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Specialty {
  id: string;
  name: string;
  description?: string;
}

interface SpecialtyComboboxProps {
  specialties: Specialty[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SpecialtyCombobox({
  specialties,
  value,
  onChange,
  placeholder = 'Select or type specialty...',
}: SpecialtyComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  // Check if current value exists in specialties list
  const selectedSpecialty = specialties.find((s) => s.name === value);
  const isCustomValue = value && !selectedSpecialty;

  // Helper function to normalize search terms
  const normalizeSearchTerm = (term: string): string => {
    const normalized = term.toLowerCase().trim();

    // Handle common variations
    const variations: { [key: string]: string } = {
      'pediatrician': 'pediatrics',
      'cardiologist': 'cardiology',
      'dermatologist': 'dermatology',
      'neurologist': 'neurology',
      'psychiatrist': 'psychiatry',
      'gastroenterologist': 'gastroenterology',
      'endocrinologist': 'endocrinology',
      'ophthalmologist': 'ophthalmology',
      'nephrologist': 'nephrology',
      'urologist': 'urology',
      'gynecologist': 'gynecology',
      'obstetrician': 'obstetrics',
      'oncologist': 'oncology',
      'rheumatologist': 'rheumatology',
      'hematologist': 'hematology',
      'orthopedist': 'orthopedics',
      'orthopaedic': 'orthopedics',
      'paediatrician': 'pediatrics',
      'paediatrics': 'pediatrics',
    };

    return variations[normalized] || normalized;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {value || placeholder}
            {isCustomValue && (
              <span className="text-xs text-muted-foreground ml-2">
                (custom)
              </span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search specialty... (e.g., pediatrician, cardiology)"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground">
                  No matching specialty found. Try searching for the medical field (e.g., "pediatrics" instead of "pediatrician")
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup heading={`${specialties.length} specialties available`}>
              {specialties
                .filter((specialty) => {
                  // Show all if no search
                  if (!searchValue) return true;

                  const search = normalizeSearchTerm(searchValue);
                  const name = specialty.name.toLowerCase();
                  const description = specialty.description?.toLowerCase() || '';

                  // Match if normalized search term is in name or description
                  return name.includes(search) || description.includes(search);
                })
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((specialty) => (
                  <CommandItem
                    key={specialty.id}
                    value={specialty.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === specialty.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{specialty.name}</span>
                      {specialty.description && (
                        <span className="text-xs text-muted-foreground">
                          {specialty.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
