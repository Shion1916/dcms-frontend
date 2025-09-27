'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Edit3, X, Plus } from 'lucide-react';
import { useServices } from '../contexts/ServiceContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format } from 'date-fns';
import { ServiceInstance } from '../types';
import { formatTimeSlotForDisplay } from '../utils/timeUtils';

interface Note {
  id: string;
  content: string;
  authorEmail: string;
  authorRole: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  reason: string;
  message?: string;
  status: 'booked' | 'completed' | 'cancelled';
  cancellationReason?: 'no-show' | 'patient-cancelled' | 'clinic-cancelled' | 'emergency' | 'other';
  appointmentDate?: string;
  appointmentTime?: string;
  dentistName?: string;
  date?: string; // Legacy field from server
  time?: string; // Legacy field from server
  createdAt: string;
  updatedAt: string;
}

interface AppointmentCardProps {
  appointment: Appointment;
  userRole: string;
  userEmail: string;
  onUpdate: () => void;
}

const CANCELLATION_REASONS = [
  { value: 'no-show', label: 'No-show' },
  { value: 'patient-cancelled', label: 'Patient cancelled' },
  { value: 'clinic-cancelled', label: 'Clinic cancelled' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'other', label: 'Other' }
];

export function AppointmentCard({ appointment, userRole, userEmail, onUpdate }: AppointmentCardProps) {
  const { servicesCatalog } = useServices();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [cancelData, setCancelData] = useState({
    reason: '',
    notes: ''
  });
  const [selectedServices, setSelectedServices] = useState<ServiceInstance[]>([]);
  const [completionData, setCompletionData] = useState({
    notes: ''
  });
  const [selectedServiceForAdd, setSelectedServiceForAdd] = useState('');

  // Auto-fill a default service when opening completion dialog
  useEffect(() => {
    if (isCompleting && selectedServices.length === 0 && servicesCatalog.length > 0) {
      // Auto-select the first service (most commonly used service - routine cleaning)
      const defaultService = servicesCatalog.find(s => s.name.toLowerCase().includes('cleaning')) || servicesCatalog[0];
      if (defaultService) {
        addServiceToAppointment(defaultService.id);
      }
    }
  }, [isCompleting, selectedServices.length, servicesCatalog]);

  const canAddNotes = userRole === 'dentist' || userRole === 'admin';
  const canManageAppointments = userRole === 'admin' || userRole === 'staff';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCancellationReasonDisplay = (reason?: string) => {
    const reasonObj = CANCELLATION_REASONS.find(r => r.value === reason);
    return reasonObj ? reasonObj.label : reason;
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointment.id}/notes`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointment.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          content: newNote,
          authorEmail: userEmail,
          authorRole: userRole
        })
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const updateAppointmentStatus = async (newStatus: string, additionalData?: any) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData
        })
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelData.reason.trim()) {
      return;
    }

    // Add cancellation note if provided
    if (cancelData.notes.trim()) {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointment.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          content: `Appointment cancelled. Reason: ${getCancellationReasonDisplay(cancelData.reason)}${cancelData.notes ? `\n\nNotes: ${cancelData.notes}` : ''}`,
          authorEmail: userEmail,
          authorRole: userRole
        })
      });
    }

    await updateAppointmentStatus('cancelled', {
      cancellationReason: cancelData.reason
    });
    
    setIsCancelling(false);
    setCancelData({ reason: '', notes: '' });
  };

  const handleMarkAsCompleted = async () => {
    if (!completionData.notes.trim()) {
      return;
    }

    // If no services selected but dialog is open, ensure we have at least the default service
    if (selectedServices.length === 0 && servicesCatalog.length > 0) {
      const defaultService = servicesCatalog.find(s => s.name.toLowerCase().includes('cleaning')) || servicesCatalog[0];
      if (defaultService) {
        const newServiceInstance: ServiceInstance = {
          id: `si_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          serviceId: defaultService.id,
          serviceName: defaultService.name,
          description: defaultService.description,
          basePrice: defaultService.base_price,
          finalPrice: defaultService.base_price,
          treatmentDetail: defaultService.has_treatment_detail ? '' : undefined,
          notes: ''
        };
        setSelectedServices([newServiceInstance]);
        // Wait a moment for state to update then try again
        setTimeout(() => handleMarkAsCompleted(), 100);
        return;
      }
    }

    // Create detailed service summary
    const servicesSummary = selectedServices.map(service => {
      let serviceText = `• ${service.serviceName} - ₱${service.finalPrice.toFixed(2)}`;
      if (service.treatmentDetail) {
        serviceText += ` (${service.treatmentDetail})`;
      }
      if (service.notes) {
        serviceText += `\n  Notes: ${service.notes}`;
      }
      return serviceText;
    }).join('\n');

    const totalAmount = getTotalAmount();
    const noteContent = `Appointment Completed\n\nServices Provided:\n${servicesSummary}\n\nTotal Amount: ₱${totalAmount.toFixed(2)}\n\nAppointment Notes: ${completionData.notes}`;

    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/appointments/${appointment.id}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({
        content: noteContent,
        authorEmail: userEmail,
        authorRole: userRole
      })
    });

    await updateAppointmentStatus('completed');
    
    setIsCompleting(false);
    setSelectedServices([]);
    setCompletionData({ notes: '' });
    setSelectedServiceForAdd('');
  };

  // Service management functions
  const addServiceToAppointment = (serviceId: string) => {
    const service = servicesCatalog.find(s => s.id === serviceId);
    if (!service) return;

    // Check if service is already added
    const existingService = selectedServices.find(s => s.serviceId === serviceId);
    if (existingService) return;

    const newServiceInstance: ServiceInstance = {
      id: `si_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serviceId: service.id,
      serviceName: service.name,
      description: service.description,
      basePrice: service.base_price,
      finalPrice: service.base_price,
      treatmentDetail: service.has_treatment_detail ? '' : undefined,
      notes: ''
    };

    setSelectedServices(prev => [...prev, newServiceInstance]);
    setSelectedServiceForAdd(''); // Reset the select dropdown
  };

  const updateServiceInstance = (instanceId: string, field: keyof ServiceInstance, value: any) => {
    setSelectedServices(prev => 
      prev.map(service => 
        service.id === instanceId 
          ? { ...service, [field]: value }
          : service
      )
    );
  };

  const removeServiceInstance = (instanceId: string) => {
    setSelectedServices(prev => prev.filter(service => service.id !== instanceId));
  };

  const getTotalAmount = () => {
    return selectedServices.reduce((total, service) => total + service.finalPrice, 0);
  };



  const handleNotesClick = () => {
    if (!showNotes) {
      fetchNotes();
    }
    setShowNotes(!showNotes);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {userRole === 'patient' ? 'Your Appointment' : appointment.patientName}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
              {appointment.status === 'cancelled' && appointment.cancellationReason && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {getCancellationReasonDisplay(appointment.cancellationReason)}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Requested: {format(new Date(appointment.createdAt), 'MMM dd, yyyy')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Patient Info - Hidden for patients viewing their own appointments */}
        {userRole !== 'patient' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{appointment.patientEmail}</span>
            </div>
            {appointment.patientPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{appointment.patientPhone}</span>
              </div>
            )}
          </div>
        )}

        {/* Appointment Details */}
        {(appointment.appointmentDate || appointment.date) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                {format(new Date(appointment.appointmentDate || appointment.date || ''), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm">
                {formatTimeSlotForDisplay(appointment.appointmentTime || appointment.time || '')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm">{appointment.dentistName}</span>
            </div>
          </div>
        )}

        {/* Reason & Message */}
        {(appointment.reason || appointment.message) && (
          <div className="space-y-2">
            {appointment.reason && (
              <div>
                <Label className="text-sm font-medium">
                  {userRole === 'patient' ? 'Note:' : 'Service booked:'}
                </Label>
                <p className="text-sm text-gray-700">{appointment.reason}</p>
              </div>
            )}
            {appointment.message && (
              <div>
                <Label className="text-sm font-medium">Additional Information:</Label>
                <p className="text-sm text-gray-700">{appointment.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Staff Quick Actions for Booked Appointments */}
          {canManageAppointments && appointment.status === 'booked' && (
            <>
              <Dialog open={isCompleting} onOpenChange={setIsCompleting}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Completed
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Complete Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Service Selection */}
                    <div>
                      <Label>Add Services</Label>
                      <Select value={selectedServiceForAdd} onValueChange={(value) => {
                        setSelectedServiceForAdd(value);
                        addServiceToAppointment(value);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicesCatalog
                            .filter(service => !selectedServices.some(s => s.serviceId === service.id))
                            .map(service => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - ₱{service.base_price}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Services */}
                    {selectedServices.length > 0 && (
                      <div className="space-y-3">
                        <Label>Selected Services</Label>
                        {selectedServices.map(service => (
                          <div key={service.id} className="border p-3 rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium">{service.serviceName}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeServiceInstance(service.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {service.treatmentDetail !== undefined && (
                              <div>
                                <Label htmlFor={`treatment-${service.id}`}>Treatment Detail</Label>
                                <Input
                                  id={`treatment-${service.id}`}
                                  value={service.treatmentDetail}
                                  onChange={(e) => updateServiceInstance(service.id, 'treatmentDetail', e.target.value)}
                                  placeholder="Enter treatment details..."
                                />
                              </div>
                            )}

                            <div>
                              <Label htmlFor={`price-${service.id}`}>Final Price</Label>
                              <Input
                                id={`price-${service.id}`}
                                type="number"
                                value={service.finalPrice}
                                onChange={(e) => updateServiceInstance(service.id, 'finalPrice', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`notes-${service.id}`}>Service Notes</Label>
                              <Textarea
                                id={`notes-${service.id}`}
                                value={service.notes}
                                onChange={(e) => updateServiceInstance(service.id, 'notes', e.target.value)}
                                placeholder="Additional notes for this service..."
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        
                        <div className="text-right font-medium">
                          Total: ₱{getTotalAmount().toFixed(2)}
                        </div>
                      </div>
                    )}

                    {/* Completion Notes */}
                    <div>
                      <Label htmlFor="completion-notes">Appointment Notes *</Label>
                      <Textarea
                        id="completion-notes"
                        value={completionData.notes}
                        onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Enter completion notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleMarkAsCompleted} 
                        className="flex-1"
                        disabled={!completionData.notes.trim()}
                      >
                        Complete Appointment
                      </Button>
                      <Button variant="outline" onClick={() => {
                        setIsCompleting(false);
                        setSelectedServices([]);
                        setCompletionData({ notes: '' });
                        setSelectedServiceForAdd('');
                      }} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => setIsCancelling(true)}
              >
                Cancel Appointment
              </Button>
            </>
          )}

          {/* Notes Button */}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleNotesClick}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            Notes
          </Button>

          {/* Add Note Button (Dentists only) */}
          {canAddNotes && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="flex items-center gap-1">
                  <Edit3 className="h-4 w-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter your note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={addNote} 
                      disabled={isAddingNote}
                      className="flex-1"
                    >
                      {isAddingNote ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Cancel Dialog */}
        <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancel-reason">Reason for Cancellation *</Label>
                <Select
                  value={cancelData.reason}
                  onValueChange={(value) => setCancelData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cancel-notes">Additional Notes</Label>
                <Textarea
                  id="cancel-notes"
                  value={cancelData.notes}
                  onChange={(e) => setCancelData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional additional details..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleCancelAppointment} 
                  className="flex-1"
                  variant="destructive"
                  disabled={!cancelData.reason.trim()}
                >
                  Cancel Appointment
                </Button>
                <Button variant="outline" onClick={() => setIsCancelling(false)} className="flex-1">
                  Keep Appointment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notes Display */}
        {showNotes && (
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium">Appointment Notes</Label>
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No notes yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">{note.authorEmail}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {note.authorRole}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}