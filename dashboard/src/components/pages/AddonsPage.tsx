import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IconPlus, IconTrash, IconPencil } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { getAddons, createAddon, updateAddon, deleteAddon, Addon } from '../../data/mockAddons';

export type { Addon } from '../../data/mockAddons';

interface AddonsPageProps {
  user: any;
  addons?: Addon[];
  onCreateAddon?: (data: Omit<Addon, 'id'>) => Promise<void>;
  onUpdateAddon?: (id: string, data: Omit<Addon, 'id'>) => Promise<void>;
  onDeleteAddon?: (id: string) => Promise<void>;
}

export function AddonsPage({ user, addons: externalAddons, onCreateAddon: externalCreateAddon, onUpdateAddon: externalUpdateAddon, onDeleteAddon: externalDeleteAddon }: AddonsPageProps) {
  const [addons, setAddons] = useState<Addon[]>(externalAddons || getAddons());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addonToDelete, setAddonToDelete] = useState<string | null>(null);
  const [newAddonData, setNewAddonData] = useState({
    name: '',
    description: '',
    estimatedTime: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    estimatedTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAddon = async () => {
    let hasErrors = false;
    if (!newAddonData.name) {
      setErrors(prev => ({ ...prev, name: 'Please fill in the addon name' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, name: '' }));
    }
    if (!newAddonData.estimatedTime) {
      setErrors(prev => ({ ...prev, estimatedTime: 'Please fill in the estimated time' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, estimatedTime: '' }));
    }
    if (hasErrors) return;

    setIsLoading(true);
    setError(null);

    try {
      if (externalCreateAddon) {
        await externalCreateAddon(newAddonData);
      } else {
        createAddon(newAddonData);
      }
      setAddons(getAddons());
      setIsCreateDialogOpen(false);
      setNewAddonData({ name: '', description: '', estimatedTime: '' });
      setErrors({ name: '', estimatedTime: '' });
    } catch (err) {
      setError('Failed to create addon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddon = (addon: Addon) => {
    setEditingAddon(addon);
    setNewAddonData({
      name: addon.name,
      description: addon.description,
      estimatedTime: addon.estimatedTime,
    });
  };

  const handleSaveEdit = async () => {
    let hasErrors = false;
    if (!editingAddon || !newAddonData.name) {
      setErrors(prev => ({ ...prev, name: 'Please fill in the addon name' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, name: '' }));
    }
    if (!editingAddon || !newAddonData.estimatedTime) {
      setErrors(prev => ({ ...prev, estimatedTime: 'Please fill in the estimated time' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, estimatedTime: '' }));
    }
    if (hasErrors) return;

    setIsLoading(true);
    setError(null);

    try {
      if (externalUpdateAddon) {
        await externalUpdateAddon(editingAddon.id, newAddonData);
      } else {
        updateAddon(editingAddon.id, newAddonData);
      }
      setAddons(getAddons());
      setEditingAddon(null);
      setNewAddonData({ name: '', description: '', estimatedTime: '' });
      setErrors({ name: '', estimatedTime: '' });
    } catch (err) {
      setError('Failed to update addon');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddon = (id: string) => {
    setDeleteDialogOpen(true);
    setAddonToDelete(id);
  };

  const confirmDeleteAddon = async () => {
    if (addonToDelete) {
      setIsLoading(true);
      setError(null);

      try {
        if (externalDeleteAddon) {
          await externalDeleteAddon(addonToDelete);
        } else {
          deleteAddon(addonToDelete);
        }
        setAddons(getAddons());
        setDeleteDialogOpen(false);
        setAddonToDelete(null);
      } catch (err) {
        setError('Failed to delete addon');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Service Add-ons</h1>
          <p className="text-gray-600">Manage available additional services</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
          <IconPlus className="w-4 h-4 mr-2" />
          New Add-on
        </Button>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-0">
          {addons.map((addon, index) => (
            <div key={addon.id} className={`p-6 hover:bg-gray-50 transition-colors ${index !== 0 ? 'border-t' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-gray-900 font-medium">{addon.name}</h3>
                    <Badge className="bg-[#033620] text-white shadow-sm">
                      {addon.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{addon.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" className="shadow-sm" onClick={() => handleEditAddon(addon)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 shadow-sm" onClick={() => handleDeleteAddon(addon.id)}>
                    <IconTrash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create/Edit Addon Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingAddon} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingAddon(null);
          setNewAddonData({ name: '', description: '', estimatedTime: '' });
          setErrors({ name: '', estimatedTime: '' });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" aria-describedby="addon-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingAddon ? 'Edit Add-on' : 'New Service Add-on'}</DialogTitle>
            <DialogDescription>
              {editingAddon ? 'Edit the service add-on details and pricing' : 'Create a new service add-on with pricing and checklist'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addonName">
                Add-on Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="addonName"
                placeholder="e.g: Microwave"
                value={newAddonData.name}
                onChange={(e) => setNewAddonData({ ...newAddonData, name: e.target.value })}
                className="shadow-sm"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addonDescription">Description</Label>
              <Textarea
                id="addonDescription"
                placeholder="Service description..."
                value={newAddonData.description}
                onChange={(e) => setNewAddonData({ ...newAddonData, description: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addonTime">
                Estimated Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="addonTime"
                placeholder="e.g: 15 min"
                value={newAddonData.estimatedTime}
                onChange={(e) => setNewAddonData({ ...newAddonData, estimatedTime: e.target.value })}
                className="shadow-sm"
              />
              {errors.estimatedTime && <p className="text-red-500 text-sm">{errors.estimatedTime}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingAddon(null);
              setNewAddonData({ name: '', description: '', estimatedTime: '' });
              setErrors({ name: '', estimatedTime: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={editingAddon ? handleSaveEdit : handleCreateAddon} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              {editingAddon ? 'Save Changes' : 'Create Add-on'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Addon Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the add-on.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAddon} className="bg-red-600 hover:bg-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}