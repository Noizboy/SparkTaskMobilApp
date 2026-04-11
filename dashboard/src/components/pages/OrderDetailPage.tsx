import { Order, getOrderProgress, getOrderTaskCounts } from '../../data/mockOrders';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import * as api from '../../services/api';
import { getServiceTypes } from '../../data/mockServiceTypes';
import { getAreas, getAreaByName } from '../../data/mockAreas';
import { getAddons } from '../../data/mockAddons';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Calendar } from '../ui/calendar';
import { TimePicker } from '../ui/time-picker';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import {
  IconUser,
  IconMapPin,
  IconPhone,
  IconMail,
  IconCalendar,
  IconClock,
  IconTrash,
  IconCheck,
  IconX,
  IconPencil,
  IconUsers,
  IconKey,
  IconChevronDown,
  IconChevronUp,
  IconSelector,
  IconAlertTriangle,
  IconCamera
} from '@tabler/icons-react';

interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  onUpdateOrder?: (updatedOrder: Order) => Promise<void> | void;
  onDeleteOrder?: (orderId: string) => void;
  teamMembers?: TeamMember[];
}

export function OrderDetailPage({ order, onBack, onUpdateOrder, onDeleteOrder, teamMembers = [] }: OrderDetailPageProps) {
  // Local state for the current order data
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  
  // Sync with prop changes - use deep comparison of order properties
  useEffect(() => {
    setCurrentOrder(order);
    // Also update all edited states when order changes
    setEditedCustomer({ name: order.clientName, address: order.address, phone: order.phone, email: order.clientEmail });
    setEditedScheduledDate(order.date);
    setEditedScheduledTime(order.time);
    try { setScheduledDateObj(new Date(order.date + 'T00:00:00')); } catch { /* ignore */ }
    setEditedStatus(order.status);
    setEditedServiceType(order.serviceType);
    setEditedAreas(order.sections.map(s => s.name));
    setEditedAddons(order.addOns.map(a => a.name));
    setEditedAccessInstructions(order.accessInfo || '');
    setEditedNotes(order.specialInstructions || '');
    setEditedEmployees(order.assignedEmployees);
  }, [order]);
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { label: 'Scheduled', className: 'bg-black text-white' },
      'in-progress': { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800' },
      'canceled': { label: 'Canceled', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={`${config.className} text-xs px-3 py-1`}>{config.label}</Badge>;
  };

  const { completed: completedTasks, total: totalTasks } = getOrderTaskCounts(currentOrder);

  const orderProgress = getOrderProgress(currentOrder);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusChangeWarningOpen, setIsStatusChangeWarningOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<Order['status'] | null>(null);
  
  // Check if order is in progress (locked state)
  const isInProgress = currentOrder.status === 'in-progress';
  const isCompleted = currentOrder.status === 'completed';
  
  // Check if order can be edited (only scheduled orders)
  const canEdit = currentOrder.status === 'scheduled';
  
  // Check if order can be deleted (scheduled or canceled orders)
  const canDelete = currentOrder.status === 'scheduled' || currentOrder.status === 'canceled';
  
  // Editing states
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isEditingAccessInstructions, setIsEditingAccessInstructions] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(true);
  const [isTaskChecklistOpen, setIsTaskChecklistOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);
  
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Popover states for dropdowns
  const [openServiceType, setOpenServiceType] = useState(false);
  const [openAreas, setOpenAreas] = useState(false);
  const [openAddons, setOpenAddons] = useState(false);
  const [openMembers, setOpenMembers] = useState(false);
  const [openDate, setOpenDate] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  
  // Form data for editing
  const [editedCustomer, setEditedCustomer] = useState({ name: currentOrder.clientName, address: currentOrder.address, phone: currentOrder.phone, email: currentOrder.clientEmail });
  const [editedScheduledDate, setEditedScheduledDate] = useState(currentOrder.date);
  const [editedScheduledTime, setEditedScheduledTime] = useState(currentOrder.time);
  const [scheduledDateObj, setScheduledDateObj] = useState<Date | undefined>(undefined);
  const [editedStatus, setEditedStatus] = useState<Order['status']>(currentOrder.status);
  const [editedServiceType, setEditedServiceType] = useState(currentOrder.serviceType);
  const [editedAreas, setEditedAreas] = useState<string[]>(currentOrder.sections.map(s => s.name));
  const [editedAddons, setEditedAddons] = useState<string[]>(currentOrder.addOns.map(a => a.name));
  const [editedAccessInstructions, setEditedAccessInstructions] = useState(currentOrder.accessInfo || '');
  const [editedNotes, setEditedNotes] = useState(currentOrder.specialInstructions || '');
  const [editedEmployees, setEditedEmployees] = useState<string[]>(currentOrder.assignedEmployees);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  const handleDeleteOrder = () => {
    if (onDeleteOrder) {
      onDeleteOrder(currentOrder.id);
    }
    setIsDeleteDialogOpen(false);
    onBack();
  };

  const handleSaveSchedule = () => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...currentOrder, date: editedScheduledDate, time: editedScheduledTime });
    }
    setIsEditingSchedule(false);
  };

  const handleSaveStatus = () => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...currentOrder, status: editedStatus });
    }
  };

  const handleSaveAccessInstructions = () => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...currentOrder, accessInfo: editedAccessInstructions });
    }
    setIsEditingAccessInstructions(false);
  };

  const handleSaveNotes = () => {
    if (onUpdateOrder) {
      onUpdateOrder({ ...currentOrder, specialInstructions: editedNotes });
    }
    setIsEditingNotes(false);
  };

  const handleAddEmployee = () => {
    if (newEmployeeName.trim() && !editedEmployees.includes(newEmployeeName.trim())) {
      setEditedEmployees([...editedEmployees, newEmployeeName.trim()]);
      setNewEmployeeName('');
    }
  };

  const handleRemoveEmployee = (employee: string) => {
    setEditedEmployees(editedEmployees.filter(e => e !== employee));
  };

  const handleSaveEmployees = async () => {
    if (onUpdateOrder) {
      try {
        await onUpdateOrder({ ...currentOrder, assignedEmployees: editedEmployees });
      } catch (err: any) {
        setConflictError(err.message || 'Failed to update assigned members.');
      }
    }
  };

  // ── Photo evidence computed values ───────────────────────────────────────
  // Completed orders: show all sections (empty ones get a placeholder).
  // In-progress orders: only show sections that already have at least one photo.
  const photoSections = isCompleted
    ? currentOrder.sections
    : currentOrder.sections.filter(
        (s) => s.beforePhotos.length > 0 || s.afterPhotos.length > 0
      );
  const totalPhotos = currentOrder.sections.reduce(
    (sum, s) => sum + s.beforePhotos.length + s.afterPhotos.length,
    0
  );
  const showPhotosSection =
    (isInProgress && photoSections.length > 0) ||
    (isCompleted && currentOrder.sections.length > 0);

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1>Order #{currentOrder.orderNumber.replace(/^#/, '')}</h1>
            {getStatusBadge(currentOrder.status)}
          </div>
        </div>

        {/* Progress Bar (if in progress) */}
        {currentOrder.status === 'in-progress' && (
          <Collapsible open={isTaskChecklistOpen} onOpenChange={setIsTaskChecklistOpen}>
            <Card className="mb-6 shadow-md">
              <CollapsibleTrigger asChild>
                <CardContent 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-gray-900 mb-1 font-extrabold">Order Progress</h3>
                      <p className="text-sm text-gray-500">{completedTasks} of {totalTasks} tasks completed</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="text-[#033620] font-[Poppins] text-[32px] leading-none font-bold">{orderProgress}%</div>
                      {isTaskChecklistOpen ? (
                        <IconChevronUp className="w-6 h-6 text-[#033620]" />
                      ) : (
                        <IconChevronDown className="w-6 h-6 text-[#033620]" />
                      )}
                    </div>
                  </div>
                  <Progress value={orderProgress} className="h-3" />
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="px-6 pb-6 pt-2">
                  <p className="text-base text-gray-600 mb-3">Task Checklist by Area</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 max-h-[600px] md:max-h-none overflow-y-auto">
                    {currentOrder.sections.map((section) => (
                      <div key={section.id} className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="text-gray-900 font-medium flex items-center gap-2">
                          {section.name}
                          <Badge variant="outline" className="ml-auto text-xs">
                            {section.todos.filter(t => t.completed).length}/{section.todos.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {section.todos.map((todo) => (
                            <div key={todo.id} className="flex items-center gap-3 p-2 rounded-lg">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                todo.completed
                                  ? 'bg-[#033620] border-[#033620]'
                                  : 'bg-white border-gray-300'
                              }`}>
                                {todo.completed && (
                                  <IconCheck className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm flex-1 ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {todo.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {currentOrder.addOns && currentOrder.addOns.length > 0 && (
                      <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="text-gray-900 font-medium flex items-center gap-2">
                          Add-ons
                          <Badge variant="outline" className="ml-auto text-xs">
                            {currentOrder.addOns.filter(a => a.selected).length}/{currentOrder.addOns.length}
                          </Badge>
                        </h4>
                        <div className="space-y-2">
                          {currentOrder.addOns.map((addon) => (
                            <div key={addon.id} className="flex items-center gap-3 p-2 rounded-lg">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                addon.selected
                                  ? 'bg-[#033620] border-[#033620]'
                                  : 'bg-white border-gray-300'
                              }`}>
                                {addon.selected && (
                                  <IconCheck className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className={`text-sm flex-1 ${addon.selected ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {addon.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* ── Before / After Photo Evidence ──────────────────────────────── */}
        {showPhotosSection && (
          <Card className="mb-6 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-bold">
                  <IconCamera className="w-5 h-5 text-[#033620]" />
                  Photo Evidence
                  {totalPhotos > 0 && (
                    <Badge
                      variant="outline"
                      className="ml-1 text-xs bg-[#033620]/5 text-[#033620]"
                    >
                      {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-6">
              {photoSections.map((section) => (
                <div key={section.id} className="space-y-3">
                  {/* Section header */}
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h4 className="font-medium text-gray-900">{section.name}</h4>
                    {section.completed && (
                      <Badge className="bg-green-100 text-green-800 text-xs border-0">
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Before / After two-column layout */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* ── Before ── */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                        Before
                      </p>
                      {section.beforePhotos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {section.beforePhotos.map((url, i) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() =>
                                setLightbox({
                                  url,
                                  label: `Before — ${section.name}`,
                                })
                              }
                              className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#033620] hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-[#033620] focus:ring-offset-1 transition-all"
                              aria-label={`View before photo ${i + 1} of ${section.name}`}
                            >
                              <ImageWithFallback
                                src={url}
                                alt={`Before ${i + 1} — ${section.name}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      ) : isCompleted ? (
                        <p className="text-sm text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          No photos
                        </p>
                      ) : null}
                    </div>

                    {/* ── After ── */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        After
                      </p>
                      {section.afterPhotos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {section.afterPhotos.map((url, i) => (
                            <button
                              key={url}
                              type="button"
                              onClick={() =>
                                setLightbox({
                                  url,
                                  label: `After — ${section.name}`,
                                })
                              }
                              className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-[#033620] hover:ring-offset-1 focus:outline-none focus:ring-2 focus:ring-[#033620] focus:ring-offset-1 transition-all"
                              aria-label={`View after photo ${i + 1} of ${section.name}`}
                            >
                              <ImageWithFallback
                                src={url}
                                alt={`After ${i + 1} — ${section.name}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </button>
                          ))}
                        </div>
                      ) : isCompleted ? (
                        <p className="text-sm text-gray-400 italic py-3 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          No photos
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Customer & Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-bold">
                    <IconUser className="w-5 h-5 text-[#033620]" />
                    Order Details
                  </CardTitle>
                  {!isEditingCustomer && canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedCustomer({ name: currentOrder.clientName, address: currentOrder.address, phone: currentOrder.phone, email: currentOrder.clientEmail });
                        setEditedServiceType(currentOrder.serviceType);
                        setEditedAreas(currentOrder.sections.map(s => s.name));
                        setEditedAddons(currentOrder.addOns.map(a => a.name));
                        setIsEditingCustomer(true);
                      }}
                      className="text-[#033620] hover:bg-[#033620]/5"
                    >
                      <IconPencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEditingCustomer ? (
                  <>
                    {/* Customer Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Customer Details</h4>
                      <div>
                        <label className="text-sm text-gray-500 mb-1 block">Name</label>
                        <Input
                          value={editedCustomer.name}
                          onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                          className="shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 mb-1 flex items-center gap-2 block">
                          <IconMapPin className="w-4 h-4" />
                          Address
                        </label>
                        <Input
                          value={editedCustomer.address}
                          onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                          className="shadow-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-500 mb-1 flex items-center gap-2 block">
                            <IconPhone className="w-4 h-4" />
                            Phone
                          </label>
                          <Input
                            value={editedCustomer.phone}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                            className="shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 mb-1 flex items-center gap-2 block">
                            <IconMail className="w-4 h-4" />
                            Email
                          </label>
                          <Input
                            value={editedCustomer.email}
                            onChange={(e) => setEditedCustomer({ ...editedCustomer, email: e.target.value })}
                            className="shadow-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <Collapsible open={isServiceDetailsOpen} onOpenChange={setIsServiceDetailsOpen} className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Service Details</h4>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                            {isServiceDetailsOpen ? (
                              <IconChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <IconChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent className="space-y-4">
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">Service Type</label>
                          <Select
                            value={editedServiceType}
                            onValueChange={(value) => setEditedServiceType(value)}
                          >
                            <SelectTrigger className="w-full shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getServiceTypes().map((serviceType) => (
                                <SelectItem key={serviceType.id} value={serviceType.name}>
                                  {serviceType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Areas - Dropdown with Badges */}
                        <div className="space-y-3">
                          <label className="text-sm text-gray-500 block">Areas</label>
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
                                    {getAreas().map((area) => (
                                      <CommandItem
                                        key={area.id}
                                        value={area.name}
                                        onSelect={(currentValue) => {
                                          setEditedAreas([...editedAreas, currentValue]);
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
                          {editedAreas.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(editedAreas)).map((uniqueArea) => {
                                const count = editedAreas.filter(a => a === uniqueArea).length;
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
                                        const indexToRemove = editedAreas.findIndex(a => a === uniqueArea);
                                        if (indexToRemove !== -1) {
                                          setEditedAreas(editedAreas.filter((_, i) => i !== indexToRemove));
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
                        </div>

                        {/* Add-ons - Dropdown with Badges */}
                        <div className="space-y-3">
                          <label className="text-sm text-gray-500 block">Add-ons</label>
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
                                    {getAddons().map((addon) => (
                                      <CommandItem
                                        key={addon.id}
                                        value={addon.name}
                                        onSelect={(currentValue) => {
                                          setEditedAddons([...editedAddons, currentValue]);
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
                          {editedAddons.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {Array.from(new Set(editedAddons)).map((uniqueAddon) => {
                                const count = editedAddons.filter(a => a === uniqueAddon).length;
                                return (
                                  <div
                                    key={uniqueAddon}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#033620] text-white rounded-md shadow-sm"
                                  >
                                    <span className="text-sm">{uniqueAddon}</span>
                                    {count > 1 && (
                                      <span className="text-xs font-[Poppins] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                                        x{count}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Remove one instance of this add-on
                                        const indexToRemove = editedAddons.findIndex(a => a === uniqueAddon);
                                        if (indexToRemove !== -1) {
                                          setEditedAddons(editedAddons.filter((_, i) => i !== indexToRemove));
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
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        onClick={() => {
                          if (onUpdateOrder) {
                            // Sync sections with editedAreas
                            const updatedSections = editedAreas.map(areaName => {
                              // Check if this area already exists in current sections
                              const existingSection = currentOrder.sections.find(s => s.name === areaName);

                              if (existingSection) {
                                return existingSection;
                              } else {
                                const areaData = getAreaByName(areaName);
                                if (areaData) {
                                  return {
                                    id: areaName.toLowerCase().replace(/\s+/g, '-'),
                                    name: areaName,
                                    icon: 'Sparkles',
                                    completed: false,
                                    beforePhotos: [] as string[],
                                    afterPhotos: [] as string[],
                                    todos: areaData.checklist.map((checklistItem: string, index: number) => ({
                                      id: `${areaName}-${index}`,
                                      text: checklistItem,
                                      completed: false
                                    }))
                                  };
                                } else {
                                  return {
                                    id: areaName.toLowerCase().replace(/\s+/g, '-'),
                                    name: areaName,
                                    icon: 'Sparkles',
                                    completed: false,
                                    beforePhotos: [] as string[],
                                    afterPhotos: [] as string[],
                                    todos: []
                                  };
                                }
                              }
                            });

                            // Convert editedAddons strings to AddOn objects
                            const updatedAddOns = editedAddons.map((name, i) => {
                              const existing = currentOrder.addOns.find(a => a.name === name);
                              return existing || { id: `addon-${i}`, name, icon: 'Sparkles', selected: true };
                            });

                            onUpdateOrder({
                              ...currentOrder,
                              clientName: editedCustomer.name,
                              clientEmail: editedCustomer.email,
                              address: editedCustomer.address,
                              phone: editedCustomer.phone,
                              serviceType: editedServiceType,
                              addOns: updatedAddOns,
                              sections: updatedSections
                            });
                          }
                          setIsEditingCustomer(false);
                        }}
                        className="bg-[#033620] hover:bg-[#022819] shadow-sm text-white"
                        size="sm"
                      >
                        <IconCheck className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditingCustomer(false)}
                        variant="outline"
                        size="sm"
                        className="shadow-sm"
                      >
                        <IconX className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Customer Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Customer Details</h4>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <p className="text-gray-900">{currentOrder.clientName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                          <IconMapPin className="w-4 h-4" />
                          Address
                        </p>
                        <p className="text-gray-900">{currentOrder.address}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                            <IconPhone className="w-4 h-4" />
                            Phone
                          </p>
                          <p className="text-gray-900">{currentOrder.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                            <IconMail className="w-4 h-4" />
                            Email
                          </p>
                          <p className="text-gray-900">{currentOrder.clientEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div className="space-y-3 pt-4">
                      <h4 className="font-medium text-gray-900 border-b pb-2">Service Details</h4>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Service Type</p>
                        <p className="text-gray-900">{currentOrder.serviceType}</p>
                      </div>
                      {currentOrder.sections.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Areas</p>
                          <div className="flex flex-wrap gap-2">
                            {currentOrder.sections.map((section) => (
                              <Badge key={section.id} variant="outline" className="bg-[#033620]/5 text-[#033620]">
                                {section.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Add-ons</p>
                        <div className="flex flex-wrap gap-2">
                          {currentOrder.addOns.map((addon) => (
                            <Badge key={addon.id} variant="outline" className="bg-[#033620]/5 text-[#033620]">
                              {addon.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {currentOrder.specialInstructions && (
              <Card className="shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Customer Notes</CardTitle>
                    {!isEditingNotes && canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedNotes(currentOrder.specialInstructions || '');
                          setIsEditingNotes(true);
                        }}
                        className="text-[#033620] hover:bg-[#033620]/5"
                      >
                        <IconPencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditingNotes ? (
                    <>
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="shadow-sm"
                        placeholder="Additional notes about the order..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveNotes}
                          className="bg-[#033620] hover:bg-[#022819] shadow-sm text-white"
                          size="sm"
                        >
                          <IconCheck className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => setIsEditingNotes(false)}
                          variant="outline"
                          size="sm"
                          className="shadow-sm"
                        >
                          <IconX className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-700">{currentOrder.specialInstructions}</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Schedule & Actions */}
          <div className="space-y-6">
            {/* Publish */}
            <Card className="shadow-md border-[#033620]/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCalendar className="w-5 h-5 text-[#033620]" />
                  Schedule & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Schedule Section */}
                <div className="space-y-3">
                  {isEditingSchedule ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-500 mb-1 block">Date</label>
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
                                  setEditedScheduledDate(format(date, 'yyyy-MM-dd'));
                                }
                              }}
                              initialFocus
                              className="rounded-md border"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-500 mb-1 flex items-center gap-2 block">
                          <IconClock className="w-4 h-4" />
                          Time
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3"
                            >
                              <IconClock className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                              <span className="truncate">
                                {editedScheduledTime || <span className="text-gray-500">Pick a time</span>}
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                            <TimePicker
                              value={(() => {
                                try {
                                  const parsed = parse(editedScheduledTime, 'h:mm a', new Date());
                                  const hours = parsed.getHours();
                                  const minutes = parsed.getMinutes();
                                  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                } catch {
                                  return '09:00';
                                }
                              })()}
                              onChange={(time) => {
                                const [hours, minutes] = time.split(':').map(Number);
                                const hour24 = hours;
                                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                const period = hour24 >= 12 ? 'PM' : 'AM';
                                setEditedScheduledTime(`${hour12}:${minutes.toString().padStart(2, '0')} ${period}`);
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveSchedule}
                          className="bg-[#033620] hover:bg-[#022819] shadow-sm text-white"
                          size="sm"
                        >
                          <IconCheck className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => setIsEditingSchedule(false)}
                          variant="outline"
                          size="sm"
                          className="shadow-sm"
                        >
                          <IconX className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                            <IconCalendar className="w-4 h-4" />
                            Date
                          </p>
                          <p className="text-gray-900">{new Date(currentOrder.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditedScheduledDate(currentOrder.date);
                              setEditedScheduledTime(currentOrder.time);
                              setIsEditingSchedule(true);
                            }}
                            className="text-[#033620] hover:bg-[#033620]/5"
                          >
                            <IconPencil className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                          <IconClock className="w-4 h-4" />
                          Time
                        </p>
                        <p className="text-gray-900">{currentOrder.time}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Status & Delete Actions */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Status Dropdown - Direct */}
                  <div>
                    <label className="text-sm text-gray-500 mb-2 block">Status</label>
                    <Select 
                      value={editedStatus} 
                      onValueChange={(value) => {
                        const newStatus = value as Order['status'];
                        
                        // If order is in progress and trying to change status, show warning
                        if (currentOrder.status === 'in-progress' && newStatus !== 'in-progress') {
                          setPendingStatusChange(newStatus);
                          setIsStatusChangeWarningOpen(true);
                        } else {
                          api.updateOrderStatus(currentOrder.id, newStatus).then((updated) => {
                            setCurrentOrder(updated);
                            setEditedStatus(updated.status);
                            onUpdateOrder?.(updated);
                          }).catch((err) => {
                            toast.error(err.message || 'Failed to update status');
                            setEditedStatus(currentOrder.status);
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-end">
                    <Button
                      onClick={() => setIsDeleteDialogOpen(true)}
                      variant="outline"
                      disabled={!canDelete}
                      className={`w-full shadow-sm ${
                        !canDelete 
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed' 
                          : 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <IconTrash className="w-4 h-4 mr-2" />
                      Delete Order
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Team */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUsers className="w-5 h-5 text-[#033620]" />
                  Assigned Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Search Members - Dropdown Popover */}
                  {canEdit && (
                    <Popover open={openMembers} onOpenChange={setOpenMembers}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openMembers}
                          className="w-full h-10 justify-between shadow-sm hover:bg-gray-50"
                        >
                          <span className="text-gray-500">Search team members...</span>
                          <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg" align="start">
                        <Command>
                          <CommandInput placeholder="Search members..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No member found.</CommandEmpty>
                            <CommandGroup>
                              {teamMembers
                                .filter(member => !editedEmployees.includes(member.name))
                                .map((member) => (
                                  <CommandItem
                                    key={member.id}
                                    value={member.name}
                                    onSelect={async (currentValue) => {
                                      const newEmployees = [...editedEmployees, currentValue];
                                      setEditedEmployees(newEmployees);
                                      setOpenMembers(false);
                                      if (onUpdateOrder) {
                                        try {
                                          await onUpdateOrder({ ...currentOrder, assignedEmployees: newEmployees });
                                        } catch (err: any) {
                                          // Revert optimistic update
                                          setEditedEmployees(editedEmployees);
                                          setConflictError(err.message || 'Failed to assign member.');
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 bg-[#033620] rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">
                                          {member.name.split(' ').map(n => n[0]).join('')}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-sm">{member.name}</span>
                                        <span className="text-xs text-gray-500">{member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : ''}</span>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}

                  {/* Assigned Members List */}
                  <div className="space-y-2 max-h-[210px] overflow-y-auto">
                    {editedEmployees.map((employee, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-[#033620] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {employee.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-900">{employee}</span>
                        {canEdit && (
                          <Button
                            onClick={async () => {
                              const newEmployees = editedEmployees.filter(e => e !== employee);
                              setEditedEmployees(newEmployees);
                              if (onUpdateOrder) {
                                try {
                                  await onUpdateOrder({ ...currentOrder, assignedEmployees: newEmployees });
                                } catch (err: any) {
                                  setEditedEmployees(editedEmployees);
                                  setConflictError(err.message || 'Failed to remove member.');
                                }
                              }
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 ml-auto"
                          >
                            <IconX className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Instructions */}
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconKey className="w-5 h-5 text-[#033620]" />
                    Access Instructions
                  </CardTitle>
                  {!isEditingAccessInstructions && canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedAccessInstructions(currentOrder.accessInfo || '');
                        setIsEditingAccessInstructions(true);
                      }}
                      className="text-[#033620] hover:bg-[#033620]/5"
                    >
                      <IconPencil className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditingAccessInstructions ? (
                  <>
                    <Textarea
                      value={editedAccessInstructions}
                      onChange={(e) => setEditedAccessInstructions(e.target.value)}
                      className="shadow-sm"
                      placeholder="How to access the property (code, key, etc.)..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveAccessInstructions}
                        className="bg-[#033620] hover:bg-[#022819] shadow-sm text-white"
                        size="sm"
                      >
                        <IconCheck className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditingAccessInstructions(false)}
                        variant="outline"
                        size="sm"
                        className="shadow-sm"
                      >
                        <IconX className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-700">{currentOrder.accessInfo || 'No instructions provided'}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>

      {/* Delete Order Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Warning Dialog */}
      <AlertDialog open={isStatusChangeWarningOpen} onOpenChange={setIsStatusChangeWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Order Status</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{pendingStatusChange === 'scheduled' ? 'Reverting this order to Scheduled will erase all current progress.' : 'Changing the status of an in-progress order may cause sync issues with the mobile app.'} Are you sure you want to continue?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={pendingStatusChange === 'scheduled' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={async () => {
                if (pendingStatusChange) {
                  try {
                    // Use PATCH /status so the API can reset progress when reverting to scheduled
                    const updated = await api.updateOrderStatus(currentOrder.id, pendingStatusChange);
                    setCurrentOrder(updated);
                    setEditedStatus(updated.status);
                    onUpdateOrder?.(updated);
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to update status');
                    setEditedStatus(currentOrder.status);
                  }
                }
                setPendingStatusChange(null);
                setIsStatusChangeWarningOpen(false);
              }}
            >
              {pendingStatusChange === 'scheduled' ? 'Reset & Reschedule' : 'Change Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule / assignment conflict modal */}
      <Dialog open={!!conflictError} onOpenChange={() => setConflictError(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <IconAlertTriangle className="w-5 h-5" />
              Assignment Conflict
            </DialogTitle>
            <DialogDescription className="text-gray-700 pt-2">
              {conflictError}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="bg-[#033620] hover:bg-[#022819] text-white" onClick={() => setConflictError(null)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Photo lightbox ────────────────────────────────────────────────── */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl w-[95vw] p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-gray-600">
              {lightbox?.label}
            </DialogTitle>
          </DialogHeader>
          {lightbox && (
            <ImageWithFallback
              src={lightbox.url}
              alt={lightbox.label}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}