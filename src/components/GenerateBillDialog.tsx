'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, BillItem } from '../types';

interface GenerateBillDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onBillGenerated?: () => void;
}

export default function GenerateBillDialog({ 
  appointment, 
  isOpen, 
  onOpenChange, 
  onBillGenerated 
}: GenerateBillDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  const [billForm, setBillForm] = useState({
    notes: ''
  });

  // Initialize bill items when appointment changes
  useEffect(() => {
    if (appointment && appointment.serviceDetails && Array.isArray(appointment.serviceDetails)) {
      // Auto-populate from serviceDetails array
      const items = appointment.serviceDetails.map((service, index) => {
        // Count treatments as units for services with treatments
        ///const quantity = service.treatments && Array.isArray(service.treatments) 
        //  ? service.treatments.length 
        //  : 1;

        const quantity = service.has_treatment_detail
          ? (service.treatments?.length || 0)
          : 1;


        
        const unitPrice = service.finalPrice || service.base_price || service.totalAmount || 0;
        const subtotal = unitPrice * quantity;
        
        return {
          id: `item-${service.id || index}`,
          serviceId: service.id,
          serviceName: service.name,
          description: service.description || `Completed on ${appointment.date}`,
          quantity: quantity,
          unitPrice: unitPrice,
          subtotal: subtotal
        };
      });
      
      setBillItems(items);
      
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      toast.success(`Auto-populated ${items.length} service(s) - Total: ₱${totalAmount.toLocaleString()}`);
    } else if (appointment && appointment.service) {
      // Fallback for old appointment structure
      const suggestedPrice = appointment.service.toLowerCase().includes('consultation') ? 500 :
                            appointment.service.toLowerCase().includes('cleaning') ? 800 :
                            appointment.service.toLowerCase().includes('checkup') ? 300 : 
                            1000;

      setBillItems([{
        id: `item-${Date.now()}`,
        serviceName: appointment.service,
        description: `Completed service - ${appointment.date}`,
        quantity: 1,
        unitPrice: suggestedPrice,
        subtotal: suggestedPrice
      }]);
    }
  }, [appointment]);

  const calculateTotal = () => {
    return billItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handleGenerateBill = async () => {
    if (!appointment || isSubmitting) return;

    if (billItems.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      toast.error('Total amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patientId || 'anonymous',
          patientName: appointment.patientName,
          patientEmail: appointment.patientEmail,
          patientPhone: appointment.patientPhone,
          items: billItems,
          totalAmount,
          paidAmount: 0, // Always 0 for pending status
          paymentMethod: undefined, // No payment method initially
          notes: billForm.notes,
          createdBy: user?.email,
        }),
      });

      if (response.ok) {
        toast.success('Bill generated successfully');
        onOpenChange(false);
        onBillGenerated?.();
        
        // Reset form
        setBillItems([]);
        setBillForm({
          notes: ''
        });
      } else {
        const error = await response.json();
        toast.error(`Failed to generate bill: ${error.error}`);
      }
    } catch (error) {
      toast.error('Failed to generate bill - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return null;

  const totalAmount = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Generate Bill
          </DialogTitle>
          <DialogDescription>
            Create a bill for the completed appointment with services. Payment can be recorded later.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Patient Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{appointment.patientName}</span>
              </div>
              {appointment.patientEmail && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2">{appointment.patientEmail}</span>
                </div>
              )}
              {appointment.patientPhone && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2">{appointment.patientPhone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Appointment:</span>
                <span className="ml-2">{appointment.date} at {appointment.time}</span>
              </div>
            </div>
          </div>

          {/* Services & Pricing */}
          <div>
            <div className="mb-4">
              <h4 className="font-medium">Services & Pricing</h4>
            </div>

            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium">{item.serviceName}</h5>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <Label>Quantity</Label>
                      <div className="px-3 py-2 bg-gray-50 rounded-md font-medium">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <div className="px-3 py-2 bg-gray-50 rounded-md font-medium">
                        {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div>
                      <Label>Subtotal</Label>
                      <div className="px-3 py-2 bg-gray-50 rounded-md font-medium">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total Amount & Outstanding Balance */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Amount:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Outstanding Balance:</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Payment can be recorded later in the billing management section.
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="billNotes">Notes</Label>
              <Textarea
                id="billNotes"
                value={billForm.notes}
                onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                placeholder="Add any notes about the bill or services"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleGenerateBill} 
              disabled={
                isSubmitting || 
                billItems.length === 0 || 
                totalAmount <= 0
              }
              className="flex-1"
            >
              {isSubmitting ? 'Generating...' : 'Generate Bill'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}