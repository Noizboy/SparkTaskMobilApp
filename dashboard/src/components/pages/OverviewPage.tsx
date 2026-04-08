import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { IconClipboardList, IconClock, IconCircleCheck, IconUsers, IconPlus, IconArrowRight, IconShoppingBag, IconHash, IconUser, IconBriefcase, IconCalendar, IconActivity, IconSettings } from '@tabler/icons-react';
import { Button } from '../ui/button';
import { PageType } from '../Dashboard';
import { Order, getOrderTaskCounts } from '../../data/mockOrders';

const mockTeamMembers = [
  { id: '1', name: 'John Perez', email: 'john@email.com', role: 'Employee', status: 'active', ordersCompleted: 45 },
  { id: '2', name: 'Anna Lopez', email: 'anna@email.com', role: 'Employee', status: 'active', ordersCompleted: 38 },
  { id: '3', name: 'Peter Sanchez', email: 'peter@email.com', role: 'Employee', status: 'active', ordersCompleted: 52 },
  { id: '4', name: 'Maria Torres', email: 'maria@email.com', role: 'Employee', status: 'active', ordersCompleted: 31 },
  { id: '5', name: 'Carlos Ramirez', email: 'carlos@email.com', role: 'Supervisor', status: 'active', ordersCompleted: 67 },
];

const STATUS_CONFIG = {
  'scheduled':   { label: 'Scheduled',   className: 'bg-black text-white' },
  'in-progress': { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
  'completed':   { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  'canceled':    { label: 'Canceled',    className: 'bg-red-100 text-red-800' },
} as const;

export function OverviewPage({ user, onNavigate, onViewOrder, orders = [] }: { user: any; onNavigate?: (page: PageType) => void; onViewOrder?: (orderId: string) => void; orders?: Order[] }) {
  const upcomingOrders = orders.filter(order => order.status === 'scheduled').length;
  const activeCleaners = mockTeamMembers.length;
  const inProgressOrders = orders.filter(order => order.status === 'in-progress').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;

  // 5 most recent orders by date
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-[Poppins] font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-gray-600">Here's your cleaning company overview</p>
          </div>
          <Button 
            className="bg-[#033620] hover:bg-[#044d2e] text-white shadow-md w-full sm:w-auto"
            onClick={() => onNavigate?.('create-order')}
          >
            <IconPlus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Upcoming Orders Card */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <IconClipboardList className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Upcoming Orders</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{upcomingOrders}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-[#033620]">{upcomingOrders === 1 ? 'Pending to start' : 'Pending to start'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Cleaners Card */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <IconUsers className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Active Cleaners</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{activeCleaners}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-[#033620]">Available for assignments</p>
              </div>
            </CardContent>
          </Card>

          {/* In Progress Card */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <IconClock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">In Progress</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{inProgressOrders}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-[#033620]">Active today</p>
              </div>
            </CardContent>
          </Card>

          {/* Completed Orders Card */}
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <IconCircleCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Completed Orders</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{completedOrders}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-[#033620]">Successfully finished</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-[Poppins] font-normal font-bold">Recent Orders</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Latest orders from your team</p>
            </div>
            <Button variant="ghost" className="text-[#033620] hover:text-[#044d2e] hover:bg-[#033620]/5" onClick={() => onNavigate?.('orders')}>
              View all
              <IconArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] gap-4 px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200">
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                <IconHash className="w-4 h-4" />
                Order
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                <IconUser className="w-4 h-4" />
                Customer Name
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                <IconBriefcase className="w-4 h-4" />
                Service
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                <IconCalendar className="w-4 h-4" />
                Scheduled
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                <IconActivity className="w-4 h-4" />
                Status
              </div>
              <div className="text-xs text-gray-500 uppercase font-bold flex items-center justify-center gap-2">
                <IconSettings className="w-4 h-4" />
                Actions
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4 md:space-y-0">
              {recentOrders.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">No orders yet</p>
              )}
              {recentOrders.map((order, index) => {
                const totalTasks = getOrderTaskCounts(order).total;
                const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
                const dateLabel = new Date(order.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div
                    key={order.id}
                    className={`border-gray-200 p-4 md:p-0 md:grid md:grid-cols-[1fr_2fr_1.5fr_1.5fr_1fr_80px] md:gap-4 md:px-4 md:py-4 hover:bg-gray-50 transition-colors cursor-pointer ${index !== recentOrders.length - 1 ? 'border-b' : ''}`}
                    onClick={() => onViewOrder?.(order.id)}
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col gap-3 md:hidden">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Order Code</p>
                          <p className="font-[Poppins] text-gray-900">{order.orderNumber}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusCfg?.className}`}>
                          {statusCfg?.label}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-sm text-gray-500 mb-1">Customer Name</p>
                        <p className="text-gray-900">{order.clientName}</p>
                        <p className="text-xs text-gray-500">{order.address}</p>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-sm text-gray-500 mb-1">Service</p>
                        <p className="text-gray-900">{order.serviceType}</p>
                        <p className="text-xs text-gray-500">{totalTasks} tasks</p>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        <p className="text-sm text-gray-500 mb-1">Scheduled</p>
                        <p className="text-gray-900">{dateLabel}</p>
                        <p className="text-xs text-gray-500">{order.time}</p>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center">
                      <p className="font-sans text-gray-900 text-base">{order.orderNumber}</p>
                    </div>
                    <div className="hidden md:flex flex-col justify-center">
                      <p className="text-gray-900">{order.clientName}</p>
                      <p className="text-xs text-gray-500">{order.address}</p>
                    </div>
                    <div className="hidden md:flex flex-col justify-center">
                      <p className="text-gray-900">{order.serviceType}</p>
                      <p className="text-xs text-gray-500">{totalTasks} tasks</p>
                    </div>
                    <div className="hidden md:flex flex-col justify-center">
                      <p className="text-gray-900">{dateLabel}</p>
                      <p className="text-xs text-gray-500">{order.time}</p>
                    </div>
                    <div className="hidden md:flex items-center">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusCfg?.className}`}>
                        {statusCfg?.label}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#033620] hover:text-[#044d2e] hover:bg-[#033620]/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewOrder?.(order.id);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-gray-500">Powered by SparkTask</p>
          <p className="text-sm text-gray-500">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}