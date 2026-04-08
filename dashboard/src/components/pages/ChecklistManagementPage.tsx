import { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IconPlus, IconTrash, IconMenu2 } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { fetchAreas, createArea as apiCreateArea, updateArea as apiUpdateArea, deleteArea as apiDeleteArea, AreaAPI } from '../../services/api';

export function ChecklistManagementPage({ user }: { user: any }) {
  const [areas, setAreas] = useState<AreaAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaAPI | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);
  const [newAreaData, setNewAreaData] = useState({
    name: '',
    description: '',
    estimatedDuration: 0,
    checklist: ['']
  });
  const [durationValue, setDurationValue] = useState<number | ''>(0);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours'>('minutes');
  const [errors, setErrors] = useState({
    name: '',
    checklist: '',
  });

  const resetDurationUI = () => { setDurationValue(0); setDurationUnit('minutes'); };

  const loadAreas = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await fetchAreas();
      setAreas(data);
    } catch (err: any) {
      console.error('Failed to load areas:', err);
      setLoadError(err.message || 'Failed to load areas. Please try logging out and back in.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAreas(); }, [loadAreas]);

  const handleCreateArea = async () => {
    let hasErrors = false;
    if (!newAreaData.name) {
      setErrors(prev => ({ ...prev, name: 'Area name is required' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, name: '' }));
    }
    if (newAreaData.checklist.filter(item => item.trim()).length === 0) {
      setErrors(prev => ({ ...prev, checklist: 'At least one checklist item is required' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, checklist: '' }));
    }
    if (hasErrors) return;

    const filteredChecklist = newAreaData.checklist.filter(item => item.trim());
    try {
      await apiCreateArea({ name: newAreaData.name, estimatedDuration: newAreaData.estimatedDuration, checklist: filteredChecklist });
      await loadAreas();
    } catch (err) {
      console.error('Failed to create area:', err);
    }
    setIsCreateDialogOpen(false);
    setNewAreaData({ name: '', description: '', estimatedDuration: 0, checklist: [''] });
    setErrors({ name: '', checklist: '' });
    resetDurationUI();
  };

  const handleEditArea = (area: AreaAPI) => {
    setEditingArea(area);
    const stored = area.estimatedDuration ?? 0;
    // Reverse-convert: if divisible by 60 and >= 60, show as hours; otherwise minutes
    if (stored >= 60 && stored % 60 === 0) {
      setDurationValue(stored / 60);
      setDurationUnit('hours');
    } else {
      setDurationValue(stored || '');
      setDurationUnit('minutes');
    }
    setNewAreaData({
      name: area.name,
      description: area.description,
      estimatedDuration: stored,
      checklist: [...area.checklist],
    });
  };

  const handleSaveEdit = async () => {
    let hasErrors = false;
    if (!editingArea || !newAreaData.name) {
      setErrors(prev => ({ ...prev, name: 'Area name is required' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, name: '' }));
    }
    if (newAreaData.checklist.filter(item => item.trim()).length === 0) {
      setErrors(prev => ({ ...prev, checklist: 'At least one checklist item is required' }));
      hasErrors = true;
    } else {
      setErrors(prev => ({ ...prev, checklist: '' }));
    }
    if (hasErrors) return;

    const filteredChecklist = newAreaData.checklist.filter(item => item.trim());
    try {
      await apiUpdateArea(editingArea.id, { name: newAreaData.name, estimatedDuration: newAreaData.estimatedDuration, checklist: filteredChecklist });
      await loadAreas();
    } catch (err) {
      console.error('Failed to update area:', err);
    }
    setEditingArea(null);
    setNewAreaData({ name: '', description: '', estimatedDuration: 0, checklist: [''] });
    setErrors({ name: '', checklist: '' });
    resetDurationUI();
  };

  const handleDeleteArea = (id: string) => {
    setAreaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteArea = async () => {
    if (areaToDelete) {
      try {
        await apiDeleteArea(areaToDelete);
        await loadAreas();
      } catch (err) {
        console.error('Failed to delete area:', err);
      }
    }
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  const addChecklistItem = () => {
    setNewAreaData({
      ...newAreaData,
      checklist: [...newAreaData.checklist, '']
    });
  };

  const updateChecklistItem = (index: number, value: string) => {
    const updated = [...newAreaData.checklist];
    updated[index] = value;
    setNewAreaData({ ...newAreaData, checklist: updated });
  };

  const removeChecklistItem = (index: number) => {
    setNewAreaData({
      ...newAreaData,
      checklist: newAreaData.checklist.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Areas & Checklist</h1>
          <p className="text-gray-600">Create and manage cleaning areas and their checklists</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
          <IconPlus className="w-4 h-4 mr-2" />
          New Area
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {loadError ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-3">{loadError}</p>
              <Button variant="outline" onClick={loadAreas}>Retry</Button>
            </div>
          ) : areas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No areas created yet. Click "New Area" to get started.</p>
            </div>
          ) : (
            areas.map((area) => (
              <div key={area.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-gray-900 font-medium">{area.name}</h3>
                      <Badge className="bg-[#033620] text-white shadow-sm">
                        {area.checklist.length} tasks
                      </Badge>
                      {area.estimatedDuration > 0 && (() => {
                        const h = Math.floor(area.estimatedDuration / 60);
                        const m = area.estimatedDuration % 60;
                        const label = h > 0 && m > 0
                          ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min`
                          : h > 0
                          ? `${h} ${h === 1 ? 'hour' : 'hours'}`
                          : `${m} min`;
                        return <Badge variant="outline" className="text-gray-600 shadow-sm">{label}</Badge>;
                      })()}
                    </div>
                    <p className="text-sm text-gray-500">{area.description}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" className="shadow-sm" onClick={() => handleEditArea(area)}>
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 shadow-sm" onClick={() => handleDeleteArea(area.id)}>
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Area Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingArea} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingArea(null);
          setNewAreaData({ name: '', description: '', estimatedDuration: 0, checklist: [''] });
          setErrors({ name: '', checklist: '' });
          resetDurationUI();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" aria-describedby="area-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Edit Area' : 'New Cleaning Area'}</DialogTitle>
            <DialogDescription>
              {editingArea ? 'Edit the cleaning area and its checklist' : 'Create a new cleaning area with a custom checklist'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="areaName">Area Name</Label>
              <Input
                id="areaName"
                placeholder="e.g: Kitchen"
                value={newAreaData.name}
                onChange={(e) => setNewAreaData({ ...newAreaData, name: e.target.value })}
                className="shadow-sm"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="areaDescription">Description</Label>
              <Textarea
                id="areaDescription"
                placeholder="Brief area description..."
                value={newAreaData.description}
                onChange={(e) => setNewAreaData({ ...newAreaData, description: e.target.value })}
                rows={2}
                className="shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Estimated Duration</Label>
              <div className="flex gap-2">
                <Input
                  id="estimatedDuration"
                  type="number"
                  min={1}
                  placeholder="e.g: 30"
                  value={durationValue === 0 ? '' : durationValue}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                    setDurationValue(val);
                    setNewAreaData({ ...newAreaData, estimatedDuration: val === '' ? 0 : durationUnit === 'hours' ? (val as number) * 60 : (val as number) });
                  }}
                  className="shadow-sm flex-1"
                />
                <Select
                  value={durationUnit}
                  onValueChange={(unit: 'minutes' | 'hours') => {
                    setDurationUnit(unit);
                    const val = typeof durationValue === 'number' && durationValue > 0 ? durationValue : 0;
                    setNewAreaData({ ...newAreaData, estimatedDuration: unit === 'hours' ? val * 60 : val });
                  }}
                >
                  <SelectTrigger className="w-32 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">Minutes</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Task Checklist</Label>
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 border rounded-md p-3 bg-gray-50">
                {newAreaData.checklist.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Task ${index + 1}`}
                      value={item}
                      onChange={(e) => updateChecklistItem(index, e.target.value)}
                      className="shadow-sm bg-white"
                    />
                    {newAreaData.checklist.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeChecklistItem(index)}
                        className="shadow-sm"
                      >
                        <IconTrash className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {errors.checklist && <p className="text-red-500 text-sm">{errors.checklist}</p>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
                className="w-full shadow-sm"
              >
                <IconPlus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              setEditingArea(null);
              setNewAreaData({ name: '', description: '', estimatedDuration: 0, checklist: [''] });
              setErrors({ name: '', checklist: '' });
              resetDurationUI();
            }}>
              Cancel
            </Button>
            <Button onClick={editingArea ? handleSaveEdit : handleCreateArea} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              {editingArea ? 'Save Changes' : 'Create Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Area Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the area and its checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteArea} className="bg-red-600 hover:bg-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}