import { Button } from '../ui/button';
import { IconHash, IconUser, IconBriefcase, IconCalendar, IconActivity, IconSettings, IconClipboardList, IconPlus, IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react';
import { mockOrders, Order, getOrderTaskCounts } from '../../data/mockOrders';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '../ui/pagination';
import { useState, useEffect } from 'react';

export type { Order } from '../../data/mockOrders';

interface OrdersListProps {
  onOrderClick?: (orderId: string) => void;
  onCreateOrder?: () => void;
  searchQuery?: string;
  filter?: string;
  cleanerFilter?: string;
  fromDate?: string;
  toDate?: string;
  orders?: Order[]; // External orders prop
}

export function OrdersList({ onOrderClick, onCreateOrder, searchQuery = '', filter, cleanerFilter, fromDate, toDate, orders }: OrdersListProps) {
  // Use external orders if provided, otherwise use mock orders
  const sourceOrders = orders || mockOrders;
  let filteredOrders = sourceOrders;

  // Filter by status
  if (filter && filter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === filter);
  }

  // Filter by assigned cleaner
  if (cleanerFilter) {
    filteredOrders = filteredOrders.filter(order =>
      order.assignedEmployees?.some(name => name === cleanerFilter)
    );
  }

  // Filter by search query
  if (searchQuery) {
    filteredOrders = filteredOrders.filter(order =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by date range
  if (fromDate || toDate) {
    filteredOrders = filteredOrders.filter(order => {
      // Parse the order date (format: "Jan 15, 2024")
      const orderDate = new Date(order.date);
      
      if (fromDate) {
        const from = new Date(fromDate);
        if (orderDate < from) return false;
      }
      
      if (toDate) {
        const to = new Date(toDate);
        // Set to end of day for toDate
        to.setHours(23, 59, 59, 999);
        if (orderDate > to) return false;
      }
      
      return true;
    });
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'scheduled': { label: 'Scheduled', className: 'bg-black text-white' },
      'in-progress': { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800' },
      'canceled': { label: 'Canceled', className: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return config.label;
  };

  const getStatusClass = (status: string) => {
    const statusConfig = {
      'scheduled': 'bg-black text-white',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
    };

    return statusConfig[status as keyof typeof statusConfig];
  };

  const getTotalTasks = (order: typeof mockOrders[0]) => {
    return getOrderTaskCounts(order).total;
  };

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  // Apply sort
  const sortedOrders = sortOrder
    ? [...filteredOrders].sort((a, b) => {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === 'asc' ? diff : -diff;
      })
    : filteredOrders;

  const cycleSortOrder = () => {
    setSortOrder((prev) => prev === null ? 'asc' : prev === 'asc' ? 'desc' : null);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage);
  const currentOrders = sortedOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter, cleanerFilter, fromDate, toDate, sortOrder]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-start" />);
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-end" />);
      }

      // Show last page
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
        <button
          onClick={cycleSortOrder}
          className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 hover:text-gray-800 transition-colors"
        >
          <IconHash className="w-3.5 h-3.5" />
          Order
          {sortOrder === 'asc' && <IconArrowUp className="w-3.5 h-3.5 text-[#033620]" />}
          {sortOrder === 'desc' && <IconArrowDown className="w-3.5 h-3.5 text-[#033620]" />}
          {sortOrder === null && <IconArrowsSort className="w-3.5 h-3.5 opacity-40" />}
        </button>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <IconUser className="w-3.5 h-3.5" />
          Customer Name
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <IconBriefcase className="w-3.5 h-3.5" />
          Service
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <IconCalendar className="w-3.5 h-3.5" />
          Scheduled
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <IconActivity className="w-3.5 h-3.5" />
          Status
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-2">
          <IconSettings className="w-3.5 h-3.5" />
          Actions
        </div>
      </div>

      {/* Order Items */}
      {currentOrders.length > 0 ? (
        <div>
          {currentOrders.map((order, index) => (
            <div
              key={order.id}
              className={`border-gray-200 p-4 md:p-0 md:grid md:grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] md:gap-4 md:px-6 md:py-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                index !== currentOrders.length - 1 ? 'border-b' : ''
              }`}
              onClick={() => onOrderClick?.(order.id)}
            >
              {/* Mobile Layout */}
              <div className="flex flex-col gap-3 md:hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Order Code</p>
                    <p className="font-sans text-gray-900 text-base">#{order.orderNumber.replace(/^#/, '')}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusClass(order.status)}`}>
                    {getStatusBadge(order.status)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 mb-1">Client</p>
                  <p className="text-sm text-gray-900">{order.clientName}</p>
                  <p className="text-xs text-gray-500">{order.address}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 mb-1">Service</p>
                  <p className="text-sm text-gray-900">{order.serviceType}</p>
                  <p className="text-xs text-gray-500">{getTotalTasks(order)} tasks</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 mb-1">Scheduled</p>
                  <p className="text-sm text-gray-900">{new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">{order.time}</p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-[#033620] text-[#033620] hover:bg-[#033620] hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrderClick?.(order.id);
                  }}
                >
                  View Details
                </Button>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center">
                <p className="font-sans text-gray-900 text-base">#{order.orderNumber.replace(/^#/, '')}</p>
              </div>
              <div className="hidden md:flex flex-col justify-center">
                <p className="text-sm text-gray-900">{order.clientName}</p>
                <p className="text-xs text-gray-500">{order.address}</p>
              </div>
              <div className="hidden md:flex flex-col justify-center">
                <p className="text-sm text-gray-900">{order.serviceType}</p>
                <p className="text-xs text-gray-500">{getTotalTasks(order)} tasks</p>
              </div>
              <div className="hidden md:flex flex-col justify-center">
                <p className="text-sm text-gray-900">{new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                <p className="text-xs text-gray-500">{order.time}</p>
              </div>
              <div className="hidden md:flex items-center">
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${getStatusClass(order.status)}`}>
                  {getStatusBadge(order.status)}
                </span>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#033620] hover:text-[#044d2e] hover:bg-[#033620]/5 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOrderClick?.(order.id);
                  }}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-16 text-center">
          <div className="flex justify-center mb-4">
            <IconClipboardList className="w-16 h-16 text-gray-300" />
          </div>
          <h3 className="text-gray-900 mb-2">No orders found</h3>
          <p className="text-sm text-gray-500 mb-6">Try adjusting your filters or create a new order</p>
          {onCreateOrder && (
            <Button
              onClick={onCreateOrder}
              className="bg-[#033620] hover:bg-[#022819] text-white shadow-md"
            >
              <IconPlus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredOrders.length > ordersPerPage && (
        <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-200">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={currentPage > 1 ? () => handlePageChange(currentPage - 1) : undefined}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={currentPage < totalPages ? () => handlePageChange(currentPage + 1) : undefined}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}