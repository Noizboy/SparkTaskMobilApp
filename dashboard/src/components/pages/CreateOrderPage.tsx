import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { TimePicker } from '../ui/time-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { IconArrowLeft, IconCheck, IconCalendar, IconClock, IconX, IconSelector } from '@tabler/icons-react';
import { format } from 'date-fns';
import { getServiceTypes } from '../../data/mockServiceTypes';
import { getAreas } from '../../data/mockAreas';
import { getAddons } from '../../data/mockAddons';

interface CreateOrderPageProps {
  onBack: () => void;
  onOrderCreated?: () => void;
}

const mockEmployees = [
  { id: '1', name: 'John Perez' },
  { id: '2', name: 'Anna Lopez' },
  { id: '3', name: 'Peter Sanchez' },
  { id: '4', name: 'Maria Torres' },
];

export function CreateOrderPage({ onBack, onOrderCreated }: CreateOrderPageProps) {
  const serviceTypes = getServiceTypes();
  const areas = getAreas();
  const addons = getAddons();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    scheduledDate: '',
    scheduledTime: '',
    serviceType: '',
    areas: [] as string[],
    addons: [] as string[],
    assignedEmployees: [] as string[],
    goal: '',
    customerNotes: '',
    accessInstructions: '',
  });

  // Date object for Calendar component
  const [scheduledDateObj, setScheduledDateObj] = useState<Date | undefined>(undefined);
  
  // Popover states for searchable dropdowns
  const [openServiceType, setOpenServiceType] = useState(false);
  const [openAreas, setOpenAreas] = useState(false);
  const [openAddons, setOpenAddons] = useState(false);
  const [openEmployees, setOpenEmployees] = useState(false);

  const handleTimeChange = (time: string) => {
    setFormData({ ...formData, scheduledTime: time });
  };

  const getTimeDisplay = () => {
    if (formData.scheduledTime) {
      const [hours, minutes] = formData.scheduledTime.split(':');
      const hour24 = parseInt(hours);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      const period = hour24 >= 12 ? 'PM' : 'AM';
      return `${hour12.toString().padStart(2, '0')}:${minutes} ${period}`;
    }
    return 'Pick a time';
  };

  const totalEstimatedMinutes = formData.areas.reduce((sum, areaName) => sum + (areas.find(a => a.name === areaName)?.estimatedDuration ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.serviceType) {
      alert('Please select a Service Type');
      return;
    }

    if (formData.areas.length === 0) {
      alert('Please select at least one Area to Clean');
      return;
    }

    if (!formData.scheduledDate) {
      alert('Please select a Date');
      return;
    }

    if (!formData.scheduledTime) {
      alert('Please select a Time');
      return;
    }

    // Build sections from selected areas (with estimatedTime in minutes)
    const sections = formData.areas.map(areaName => {
      const area = areas.find(a => a.name === areaName);
      return {
        name: areaName,
        icon: 'Sparkles',
        estimatedTime: area?.estimatedDuration ?? 0,
        todos: (area?.checklist ?? []).map(text => ({ text })),
      };
    });

    // Build add-ons
    const addOns = formData.addons.map(addonName => ({
      name: addonName,
      icon: 'Sparkles',
      selected: true,
    }));

    const payload = {
      clientName: formData.customerName,
      address: formData.customerAddress,
      phone: formData.customerPhone,
      date: formData.scheduledDate,
      time: formData.scheduledTime,
      serviceType: formData.serviceType,
      specialInstructions: formData.customerNotes,
      accessInfo: formData.accessInstructions,
      goal: formData.goal,
      assignedEmployees: formData.assignedEmployees.map(id => {
        const emp = mockEmployees.find(e => e.id === id);
        return emp?.name ?? id;
      }),
      sections,
      addOns,
    };

    try {
      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error('[CreateOrder] Failed:', err);
      alert('Failed to create order. Check console for details.');
      return;
    }

    // Reset form
    setFormData({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      scheduledDate: '',
      scheduledTime: '',
      serviceType: '',
      areas: [],
      addons: [],
      assignedEmployees: [],
      goal: '',
      customerNotes: '',
      accessInstructions: '',
    });
    setScheduledDateObj(undefined);

    // Navigate back to orders
    onOrderCreated?.();
    onBack();
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
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 text-[#033620] hover:text-[#044d2e] hover:bg-[#033620]/5"
        >
          <IconArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        
        <div>
          <h1 className="mb-1 font-[Poppins] font-bold text-[24px]">New Order</h1>
          <p className="text-gray-600 text-sm">Create a new cleaning service order</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Customer Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">1</span>
              </div>
              <h3 className="text-gray-900 font-medium">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  className="shadow-sm h-10"
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  className="shadow-sm h-10"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerAddress"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                required
                className="shadow-sm h-10"
                placeholder="Enter service address"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">2</span>
              </div>
              <h3 className="text-gray-900 font-medium">Schedule Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3"
                    >
                      <IconCalendar className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                      <span className="truncate">
                        {scheduledDateObj ? format(scheduledDateObj, 'MMM dd, yyyy') : <span className="text-gray-500">Pick a date</span>}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDateObj}
                      onSelect={(date) => {
                        setScheduledDateObj(date);
                        if (date) {
                          setFormData({ ...formData, scheduledDate: format(date, 'yyyy-MM-dd') });
                        } else {
                          setFormData({ ...formData, scheduledDate: '' });
                        }
                      }}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3"
                    >
                      <IconClock className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                      <span className="truncate">
                        {formData.scheduledTime ? (
                          getTimeDisplay()
                        ) : (
                          <span className="text-gray-500">Pick a time</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                    <TimePicker
                      value={formData.scheduledTime}
                      onChange={handleTimeChange}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">3</span>
              </div>
              <h3 className="text-gray-900 font-medium">Service Details</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <Popover open={openServiceType} onOpenChange={setOpenServiceType}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openServiceType}
                    className="w-full h-10 justify-between shadow-sm hover:bg-gray-50"
                  >
                    <span className={formData.serviceType ? "" : "text-gray-500"}>
                      {formData.serviceType || "Select type"}
                    </span>
                    <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg" align="start">
                  <Command>
                    <CommandInput placeholder="Search service type..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No service type found.</CommandEmpty>
                      <CommandGroup>
                        {serviceTypes.map((type) => (
                          <CommandItem
                            key={type.id}
                            value={type.name}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, serviceType: currentValue });
                              setOpenServiceType(false);
                            }}
                          >
                            {type.name}
                            {formData.serviceType === type.name && (
                              <IconCheck className="ml-auto h-4 w-4 text-[#033620]" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Areas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">4</span>
              </div>
              <h3 className="text-gray-900 font-medium">Areas to Clean</h3>
            </div>
            <div className="space-y-3">
              <Label>
                Select Areas <span className="text-red-500">*</span>
              </Label>
              <Popover open={openAreas} onOpenChange={setOpenAreas}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAreas}
                    className="w-full h-10 justify-between shadow-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-500">Select areas</span>
                    <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg" align="start">
                  <Command>
                    <CommandInput placeholder="Search areas..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No area found.</CommandEmpty>
                      <CommandGroup>
                        {areas.map((area) => (
                          <CommandItem
                            key={area.id}
                            value={area.name}
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, areas: [...formData.areas, currentValue] });
                              setOpenAreas(false);
                            }}
                          >
                            {area.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(formData.areas)).map((uniqueArea) => {
                    const count = formData.areas.filter(a => a === uniqueArea).length;
                    return (
                      <div
                        key={uniqueArea}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#033620] text-white rounded-md shadow-sm"
                      >
                        <span className="text-sm">{uniqueArea}</span>
                        {count > 1 && (
                          <span className="text-xs font-[Poppins] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                            x{count}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            // Remove one instance of this area
                            const indexToRemove = formData.areas.findIndex(a => a === uniqueArea);
                            if (indexToRemove !== -1) {
                              setFormData(prev => ({
                                ...prev,
                                areas: prev.areas.filter((_, i) => i !== indexToRemove)
                              }));
                            }
                          }}
                          className="hover:bg-[#044d2e] rounded-full p-0.5 transition-colors"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {totalEstimatedMinutes > 0 && (
                <p className="text-sm text-gray-500">
                  Estimated duration: <span className="font-medium text-gray-700">{(() => { const h = Math.floor(totalEstimatedMinutes / 60); const m = totalEstimatedMinutes % 60; return h > 0 && m > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'} ${m} min` : h > 0 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${m} min`; })()}</span>
                </p>
              )}
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">5</span>
              </div>
              <h3 className="text-gray-900 font-medium">Add-ons</h3>
            </div>
            <div className="space-y-3">
              <Popover open={openAddons} onOpenChange={setOpenAddons}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAddons}
                    className="w-full h-10 justify-between shadow-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-500">Select add-ons</span>
                    <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg" align="start">
                  <Command>
                    <CommandInput placeholder="Search add-ons..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No add-on found.</CommandEmpty>
                      <CommandGroup>
                        {addons.filter(addon => !formData.addons.includes(addon.name)).map((addon) => (
                          <CommandItem
                            key={addon.id}
                            value={addon.name}
                            onSelect={(currentValue) => {
                              if (!formData.addons.includes(currentValue)) {
                                setFormData({ ...formData, addons: [...formData.addons, currentValue] });
                              }
                              setOpenAddons(false);
                            }}
                          >
                            {addon.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.addons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.addons.map((addon) => (
                    <div
                      key={addon}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#033620] text-white rounded-md shadow-sm"
                    >
                      <span className="text-sm">{addon}</span>
                      <button
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className="hover:bg-[#044d2e] rounded-full p-0.5 transition-colors"
                      >
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assign Employees */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">6</span>
              </div>
              <h3 className="text-gray-900 font-medium">Assign Employees</h3>
            </div>
            <div className="space-y-3">
              <Popover open={openEmployees} onOpenChange={setOpenEmployees}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openEmployees}
                    className="w-full h-10 justify-between shadow-sm hover:bg-gray-50"
                  >
                    <span className="text-gray-500">Select employees</span>
                    <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg" align="start">
                  <Command>
                    <CommandInput placeholder="Search employees..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No employee found.</CommandEmpty>
                      <CommandGroup>
                        {mockEmployees.filter(employee => !formData.assignedEmployees.includes(employee.id)).map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.name}
                            onSelect={() => {
                              if (!formData.assignedEmployees.includes(employee.id)) {
                                setFormData({ ...formData, assignedEmployees: [...formData.assignedEmployees, employee.id] });
                              }
                              setOpenEmployees(false);
                            }}
                          >
                            {employee.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {formData.assignedEmployees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.assignedEmployees.map((employeeId) => {
                    const employee = mockEmployees.find(e => e.id === employeeId);
                    return employee ? (
                      <div
                        key={employeeId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#033620] text-white rounded-md shadow-sm"
                      >
                        <span className="text-sm">{employee.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleEmployee(employeeId)}
                          className="hover:bg-[#044d2e] rounded-full p-0.5 transition-colors"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No employees assigned yet</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
                <span className="text-white text-xs">7</span>
              </div>
              <h3 className="text-gray-900 font-medium">Additional Information</h3>
            </div>
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
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1 sm:flex-none sm:min-w-[140px] h-10"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 sm:flex-none sm:min-w-[140px] bg-[#033620] hover:bg-[#022819] shadow-md text-white h-10"
            >
              <IconCheck className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}