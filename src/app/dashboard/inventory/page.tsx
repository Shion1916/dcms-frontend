'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Package, Plus, RefreshCw, AlertTriangle, TrendingUp, PackagePlus, ArrowUp, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';
import useSWR from 'swr';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;          // always in usage units (pieces)
  unit: string;              // usage unit, e.g., "pcs"
  purchaseUnit: string;      // e.g., "box"
  conversionFactor: number;  // pieces per box
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryResponse {
  items: InventoryItem[];
}

interface AddItemFormData {
  itemName: string;
  category: string;
  purchaseQuantity: number;  // quantity in purchase units
  unit: string;              // usage unit
  purchaseUnit: string;      // purchase unit
  conversionFactor: number;  // usage units per purchase unit
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
}

interface RestockFormData {
  itemId: string;
  purchaseQuantity: number;  // quantity in purchase units
  notes?: string;
}

interface EditItemFormData {
  itemName: string;
  category: string;
  unit: string;              // usage unit
  purchaseUnit: string;      // purchase unit
  conversionFactor: number;  // usage units per purchase unit
  minThreshold: number;      // in usage units
  maxThreshold: number;      // in usage units
}

// SWR fetcher function
const fetchInventory = async (url: string): Promise<InventoryResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch inventory');
  }
  return response.json();
};

