'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Label } from '../../../../../components/ui/label';
import { Separator } from '../../../../../components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../../components/ui/dropdown-menu';
import { CheckCircle, Plus, Trash2, User, Clock, FileText, Coins, ChevronDown, ArrowLeft } from 'lucide-react';
import { Appointment, ServiceCatalogItem, Treatment } from '../../../../../types';
import { useServices } from '../../../../../utils/swrCache';
import { toast } from 'sonner';

interface AppointmentService {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration: number;
  buffer: number;
  has_treatment_detail?: boolean;
  finalPrice?: number;
  treatments?: Treatment[];
  totalAmount?: number;
  isInitial?: boolean; // Flag to identify initial booking service
}

export default function CompleteAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  const { user } = useAuth();
  
  const { data: servicesData } = useServices();
  const services = servicesData?.services || [];
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch appointment data
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      
      try {
        setIsLoadingAppointment(true);
        const response = await fetch(`/api/appointments/${appointmentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointment');
        }
        
        const data = await response.json();
        setAppointment(data.appointment);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment');
        router.push('/dashboard/appointments');
      } finally {
        setIsLoadingAppointment(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, router]);

  // Initialize appointment serviceDetails if needed
  useEffect(() => {
    if (appointment && (!appointment.serviceDetails || appointment.serviceDetails.length === 0)) {
      // Create initial service from booking data
      const initialService: AppointmentService = {
        id: appointment.serviceDetails?.[0]?.id || 'initial-service',
        name: appointment.serviceDetails?.[0]?.name || appointment.service || 'General Consultation',
        description: appointment.serviceDetails?.[0]?.description || `Service from appointment booking: ${appointment.service || 'General Consultation'}`,
        base_price: appointment.serviceDetails?.[0]?.base_price || 0,
        duration: appointment.serviceDetails?.[0]?.duration || 60,
        buffer: appointment.serviceDetails?.[0]?.buffer || 15,
        finalPrice: appointment.serviceDetails?.[0]?.base_price || 0,
        treatments: [],
        totalAmount: appointment.serviceDetails?.[0]?.base_price || 0,
        isInitial: true
      };
      
      // Update appointment with initial serviceDetails
      const updatedAppointment = {
        ...appointment,
        serviceDetails: [initialService]
      };
      setAppointment(updatedAppointment);
      setCompletionNotes('');
    }
  }, [appointment]);

  const handleAddService = (catalogServiceId: string) => {
    const catalogService = services.find((s: ServiceCatalogItem) => s.id === catalogServiceId);
    if (!catalogService || !appointment) return;

    const newService: AppointmentService = {
      id: catalogService.id,
      name: catalogService.name,
      description: catalogService.description,
      base_price: catalogService.base_price,
      duration: catalogService.estimated_duration,
      buffer: catalogService.buffer_time,
      has_treatment_detail: catalogService.has_treatment_detail,
      finalPrice: catalogService.base_price,
      treatments: catalogService.has_treatment_detail ? [{ id: crypto.randomUUID(), detail: '' }] : [],
      totalAmount: catalogService.base_price,
      isInitial: false
    };
    
    // Add to appointment.serviceDetails array
    const updatedAppointment = {
      ...appointment,
      serviceDetails: [...(appointment.serviceDetails || []), newService]
    };
    setAppointment(updatedAppointment);
  };

  const handleRemoveService = (serviceId: string) => {
    if (!appointment) return;
    
    // Don't allow removal of initial service
    const serviceToRemove = appointment.serviceDetails?.find(s => s.id === serviceId);
    if (serviceToRemove?.isInitial) {
      toast.error('Cannot remove the initial service from the appointment');
      return;
    }
    
    const updatedAppointment = {
      ...appointment,
      serviceDetails: appointment.serviceDetails?.filter(s => s.id !== serviceId) || []
    };
    setAppointment(updatedAppointment);
  };

  const handleServicePriceChange = (serviceId: string, finalPrice: number) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        const updated = { ...service, finalPrice };
        
        // Calculate total amount based on treatments or just final price
        if (service.has_treatment_detail && service.treatments) {
          const treatmentCount = Math.max(1, service.treatments.length);
          updated.totalAmount = finalPrice * treatmentCount;
        } else {
          updated.totalAmount = finalPrice;
        }
        
        return updated;
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleAddTreatment = (serviceId: string) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        const newTreatment: Treatment = {
          id: crypto.randomUUID(),
          detail: ''
        };
        const updatedTreatments = [...(service.treatments || []), newTreatment];
        const treatmentCount = Math.max(1, updatedTreatments.length);
        
        return {
          ...service,
          treatments: updatedTreatments,
          totalAmount: service.has_treatment_detail 
            ? (service.finalPrice || service.base_price) * treatmentCount 
            : (service.finalPrice || service.base_price)
        };
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleRemoveTreatment = (serviceId: string, treatmentId: string) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        const updatedTreatments = (service.treatments || []).filter(t => t.id !== treatmentId);
        const treatmentCount = Math.max(1, updatedTreatments.length);
        
        return {
          ...service,
          treatments: updatedTreatments,
          totalAmount: service.has_treatment_detail 
            ? (service.finalPrice || service.base_price) * treatmentCount 
            : (service.finalPrice || service.base_price)
        };
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleTreatmentChange = (serviceId: string, treatmentId: string, detail: string) => {
    if (!appointment) return;
    
    const updatedServiceDetails = appointment.serviceDetails?.map(service => {
      if (service.id === serviceId) {
        const updatedTreatments = (service.treatments || []).map(treatment =>
          treatment.id === treatmentId ? { ...treatment, detail } : treatment
        );
        
        return {
          ...service,
          treatments: updatedTreatments
        };
      }
      return service;
    }) || [];
    
    setAppointment({
      ...appointment,
      serviceDetails: updatedServiceDetails
    });
  };

  const handleCompleteAppointment = async () => {
    if (!appointment || !appointment.serviceDetails || appointment.serviceDetails.length === 0) return;
    
    // Validate treatment services have at least one treatment
    for (const service of appointment.serviceDetails) {
      if (service.has_treatment_detail) {
        if (!service.treatments || service.treatments.length === 0 || 
            service.treatments.every(t => t.detail.trim() === '')) {
          toast.error('Please add at least one treatment detail for all treatment-based services');
          return;
        }
      }
    }
    
    setIsLoading(true);
    try {
      // Prepare the appointment data for completion
      const appointmentToComplete = {
        ...appointment,
        status: 'completed',
        completionNotes,
        completedBy: user?.email,
        completedAt: new Date().toISOString()
      };
      console.log(appointmentToComplete);
      const response = await fetch(`/api/appointments/${appointment.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentToComplete),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to complete appointment (${response.status})`);
      }

      toast.success('Appointment completed successfully!');
      router.push('/dashboard/appointments');
    } catch (error) {
      console.error('Complete appointment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return time;
    }
  };

  const totalAmount = appointment?.serviceDetails?.reduce((sum, service) => sum + (service.totalAmount || service.finalPrice || service.base_price || 0), 0) || 0;
  
  const isValid = appointment?.serviceDetails && appointment.serviceDetails.length > 0 && 
    appointment.serviceDetails.every(s => {
      // Check treatment services have valid treatments
      if (s.has_treatment_detail) {
        return s.treatments && s.treatments.length > 0 && 
               s.treatments.some(t => t.detail.trim() !== '');
      }
      
      return true;
    });

  if (isLoadingAppointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading appointment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-lg mb-4">Appointment not found</p>
          <Button onClick={() => router.push('/dashboard/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/appointments')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Complete Appointment
          </h1>
          <p className="text-muted-foreground">Mark this appointment as completed and record services performed</p>
        </div>
      </div>

      {/* Appointment Summary */}
      <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
        <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">{appointment.patientName}</p>
              <p className="text-sm text-gray-600">{appointment.patientEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium">{formatTime(appointment.time)}</p>
              <p className="text-sm text-gray-600">{formatDate(appointment.date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Performed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Services Performed</h2>
            <p className="text-muted-foreground">Record all services and treatments provided during this appointment</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Service
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {services.map((catalogService: ServiceCatalogItem) => (
                <DropdownMenuItem 
                  key={catalogService.id} 
                  onClick={() => handleAddService(catalogService.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{catalogService.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ₱{catalogService.base_price.toLocaleString()}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-6">
          {appointment?.serviceDetails?.map((service, index) => {
            const hasDetailSupport = service.has_treatment_detail;

            return (
              <div key={service.id} className="border rounded-lg p-6 space-y-6 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {service.name}
                      {service.isInitial && (
                        <span className="ml-2 text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Initial Service
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  </div>
                  {!service.isInitial && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(service.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Price per {hasDetailSupport ? 'Treatment' : 'Service'} (₱)</Label>
                  <Input
                    type="number"
                    value={service.finalPrice || service.base_price}
                    onChange={(e) => handleServicePriceChange(service.id, parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="max-w-xs"
                  />
                </div>

                {/* Treatment Details (if service supports it) */}
                {hasDetailSupport && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Treatments (Required)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTreatment(service.id)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Treatment
                      </Button>
                    </div>

                    {service.treatments && service.treatments.length > 0 ? (
                      <div className="space-y-4">
                        {service.treatments.map((treatment, treatmentIndex) => (
                          <div key={treatment.id} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm font-medium">Treatment {treatmentIndex + 1}</Label>
                              <Textarea
                                value={treatment.detail}
                                onChange={(e) => handleTreatmentChange(service.id, treatment.id, e.target.value)}
                                placeholder="Enter specific treatment details, procedures performed, materials used, etc."
                                rows={3}
                              />
                            </div>
                            {service.treatments!.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveTreatment(service.id, treatment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-7"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No treatments added yet</p>
                        <p className="text-sm">Click "Add Treatment" to add at least one treatment</p>
                      </div>
                    )}

                    {/* Treatment Count and Total Display */}
                    {service.treatments && service.treatments.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {service.treatments.length} treatment{service.treatments.length !== 1 ? 's' : ''} × ₱{(service.finalPrice || service.base_price).toLocaleString()}
                          </span>
                          <span className="text-lg font-semibold text-blue-600">
                            = ₱{((service.finalPrice || service.base_price) * service.treatments.length).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Service Total (for non-treatment services) */}
                {!hasDetailSupport && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Service Total</span>
                      <span className="text-lg font-semibold text-green-600">
                        ₱{(service.finalPrice || service.base_price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Total Summary */}
      <div className="bg-muted p-6 rounded-lg mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins className="h-6 w-6 text-muted-foreground" />
            <span className="text-xl font-medium">Total Amount</span>
          </div>
          <span className="text-2xl font-semibold text-green-600">
            ₱{totalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Overall Completion Notes */}
      <div className="space-y-3 mb-8">
        <Label className="text-base">Overall Completion Notes (Optional)</Label>
        <Textarea
          value={completionNotes}
          onChange={(e) => setCompletionNotes(e.target.value)}
          placeholder="Add any general notes about the appointment completion..."
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/appointments')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCompleteAppointment}
          disabled={!isValid || isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Completing...' : 'Mark as Completed'}
        </Button>
      </div>
    </div>
  );
}