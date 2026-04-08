import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { IconPlus, IconFilter } from '@tabler/icons-react';
import { OrdersList } from '../orders/OrdersList';
import { DateRangePicker } from '../ui/date-range-picker';
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
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

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
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
          <div className="w-6 h-6 bg-[#033620] rounded flex items-center justify-center">
            <IconFilter className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-900">Filter Orders</span>
        </div>

        <div className="p-4 flex flex-row gap-4 flex-wrap">
          {/* Search — takes remaining space */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-600 mb-2">Search</label>
            <Input
              placeholder="Customer name or order code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shadow-sm h-10"
            />
          </div>

          {/* Status — fixed width */}
          <div className="w-44 shrink-0">
            <label className="block text-xs text-gray-600 mb-2">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="shadow-sm h-10 w-full">
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

          {/* Date Range — same fixed width as Status */}
          <div className="w-44 shrink-0">
            <label className="block text-xs text-gray-600 mb-2">Date Range</label>
            <DateRangePicker
              from={fromDate}
              to={toDate}
              onSelect={({ from, to }) => { setFromDate(from); setToDate(to); }}
              className="w-full"
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      <OrdersList
        onOrderClick={onViewOrder}
        onCreateOrder={() => onNavigate?.('create-order')}
        searchQuery={searchQuery}
        filter={statusFilter === 'all' ? undefined : statusFilter}
        fromDate={fromDate ? format(fromDate, 'yyyy-MM-dd') : ''}
        toDate={toDate ? format(toDate, 'yyyy-MM-dd') : ''}
        orders={orders}
      />
    </div>
  );
}