export default function InventoryPage() {
  const { user } = useAuth();
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restockingItems, setRestockingItems] = useState<Set<string>>(new Set());

  // Form states
  const [addItemForm, setAddItemForm] = useState<AddItemFormData>({
    itemName: '',
    category: '',
    purchaseQuantity: 0,
    unit: 'pcs',
    purchaseUnit: '',
    conversionFactor: 1,
    minThreshold: 0,
    maxThreshold: 0,
  });

  const [restockForm, setRestockForm] = useState<RestockFormData>({
    itemId: '',
    purchaseQuantity: 0,
    notes: '',
  });

  const [editItemForm, setEditItemForm] = useState<EditItemFormData>({
    itemName: '',
    category: '',
    unit: 'pcs',
    purchaseUnit: '',
    conversionFactor: 1,
    minThreshold: 0,
    maxThreshold: 0,
  });

  const canManageInventory = user?.role === 'admin' || user?.role === 'staff';

  // Use SWR for data fetching with caching
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    canManageInventory ? 'inventory' : null,
    () => fetchInventory('/api/inventory'),
    {
      refreshInterval: 30000, // Refresh every 30 seconds (more frequent for inventory)
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds (more responsive)
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      keepPreviousData: true, // Keep previous data while loading new data
    }
  );

  const items = data?.items || [];

  // Calculate stats with category breakdown
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);
  const outOfStockItems = items.filter(item => item.quantity === 0);
  const wellStockedItems = items.filter(item => item.quantity > item.minThreshold);

  // Category breakdown for stats
  const getTopCategories = (itemList: InventoryItem[]) => {
    const categoryCount = itemList.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => `${category} (${count})`)
      .join(', ');
  };

  // Helper functions for unit conversion
  const convertToUsageUnits = (purchaseQty: number, conversionFactor: number) => {
    return purchaseQty * conversionFactor;
  };

  const convertToPurchaseUnits = (usageQty: number, conversionFactor: number) => {
    return Math.ceil(usageQty / conversionFactor);
  };

  const formatConversion = (purchaseQty: number, conversionFactor: number, purchaseUnit: string, usageUnit: string) => {
    const usageQty = convertToUsageUnits(purchaseQty, conversionFactor);
    return `${purchaseQty} ${purchaseUnit}${purchaseQty !== 1 ? 's' : ''} → ${usageQty} ${usageUnit}`;
  };

  // Suggested thresholds based on typical stock
  const getSuggestedThresholds = (category: string, totalUsageUnits: number) => {
    let minPercentage = 0.25; // 25% default
    let maxMultiplier = 2; // 2x default

    // Category-specific suggestions
    switch (category) {
      case 'consumables':
      case 'hygiene':
        minPercentage = 0.30; // 30% for high-usage items
        maxMultiplier = 2.5;
        break;
      case 'medications':
        minPercentage = 0.20; // 20% for controlled items
        maxMultiplier = 1.5;
        break;
      case 'equipment':
      case 'instruments':
        minPercentage = 0.15; // 15% for durable items
        maxMultiplier = 1.2;
        break;
    }

    return {
      min: Math.ceil(totalUsageUnits * minPercentage),
      max: Math.ceil(totalUsageUnits * maxMultiplier)
    };
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (item.quantity <= item.minThreshold) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else if (item.quantity >= item.maxThreshold) {
      return { status: 'overstocked', label: 'Overstocked', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const handleAddItem = async () => {
    if (!canManageInventory || isSubmitting) return;

    setIsSubmitting(true);
    
    // Convert purchase quantity to usage units
    const totalUsageUnits = convertToUsageUnits(addItemForm.purchaseQuantity, addItemForm.conversionFactor);
    
    // Create optimistic item
    const optimisticItem: InventoryItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      itemName: addItemForm.itemName,
      category: addItemForm.category,
      quantity: totalUsageUnits,
      unit: addItemForm.unit,
      purchaseUnit: addItemForm.purchaseUnit,
      conversionFactor: addItemForm.conversionFactor,
      minThreshold: addItemForm.minThreshold,
      maxThreshold: addItemForm.maxThreshold,
      lastRestocked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Optimistic update - add item immediately to UI
      mutate(
        (currentData) => {
          if (!currentData) return { items: [optimisticItem] };
          return { ...currentData, items: [...currentData.items, optimisticItem] };
        },
        false // Don't revalidate immediately
      );

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: addItemForm.itemName,
          category: addItemForm.category,
          quantity: totalUsageUnits, // store in usage units
          unit: addItemForm.unit,
          purchaseUnit: addItemForm.purchaseUnit,
          conversionFactor: addItemForm.conversionFactor,
          minThreshold: addItemForm.minThreshold,
          maxThreshold: addItemForm.maxThreshold,
          addedBy: user?.email,
        }),
      });

      if (response.ok) {
        const { item } = await response.json();
        // Update with real item from server
        mutate(
          (currentData) => {
            if (!currentData) return { items: [item] };
            return {
              ...currentData,
              items: currentData.items.map(i => 
                i.id === optimisticItem.id ? item : i
              )
            };
          },
          false
        );
        
        setIsAddItemDialogOpen(false);
        setAddItemForm({
          itemName: '',
          category: '',
          purchaseQuantity: 0,
          unit: 'pcs',
          purchaseUnit: '',
          conversionFactor: 1,
          minThreshold: 0,
          maxThreshold: 0,
        });
        toast.success(`${addItemForm.itemName} added to inventory successfully`);
      } else {
        // Revert optimistic update on error
        mutate(
          (currentData) => {
            if (!currentData) return { items: [] };
            return {
              ...currentData,
              items: currentData.items.filter(i => i.id !== optimisticItem.id)
            };
          },
          false
        );
        
        const error = await response.json();
        toast.error(`Failed to add item: ${error.error}`);
      }
    } catch (error) {
      // Revert optimistic update on error
      mutate(
        (currentData) => {
          if (!currentData) return { items: [] };
          return {
            ...currentData,
            items: currentData.items.filter(i => i.id !== optimisticItem.id)
          };
        },
        false
      );
      toast.error('Failed to add item - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!canManageInventory || isSubmitting || !selectedItem) return;

    setIsSubmitting(true);
    
    // Convert purchase quantity to usage units
    const usageUnitsToAdd = convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor);
    const originalQuantity = selectedItem.quantity;
    const newQuantity = originalQuantity + usageUnitsToAdd;
    
    try {
      // Mark item as being restocked
      setRestockingItems(prev => new Set(prev.add(selectedItem.id)));
      
      // Optimistic update - update quantity immediately in UI
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            items: currentData.items.map(item => 
              item.id === selectedItem.id 
                ? { 
                    ...item, 
                    quantity: newQuantity, 
                    lastRestocked: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                : item
            )
          };
        },
        false // Don't revalidate immediately
      );

      const response = await fetch(`/api/inventory/${selectedItem.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: usageUnitsToAdd, // send usage units to server
          purchaseQuantity: restockForm.purchaseQuantity,
          notes: restockForm.notes,
          restockedBy: user?.email,
        }),
      });

      if (response.ok) {
        const { item } = await response.json();
        // Update with real item from server
        mutate(
          (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              items: currentData.items.map(i => 
                i.id === selectedItem.id ? item : i
              )
            };
          },
          false
        );
        
        // Remove from restocking set
        setRestockingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedItem.id);
          return newSet;
        });
        
        setIsRestockDialogOpen(false);
        setSelectedItem(null);
        setRestockForm({ itemId: '', purchaseQuantity: 0, notes: '' });
        toast.success(`${selectedItem.itemName} restocked successfully`);
      } else {
        // Remove from restocking set and revert optimistic update on error
        setRestockingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedItem.id);
          return newSet;
        });
        
        mutate(
          (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              items: currentData.items.map(item => 
                item.id === selectedItem.id 
                  ? { ...item, quantity: originalQuantity }
                  : item
              )
            };
          },
          false
        );
        
        const error = await response.json();
        toast.error(`Failed to restock item: ${error.error}`);
      }
    } catch (error) {
      // Remove from restocking set and revert optimistic update on error
      setRestockingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedItem.id);
        return newSet;
      });
      
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            items: currentData.items.map(item => 
              item.id === selectedItem.id 
                ? { ...item, quantity: originalQuantity }
                : item
            )
          };
        },
        false
      );
      toast.error('Failed to restock item - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async () => {
    if (!canManageInventory || isSubmitting || !selectedItem) return;

    setIsSubmitting(true);
    
    try {
      // Optimistic update - update item immediately in UI
      mutate(
        (currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            items: currentData.items.map(item => 
              item.id === selectedItem.id 
                ? { 
                    ...item, 
                    itemName: editItemForm.itemName,
                    category: editItemForm.category,
                    unit: editItemForm.unit,
                    purchaseUnit: editItemForm.purchaseUnit,
                    conversionFactor: editItemForm.conversionFactor,
                    minThreshold: editItemForm.minThreshold,
                    maxThreshold: editItemForm.maxThreshold,
                    updatedAt: new Date().toISOString()
                  }
                : item
            )
          };
        },
        false // Don't revalidate immediately
      );

      const response = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: editItemForm.itemName,
          category: editItemForm.category,
          unit: editItemForm.unit,
          purchaseUnit: editItemForm.purchaseUnit,
          conversionFactor: editItemForm.conversionFactor,
          minThreshold: editItemForm.minThreshold,
          maxThreshold: editItemForm.maxThreshold,
          updatedBy: user?.email,
        }),
      });

      if (response.ok) {
        const { item } = await response.json();
        // Update with real item from server
        mutate(
          (currentData) => {
            if (!currentData) return currentData;
            return {
              ...currentData,
              items: currentData.items.map(i => 
                i.id === selectedItem.id ? item : i
              )
            };
          },
          false
        );
        
        setIsEditDialogOpen(false);
        setSelectedItem(null);
        setEditItemForm({
          itemName: '',
          category: '',
          unit: 'pcs',
          purchaseUnit: '',
          conversionFactor: 1,
          minThreshold: 0,
          maxThreshold: 0,
        });
        toast.success(`${editItemForm.itemName} updated successfully`);
      } else {
        // Revert optimistic update on error
        mutate(); // Just refetch the data
        
        const error = await response.json();
        toast.error(`Failed to update item: ${error.error}`);
      }
    } catch (error) {
      // Revert optimistic update on error
      mutate(); // Just refetch the data
      toast.error('Failed to update item - please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRestockDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setRestockForm({ itemId: item.id, purchaseQuantity: 0, notes: '' });
    setIsRestockDialogOpen(true);
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setEditItemForm({
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      purchaseUnit: item.purchaseUnit,
      conversionFactor: item.conversionFactor,
      minThreshold: item.minThreshold,
      maxThreshold: item.maxThreshold,
    });
    setIsEditDialogOpen(true);
  };

  const handleRefresh = () => {
    mutate();
  };

  if (!canManageInventory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Access denied. Only staff and admin can manage inventory.</p>
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load inventory</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">Manage dental clinic supplies and equipment</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="flex items-center gap-2"
            disabled={isValidating}
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the inventory with purchase and usage unit tracking.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={addItemForm.itemName}
                    onChange={(e) => setAddItemForm({ ...addItemForm, itemName: e.target.value })}
                    placeholder="e.g., Surgical Gloves"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={addItemForm.category} 
                    onValueChange={(value) => setAddItemForm({ ...addItemForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumables">Consumables</SelectItem>
                      <SelectItem value="instruments">Instruments</SelectItem>
                      <SelectItem value="medications">Medications</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="hygiene">Hygiene Supplies</SelectItem>
                      <SelectItem value="materials">Dental Materials</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit">Usage Unit</Label>
                    <Select 
                      value={addItemForm.unit} 
                      onValueChange={(value) => setAddItemForm({ ...addItemForm, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Usage unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Pieces</SelectItem>
                        <SelectItem value="units">Units</SelectItem>
                        <SelectItem value="ml">Milliliters</SelectItem>
                        <SelectItem value="g">Grams</SelectItem>
                        <SelectItem value="doses">Doses</SelectItem>
                        <SelectItem value="applications">Applications</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purchaseUnit">Purchase Unit</Label>
                    <Select 
                      value={addItemForm.purchaseUnit} 
                      onValueChange={(value) => setAddItemForm({ ...addItemForm, purchaseUnit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Purchase unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pcs">Piece</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="tube">Tube</SelectItem>
                        <SelectItem value="packet">Packet</SelectItem>
                        <SelectItem value="bag">Bag</SelectItem>
                        <SelectItem value="case">Case</SelectItem>
                        <SelectItem value="kit">Kit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="conversionFactor">Conversion Factor ({addItemForm.unit} per {addItemForm.purchaseUnit})</Label>
                    <Input
                      id="conversionFactor"
                      type="text"
                      value={addItemForm.conversionFactor.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setAddItemForm({ ...addItemForm, conversionFactor: parseInt(value) || 1 });
                      }}
                      placeholder="e.g., 100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchaseQuantity">Initial Stock (in {addItemForm.purchaseUnit}s)</Label>
                    <Input
                      id="purchaseQuantity"
                      type="text"
                      value={addItemForm.purchaseQuantity.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setAddItemForm({ ...addItemForm, purchaseQuantity: parseInt(value) || 0 });
                      }}
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>
                {addItemForm.purchaseQuantity > 0 && addItemForm.conversionFactor > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Total: {formatConversion(addItemForm.purchaseQuantity, addItemForm.conversionFactor, addItemForm.purchaseUnit, addItemForm.unit)}
                    </p>
                  </div>
                )}
                {addItemForm.purchaseQuantity > 0 && addItemForm.conversionFactor > 0 && addItemForm.category && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Suggested Thresholds</h4>
                    {(() => {
                      const totalUsage = convertToUsageUnits(addItemForm.purchaseQuantity, addItemForm.conversionFactor);
                      const suggestions = getSuggestedThresholds(addItemForm.category, totalUsage);
                      return (
                        <div className="text-sm text-blue-700">
                          <p>Min: {suggestions.min} {addItemForm.unit} (Low stock alert)</p>
                          <p>Max: {suggestions.max} {addItemForm.unit} (Maximum inventory)</p>
                          <button
                            type="button"
                            className="text-xs text-blue-600 underline mt-1"
                            onClick={() => setAddItemForm({ 
                              ...addItemForm, 
                              minThreshold: suggestions.min, 
                              maxThreshold: suggestions.max 
                            })}
                          >
                            Apply suggestions
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minThreshold">Min Threshold ({addItemForm.unit})</Label>
                    <Input
                      id="minThreshold"
                      type="text"
                      value={addItemForm.minThreshold.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setAddItemForm({ ...addItemForm, minThreshold: parseInt(value) || 0 });
                      }}
                      placeholder="e.g., 50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxThreshold">Max Threshold ({addItemForm.unit})</Label>
                    <Input
                      id="maxThreshold"
                      type="text"
                      value={addItemForm.maxThreshold.toString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setAddItemForm({ ...addItemForm, maxThreshold: parseInt(value) || 0 });
                      }}
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAddItem} 
                    disabled={isSubmitting || !addItemForm.itemName || !addItemForm.category || !addItemForm.purchaseUnit || addItemForm.conversionFactor <= 0}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Item'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddItemDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Inventory Overview</h2>
          <span className="text-sm text-gray-500">
            • Stats are based on consumables, medications, hygiene, dental materials categories
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Well Stocked</p>
              <p className="text-2xl font-bold">{wellStockedItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
            </div>
            {isValidating && (
              <div className="ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Sections */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="space-y-4 mb-8">
          {/* Out of Stock Alert */}
          {outOfStockItems.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Critical: Out of Stock Items
                </CardTitle>
                <p className="text-sm text-red-700">
                  Categories affected: {getTopCategories(outOfStockItems) || 'Various categories'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {outOfStockItems.slice(0, 4).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      onClick={() => openRestockDialog(item)}
                      className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-100"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Restock {item.itemName}
                    </Button>
                  ))}
                  {outOfStockItems.length > 4 && (
                    <span className="text-sm text-red-600 self-center">
                      +{outOfStockItems.length - 4} more items need immediate restocking
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Quick Actions */}
          {lowStockItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Quick Actions - Low Stock Items
                </CardTitle>
                <p className="text-sm text-yellow-700">
                  Categories needing attention: {getTopCategories(lowStockItems) || 'Various categories'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.slice(0, 6).map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="sm"
                      onClick={() => openRestockDialog(item)}
                      className="flex items-center gap-2 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Restock {item.itemName}
                    </Button>
                  ))}
                  {lowStockItems.length > 6 && (
                    <span className="text-sm text-yellow-600 self-center">
                      +{lowStockItems.length - 6} more items running low
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Items
            {isValidating && (
              <div className="flex items-center gap-2 text-sm text-blue-600 ml-auto">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inventory items found</p>
              <p className="text-gray-400 text-sm">Add your first item to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Min Threshold</TableHead>
                    <TableHead>Max Threshold</TableHead>
                    <TableHead>Last Restocked</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const isLowStock = item.quantity <= item.minThreshold;
                    
                    return (
                      <TableRow 
                        key={item.id} 
                        className={`${isLowStock ? 'bg-red-50 border-red-100' : ''} ${item.id.startsWith('temp-') ? 'opacity-75 animate-pulse' : ''}`}
                      >
                        <TableCell>
                          <div className={`font-medium ${isLowStock ? 'text-red-800' : ''}`}>
                            {item.itemName}
                            {item.id.startsWith('temp-') && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Adding...
                              </Badge>
                            )}
                            {restockingItems.has(item.id) && (
                              <Badge variant="outline" className="ml-2 text-xs border-blue-200 text-blue-600">
                                Restocking...
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`${isLowStock ? 'text-red-600' : ''}`}>
                            <span className="font-medium">{item.quantity}</span>
                            <div className="text-xs text-gray-500">
                              ({convertToPurchaseUnits(item.quantity, item.conversionFactor)} {item.purchaseUnit}s)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.unit}</span>
                            <div className="text-xs text-gray-500">
                              Buy: {item.purchaseUnit} ({item.conversionFactor}:1)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.minThreshold}</TableCell>
                        <TableCell>{item.maxThreshold}</TableCell>
                        <TableCell>{formatDate(item.lastRestocked)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={stockStatus.color}
                          >
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {canManageInventory && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(item)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRestockDialog(item)}
                                className="flex items-center gap-1"
                              >
                                <TrendingUp className="h-3 w-3" />
                                Restock
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
            <DialogDescription>
              Add stock to this item by entering the purchase quantity.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{selectedItem.itemName}</h4>
                <p className="text-sm text-gray-600">
                  Current: {selectedItem.quantity} {selectedItem.unit} ({convertToPurchaseUnits(selectedItem.quantity, selectedItem.conversionFactor)} {selectedItem.purchaseUnit}s)
                </p>
                <p className="text-sm text-gray-600">Category: {selectedItem.category}</p>
                <p className="text-sm text-gray-600">
                  Conversion: {selectedItem.conversionFactor} {selectedItem.unit} per {selectedItem.purchaseUnit}
                </p>
              </div>
              <div>
                <Label htmlFor="restockQuantity">Purchase Quantity (in {selectedItem.purchaseUnit}s)</Label>
                <Input
                  id="restockQuantity"
                  type="text"
                  value={restockForm.purchaseQuantity.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setRestockForm({ ...restockForm, purchaseQuantity: parseInt(value) || 0 });
                  }}
                  placeholder={`e.g., 5`}
                />
                {restockForm.purchaseQuantity > 0 && (
                  <p className="text-sm text-blue-600 mt-1">
                    {formatConversion(restockForm.purchaseQuantity, selectedItem.conversionFactor, selectedItem.purchaseUnit, selectedItem.unit)}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="restockNotes">Notes (Optional)</Label>
                <Input
                  id="restockNotes"
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                  placeholder="Supplier, batch number, etc."
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  New quantity will be: <strong>
                    {selectedItem.quantity + convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor)} {selectedItem.unit}
                  </strong>
                </p>
                <p className="text-xs text-blue-600">
                  ({convertToPurchaseUnits(selectedItem.quantity + convertToUsageUnits(restockForm.purchaseQuantity, selectedItem.conversionFactor), selectedItem.conversionFactor)} {selectedItem.purchaseUnit}s total)
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleRestock} 
                  disabled={isSubmitting || restockForm.purchaseQuantity <= 0}
                  className="flex-1"
                >
                  {isSubmitting ? 'Restocking...' : 'Restock Item'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRestockDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update item details. Current stock quantity will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editItemName">Item Name</Label>
                  <Input
                    id="editItemName"
                    value={editItemForm.itemName}
                    onChange={(e) => setEditItemForm({ ...editItemForm, itemName: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="editCategory">Category</Label>
                  <Select 
                    value={editItemForm.category} 
                    onValueChange={(value) => setEditItemForm({ ...editItemForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumables">Consumables</SelectItem>
                      <SelectItem value="medications">Medications</SelectItem>
                      <SelectItem value="hygiene">Hygiene</SelectItem>
                      <SelectItem value="dental materials">Dental Materials</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="instruments">Instruments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editUnit">Usage Unit</Label>
                  <Select 
                    value={editItemForm.unit} 
                    onValueChange={(value) => setEditItemForm({ ...editItemForm, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Usage unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="ml">Milliliters</SelectItem>
                      <SelectItem value="g">Grams</SelectItem>
                      <SelectItem value="doses">Doses</SelectItem>
                      <SelectItem value="applications">Applications</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPurchaseUnit">Purchase Unit</Label>
                  <Select 
                    value={editItemForm.purchaseUnit} 
                    onValueChange={(value) => setEditItemForm({ ...editItemForm, purchaseUnit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Purchase unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                      <SelectItem value="tube">Tube</SelectItem>
                      <SelectItem value="packet">Packet</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="case">Case</SelectItem>
                      <SelectItem value="kit">Kit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editConversionFactor">Conversion Factor ({editItemForm.unit} per {editItemForm.purchaseUnit})</Label>
                <Input
                  id="editConversionFactor"
                  type="text"
                  value={editItemForm.conversionFactor.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEditItemForm({ ...editItemForm, conversionFactor: parseInt(value) || 1 });
                  }}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editMinThreshold">Min Threshold ({editItemForm.unit})</Label>
                  <Input
                    id="editMinThreshold"
                    type="text"
                    value={editItemForm.minThreshold.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditItemForm({ ...editItemForm, minThreshold: parseInt(value) || 0 });
                    }}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <Label htmlFor="editMaxThreshold">Max Threshold ({editItemForm.unit})</Label>
                  <Input
                    id="editMaxThreshold"
                    type="text"
                    value={editItemForm.maxThreshold.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditItemForm({ ...editItemForm, maxThreshold: parseInt(value) || 0 });
                    }}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Current stock quantity will remain unchanged. Only item details will be updated.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleEditItem} 
                  disabled={isSubmitting || !editItemForm.itemName || !editItemForm.category || !editItemForm.purchaseUnit || editItemForm.conversionFactor <= 0}
                  className="flex-1"
                >
                  {isSubmitting ? 'Updating...' : 'Update Item'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}