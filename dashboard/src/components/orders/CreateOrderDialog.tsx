import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { IconPlus, IconX } from '@tabler/icons-react';
import { Alert, AlertDescription } from '../ui/alert';

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (orderData: any) => Promise<void>;
}

const mockServiceTypes = ['Regular Cleaning', 'Deep Cleaning', 'Move-out Cleaning', 'Post-Construction Cleaning'];
const mockAreas = ['Kitchen', 'Bathroom', 'Living Room', 'Dining Room', 'Bedroom', 'Master Bedroom', 'Laundry'];
const mockAddons = ['Microwave', 'Refrigerator', 'Oven', 'Windows', 'Balcony', 'Cabinets'];
const mockEmployees = [
  { id: '1', name: 'John Perez' },
  { id: '2', name: 'Anna Lopez' },
  { id: '3', name: 'Peter Sanchez' },
  { id: '4', name: 'Maria Torres' },
];

export function CreateOrderDialog({ open, onOpenChange, onSubmit }: CreateOrderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    scheduledDate: '',
    scheduledTime: '',
    serviceType: '',
    duration: '',
    areas: [] as string[],
    addons: [] as string[],
    assignedEmployees: [] as string[],
    goal: '',
    customerNotes: '',
    accessInstructions: '',
  });

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      scheduledDate: '',
      scheduledTime: '',
      serviceType: '',
      duration: '',
      areas: [],
      addons: [],
      assignedEmployees: [],
      goal: '',
      customerNotes: '',
      accessInstructions: '',
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Generate random order number
      const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderData = { orderNumber, ...formData };
      
      if (onSubmit) {
        // Use external API
        await onSubmit(orderData);
      } else {
        // Mock submission
        console.log('Creating order:', orderData);
      }
      
      // Success - close dialog and reset form
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const toggleAddon = (addon: string) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.includes(addon)
        ? prev.addons.filter(a => a !== addon)
        : [...prev.addons, addon]
    }));
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployees: prev.assignedEmployees.includes(employeeId)
        ? prev.assignedEmployees.filter(id => id !== employeeId)
        : [...prev.assignedEmployees, employeeId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <DialogHeader>
          <DialogTitle>New Cleaning Order</DialogTitle>
          <DialogDescription>
            Create a new cleaning service order by filling out customer information, scheduling details, and service requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address</Label>
              <Input
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                required
                className="shadow-sm"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Date and Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Service Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value })}>
                  <SelectTrigger className="shadow-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockServiceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g: 2 hours"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Areas */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Areas to Clean</h3>
            <div className="grid grid-cols-3 gap-3">
              {mockAreas.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area}`}
                    checked={formData.areas.includes(area)}
                    onCheckedChange={() => toggleArea(area)}
                  />
                  <label
                    htmlFor={`area-${area}`}
                    className="text-sm cursor-pointer"
                  >
                    {area}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Add-ons</h3>
            <div className="grid grid-cols-3 gap-3">
              {mockAddons.map((addon) => (
                <div key={addon} className="flex items-center space-x-2">
                  <Checkbox
                    id={`addon-${addon}`}
                    checked={formData.addons.includes(addon)}
                    onCheckedChange={() => toggleAddon(addon)}
                  />
                  <label
                    htmlFor={`addon-${addon}`}
                    className="text-sm cursor-pointer"
                  >
                    {addon}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Assign Employees */}
          <div className="space-y-4">
            <h3 className="text-gray-900">Assign Employees</h3>
            <div className="grid grid-cols-2 gap-3">
              {mockEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`employee-${employee.id}`}
                    checked={formData.assignedEmployees.includes(employee.id)}
                    onCheckedChange={() => toggleEmployee(employee.id)}
                  />
                  <label
                    htmlFor={`employee-${employee.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {employee.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Order Goal</Label>
              <Textarea
                id="goal"
                placeholder="Describe the main goal of this order..."
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer Notes</Label>
              <Textarea
                id="customerNotes"
                placeholder="Special notes or instructions from customer..."
                value={formData.customerNotes}
                onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessInstructions">Access Instructions</Label>
              <Textarea
                id="accessInstructions"
                placeholder="How to access the property (code, key, etc.)..."
                value={formData.accessInstructions}
                onChange={(e) => setFormData({ ...formData, accessInstructions: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-500 text-white">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#033620] hover:bg-[#022819] shadow-md text-white" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}