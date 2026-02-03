'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-hot-toast';
import { consultationsAPI } from '@/lib/api/consultations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save, Lock, Clock, CheckCircle } from 'lucide-react';

interface SOAPNoteEditorProps {
  appointmentId: string;
}

export function SOAPNoteEditor({ appointmentId }: SOAPNoteEditorProps) {
  const queryClient = useQueryClient();

  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [isFinalized, setIsFinalized] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Debounced values for auto-save
  const [debouncedSubjective] = useDebounce(subjective, 2000);
  const [debouncedObjective] = useDebounce(objective, 2000);
  const [debouncedAssessment] = useDebounce(assessment, 2000);
  const [debouncedPlan] = useDebounce(plan, 2000);

  // Fetch existing note
  const { data: noteData, isLoading } = useQuery({
    queryKey: ['consultation-note', appointmentId],
    queryFn: () => consultationsAPI.getNote(appointmentId),
  });

  const note = noteData?.data;

  // Initialize form with existing note
  useEffect(() => {
    if (note) {
      setSubjective(note.subjective || '');
      setObjective(note.objective || '');
      setAssessment(note.assessment || '');
      setPlan(note.plan || '');
      setIsFinalized(note.isFinalized || false);
    }
  }, [note]);

  // Auto-save mutation
  const saveMutation = useMutation({
    mutationFn: (data: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }) => consultationsAPI.createOrUpdateNote(appointmentId, data),
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['consultation-note', appointmentId] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to save note';
      toast.error(message);
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () => consultationsAPI.finalizeNote(appointmentId),
    onSuccess: () => {
      setIsFinalized(true);
      queryClient.invalidateQueries({ queryKey: ['consultation-note', appointmentId] });
      toast.success('Consultation note finalized. It can no longer be edited.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to finalize note';
      toast.error(message);
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (isFinalized) return;

    const hasChanges =
      debouncedSubjective !== (note?.subjective || '') ||
      debouncedObjective !== (note?.objective || '') ||
      debouncedAssessment !== (note?.assessment || '') ||
      debouncedPlan !== (note?.plan || '');

    if (hasChanges && !isLoading) {
      saveMutation.mutate({
        subjective: debouncedSubjective,
        objective: debouncedObjective,
        assessment: debouncedAssessment,
        plan: debouncedPlan,
      });
    }
  }, [
    debouncedSubjective,
    debouncedObjective,
    debouncedAssessment,
    debouncedPlan,
    isFinalized,
  ]);

  const handleFinalize = () => {
    if (!subjective && !objective && !assessment && !plan) {
      toast.error('Please add content to at least one section before finalizing');
      return;
    }
    finalizeMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading consultation note...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              SOAP Consultation Note
              {isFinalized && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  Finalized
                </Badge>
              )}
            </CardTitle>
            {lastSaved && !isFinalized && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Last saved at {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
          {!isFinalized && (
            <Button
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
            >
              <Lock className="h-4 w-4 mr-2" />
              {finalizeMutation.isPending ? 'Finalizing...' : 'Finalize Note'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="subjective" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subjective">Subjective</TabsTrigger>
            <TabsTrigger value="objective">Objective</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="subjective" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjective">Subjective (S)</Label>
              <p className="text-sm text-muted-foreground">
                Patient's complaints, symptoms, and history in their own words
              </p>
              <Textarea
                id="subjective"
                placeholder="Chief complaint, history of present illness, review of systems..."
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                disabled={isFinalized}
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="objective" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objective">Objective (O)</Label>
              <p className="text-sm text-muted-foreground">
                Doctor's observations, measurements, and examination findings
              </p>
              <Textarea
                id="objective"
                placeholder="Vital signs, physical examination findings, lab results..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                disabled={isFinalized}
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment (A)</Label>
              <p className="text-sm text-muted-foreground">
                Clinical diagnosis and impression
              </p>
              <Textarea
                id="assessment"
                placeholder="Diagnosis, differential diagnoses, clinical impression..."
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                disabled={isFinalized}
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan (P)</Label>
              <p className="text-sm text-muted-foreground">
                Treatment plan and follow-up actions
              </p>
              <Textarea
                id="plan"
                placeholder="Medications, procedures, referrals, follow-up instructions..."
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                disabled={isFinalized}
                className="min-h-[300px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        {saveMutation.isPending && !isFinalized && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}

        {isFinalized && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              This consultation note has been finalized and can no longer be edited.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
