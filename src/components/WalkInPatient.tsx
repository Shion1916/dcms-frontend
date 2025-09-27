'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UserPlus } from 'lucide-react';
import { usePatients } from '../contexts/PatientContext';

import { toast } from 'sonner';

interface WalkInPatientProps {
  staffEmail: string;
  onSuccess: (newPatient: any) => void;
}



export function WalkInPatient({ staffEmail, onSuccess }: WalkInPatientProps) {
  const { createWalkInPatient } = usePatients();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientData, setPatientData] = useState({
    name: '',
    email: '',
    phone: ''
  });



  const handlePatientSubmit = async () => {
    if (!patientData.name || !patientData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the walk-in patient
      const patientResult = await createWalkInPatient(patientData);
      
      if (patientResult.success && patientResult.patient) {
        toast.success('Walk-in patient added successfully');
        
        // Call success callback with patient data
        onSuccess(patientResult.patient);
        
        // Reset form and close dialog
        resetForm();
        setIsOpen(false);
      } else {
        toast.error(patientResult.error || 'Failed to add patient');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      console.error('Walk-in patient error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPatientData({ name: '', email: '', phone: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Walk-in Patient
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Walk-in Patient</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Walk-in patients will be recorded in the system but cannot login until they register themselves with a password. You can schedule appointments for them on their patient detail page.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={patientData.name}
              onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter patient's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={patientData.email}
              onChange={(e) => setPatientData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter patient's email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={patientData.phone}
              onChange={(e) => setPatientData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter patient's phone"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handlePatientSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Adding Patient...' : 'Add Patient'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}