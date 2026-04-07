import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IconPlus, IconTrash, IconPencil } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

import { getServiceTypes, createServiceType, updateServiceType, deleteServiceType, ServiceType } from '../../data/mockServiceTypes';

export type { ServiceType } from '../../data/mockServiceTypes';

interface ServiceTypesPageProps {
  user: any;
  serviceTypes?: ServiceType[];
  onCreateService?: (data: Omit<ServiceType, 'id'>) => Promise<void>;
  onUpdateService?: (id: string, data: Omit<ServiceType, 'id'>) => Promise<void>;
  onDeleteService?: (id: string) => Promise<void>;
}

export function ServiceTypesPage({ user, serviceTypes: externalServiceTypes, onCreateService, onUpdateService, onDeleteService }: ServiceTypesPageProps) {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(externalServiceTypes || getServiceTypes());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState({
    name: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateService = async () => {
    let hasErrors = false;
    const newErrors = { name: '' };

    if (!newServiceData.name) {
      newErrors.name = 'Service name is required';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onCreateService) {
        await onCreateService(newServiceData);
      } else {
        createServiceType(newServiceData);
      }
      setServiceTypes(getServiceTypes());
      setIsCreateDialogOpen(false);
      setNewServiceData({ name: '', description: '' });
      setErrors({ name: '' });
    } catch (err) {
      setError('Failed to create service type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = (service: ServiceType) => {
    setEditingService(service);
    setNewServiceData({
      name: service.name,
      description: service.description,
    });
  };

  const handleSaveEdit = async () => {
    let hasErrors = false;
    const newErrors = { name: '' };

    if (!editingService || !newServiceData.name) {
      newErrors.name = 'Service name is required';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (onUpdateService) {
        await onUpdateService(editingService.id, newServiceData);
      } else {
        updateServiceType(editingService.id, newServiceData);
      }
      setServiceTypes(getServiceTypes());
      setEditingService(null);
      setNewServiceData({ name: '', description: '' });
      setErrors({ name: '' });
    } catch (err) {
      setError('Failed to update service type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = (id: string) => {
    setDeleteDialogOpen(true);
    setServiceToDelete(id);
  };

  const confirmDeleteService = async () => {
    if (serviceToDelete) {
      setIsLoading(true);
      setError(null);

      try {
        if (onDeleteService) {
          await onDeleteService(serviceToDelete);
        } else {
          deleteServiceType(serviceToDelete);
        }
        setServiceTypes(getServiceTypes());
        setDeleteDialogOpen(false);
        setServiceToDelete(null);
      } catch (err) {
        setError('Failed to delete service type');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Service Types</h1>
          <p className="text-gray-600">Create and manage your cleaning service types</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
          <IconPlus className="w-4 h-4 mr-2" />
          New Service Type
        </Button>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-0">
          {serviceTypes.map((service, index) => (
            <div key={service.id} className={`p-6 hover:bg-gray-50 transition-colors ${index !== 0 ? 'border-t' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 font-medium">{service.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" className="shadow-sm" onClick={() => handleEditService(service)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 shadow-sm" onClick={() => handleDeleteService(service.id)}>
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create/Edit Service Type Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingService} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingService(null);
          setNewServiceData({ name: '', description: '' });
          setErrors({ name: '' });
        }
      }}>
        <DialogContent className="max-w-lg shadow-xl" aria-describedby="service-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service Type' : 'New Service Type'}</DialogTitle>
            <DialogDescription>
              {editingService ? 'Edit the service type details' : 'Create a new service type'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">
                Service Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serviceName"
                placeholder="e.g: Regular Cleaning"
                value={newServiceData.name}
                onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                className="shadow-sm"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Brief service description..."
                value={newServiceData.description}
                onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingService(null);
              setNewServiceData({ name: '', description: '' });
              setErrors({ name: '' });
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingService ? handleSaveEdit : handleCreateService} 
              className="bg-[#033620] hover:bg-[#022819] shadow-md text-white"
              disabled={isLoading}
            >
              {editingService ? 'Save Changes' : 'Create Service Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Type Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteService} className="bg-red-600 hover:bg-red-500" disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}