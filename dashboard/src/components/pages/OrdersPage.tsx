import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { IconPlus, IconFilter, IconX, IconCalendar } from '@tabler/icons-react';
import { OrdersList } from '../orders/OrdersList';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PageType } from '../Dashboard';

interface OrdersPageProps {
  user: any;
  onViewOrder?: (orderId: string) => void;
  onNavigate?: (page: PageType) => void;
  orders?: any[];
}

export function OrdersPage({ user, onViewOrder, onNavigate, orders }: OrdersPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Date objects for Calendar component
  const [fromDateObj, setFromDateObj] = useState<Date | undefined>(undefined);
  const [toDateObj, setToDateObj] = useState<Date | undefined>(undefined);

  // Refs for date inputs
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  // Applied filters (only update when "Apply Filters" is clicked)
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('all');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const handleApplyFilters = () => {
    setAppliedSearchQuery(searchQuery);
    setAppliedStatusFilter(statusFilter);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    console.log('Filters applied:', { searchQuery, statusFilter, fromDate, toDate });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setFromDateObj(undefined);
    setToDateObj(undefined);
    setAppliedSearchQuery('');
    setAppliedStatusFilter('all');
    setAppliedFromDate('');
    setAppliedToDate('');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="mb-1 font-[Poppins] font-bold text-[24px]">Orders</h1>
          <p className="text-gray-600 text-sm">Manage all your cleaning orders</p>
        </div>
        <Button onClick={() => onNavigate?.('create-order')} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white w-full sm:w-auto">
          <IconPlus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        {/* Filter Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
            <IconFilter className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-900">Filter Orders</span>
        </div>

        {/* Filter Fields */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <label className="block text-xs text-gray-600 mb-2">Search</label>
            <Input
              placeholder="Customer name or order code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shadow-sm h-10"
            />
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-600 mb-2">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="shadow-sm h-10 !h-10">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range - From and To Date together */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
            {/* From Date */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3"
                  >
                    <IconCalendar className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                    <span className="truncate">
                      {fromDateObj ? format(fromDateObj, 'MMM dd, yyyy') : <span className="text-gray-500">Pick a date</span>}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={fromDateObj}
                    onSelect={(date) => {
                      setFromDateObj(date);
                      if (date) {
                        setFromDate(format(date, 'yyyy-MM-dd'));
                      } else {
                        setFromDate('');
                      }
                    }}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-10 justify-start text-left font-normal shadow-sm hover:bg-gray-50 px-3"
                  >
                    <IconCalendar className="mr-2 h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                    <span className="truncate">
                      {toDateObj ? format(toDateObj, 'MMM dd, yyyy') : <span className="text-gray-500">Pick a date</span>}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={toDateObj}
                    onSelect={(date) => {
                      setToDateObj(date);
                      if (date) {
                        setToDate(format(date, 'yyyy-MM-dd'));
                      } else {
                        setToDate('');
                      }
                    }}
                    initialFocus
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Buttons */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-transparent mb-2 select-none">-</label>
              <Button
                onClick={handleApplyFilters}
                className="w-full bg-[#033620] hover:bg-[#022819] text-white shadow-sm h-10"
              >
                <IconFilter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
            <div>
              <label className="block text-xs text-transparent mb-2 select-none">-</label>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 shadow-sm h-10"
              >
                <IconX className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <OrdersList
        onOrderClick={onViewOrder}
        onCreateOrder={() => onNavigate?.('create-order')}
        searchQuery={appliedSearchQuery}
        filter={appliedStatusFilter === 'all' ? undefined : appliedStatusFilter}
        fromDate={appliedFromDate}
        toDate={appliedToDate}
        orders={orders}
      />
    </div>
  );
}