'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useServices } from '../../../contexts/ServiceContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Switch } from '../../../components/ui/switch';
import { Plus, Edit3, Trash2, DollarSign, Wrench, Search, RefreshCw, Clock, Timer } from 'lucide-react';
import { ServiceCatalogItem } from '../../../types';
import { toast } from 'sonner';

export default function ServicesPage() {
  const { user } = useAuth();
  const { 
    servicesCatalog, 
    canManageServices, 
    isLoading, 
    error,
    fetchServicesCatalog,
    createCatalogService,
    updateCatalogService,
    deleteCatalogService,
    refreshAll,
    clearError
  } = useServices();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceCatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    has_treatment_detail: false,
    estimated_duration: '',
    buffer_time: ''
  });

  useEffect(() => {
    if (canManageServices) {
      fetchServicesCatalog();
    }
  }, [canManageServices]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const filteredServices = servicesCatalog.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      has_treatment_detail: false,
      estimated_duration: '',
      buffer_time: ''
    });
    setEditingService(null);
  };

  const handleAddService = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.base_price || !formData.estimated_duration || !formData.buffer_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    const estimatedDuration = parseInt(formData.estimated_duration);
    const bufferTime = parseInt(formData.buffer_time);
    
    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
      toast.error('Please enter a valid estimated duration');
      return;
    }

    if (isNaN(bufferTime) || bufferTime < 0) {
      toast.error('Please enter a valid buffer time');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createCatalogService({
        name: formData.name.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        has_treatment_detail: formData.has_treatment_detail,
        estimated_duration: estimatedDuration,
        buffer_time: bufferTime
      });

      if (result.success) {
        toast.success('Service added successfully');
        resetForm();
        setIsAddDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to add service');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = async () => {
    if (!editingService || !formData.name.trim() || !formData.description.trim() || !formData.base_price || !formData.estimated_duration || !formData.buffer_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const basePrice = parseFloat(formData.base_price);
    const estimatedDuration = parseInt(formData.estimated_duration);
    const bufferTime = parseInt(formData.buffer_time);
    
    if (isNaN(basePrice) || basePrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (isNaN(estimatedDuration) || estimatedDuration <= 0) {
      toast.error('Please enter a valid estimated duration');
      return;
    }

    if (isNaN(bufferTime) || bufferTime < 0) {
      toast.error('Please enter a valid buffer time');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCatalogService(editingService.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        base_price: basePrice,
        has_treatment_detail: formData.has_treatment_detail,
        estimated_duration: estimatedDuration,
        buffer_time: bufferTime
      });

      if (result.success) {
        toast.success('Service updated successfully');
        resetForm();
      } else {
        toast.error(result.error || 'Failed to update service');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (service: ServiceCatalogItem) => {
    if (!confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      const result = await deleteCatalogService(service.id);
      if (result.success) {
        toast.success('Service deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete service');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const openEditDialog = (service: ServiceCatalogItem) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      base_price: service.base_price.toString(),
      has_treatment_detail: service.has_treatment_detail,
      estimated_duration: service.estimated_duration.toString(),
      buffer_time: service.buffer_time.toString()
    });
  };

  if (!canManageServices) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Access denied. Only staff, dentists, and administrators can access the services catalog.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services Catalog</h1>
          <p className="text-gray-600 mt-1">Manage dental services, pricing, and timing</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={refreshAll} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter service name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter service description"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Base Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                      placeholder="60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buffer">Buffer Time (minutes) *</Label>
                    <Input
                      id="buffer"
                      type="number"
                      min="0"
                      value={formData.buffer_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, buffer_time: e.target.value }))}
                      placeholder="15"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="treatment-detail"
                    checked={formData.has_treatment_detail}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_treatment_detail: checked }))}
                  />
                  <Label htmlFor="treatment-detail">Has Treatment Detail</Label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddService}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Service'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <Wrench className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-2xl font-bold">{servicesCatalog.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-bold">
                ${servicesCatalog.length > 0 
                  ? Math.round(servicesCatalog.reduce((sum, s) => sum + s.base_price, 0) / servicesCatalog.length)
                  : 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold">
                {servicesCatalog.length > 0 
                  ? Math.round(servicesCatalog.reduce((sum, s) => sum + s.estimated_duration, 0) / servicesCatalog.length)
                  : 0}m
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <Timer className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Buffer</p>
              <p className="text-2xl font-bold">
                {servicesCatalog.length > 0 
                  ? Math.round(servicesCatalog.reduce((sum, s) => sum + s.buffer_time, 0) / servicesCatalog.length)
                  : 0}m
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services List</CardTitle>
          <p className="text-sm text-gray-600">Manage service catalog, pricing, and timing</p>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No services found matching your search' : 'No services found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Buffer Time</TableHead>
                    <TableHead>Treatment Detail</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-500">ID: {service.id}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 line-clamp-2">{service.description}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{service.base_price.toFixed(2)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{service.estimated_duration}m</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4 text-orange-600" />
                          <span className="text-sm">{service.buffer_time}m</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={service.has_treatment_detail ? "default" : "outline"}>
                          {service.has_treatment_detail ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(service)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Edit Service</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Service Name *</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter service name"
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-description">Description *</Label>
                                  <Textarea
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter service description"
                                    rows={3}
                                    required
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="edit-price">Base Price ($) *</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                                    placeholder="0.00"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-duration">Estimated Duration (minutes) *</Label>
                                    <Input
                                      id="edit-duration"
                                      type="number"
                                      min="1"
                                      value={formData.estimated_duration}
                                      onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                                      placeholder="60"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-buffer">Buffer Time (minutes) *</Label>
                                    <Input
                                      id="edit-buffer"
                                      type="number"
                                      min="0"
                                      value={formData.buffer_time}
                                      onChange={(e) => setFormData(prev => ({ ...prev, buffer_time: e.target.value }))}
                                      placeholder="15"
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="edit-treatment-detail"
                                    checked={formData.has_treatment_detail}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_treatment_detail: checked }))}
                                  />
                                  <Label htmlFor="edit-treatment-detail">Has Treatment Detail</Label>
                                </div>

                                <div className="flex gap-2">
                                  <Button 
                                    onClick={handleEditService}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    {isSubmitting ? 'Updating...' : 'Update Service'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={resetForm}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteService(service)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Services Catalog Management</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Services catalog is only accessible to Staff, Dentists, and Administrators</li>
          <li>• Base prices can be used as defaults when creating appointments or billing</li>
          <li>• Estimated duration helps with appointment scheduling and time management</li>
          <li>• Buffer time includes preparation, cleanup, and transition between appointments</li>
          <li>• Services with treatment details may require additional documentation</li>
          <li>• All changes are tracked and can be audited by administrators</li>
        </ul>
      </div>
    </div>
  );
}