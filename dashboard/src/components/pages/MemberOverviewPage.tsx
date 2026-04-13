import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { fetchOrders } from '../../services/api';
import { Order } from '../../data/mockOrders';
import { TeamMember } from './TeamMembersPage';
import {
  IconArrowLeft,
  IconMail,
  IconClipboardList,
  IconCircleCheck,
  IconClock,
  IconX,
  IconLogin,
  IconLogout,
  IconCalendar,
} from '@tabler/icons-react';

interface MemberOverviewPageProps {
  member: TeamMember;
  onBack: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  scheduled:    { label: 'Scheduled',   badgeClass: 'bg-black text-white' },
  'in-progress':{ label: 'In Progress', badgeClass: 'bg-yellow-100 text-yellow-800' },
  completed:    { label: 'Completed',   badgeClass: 'bg-green-100 text-green-800' },
  canceled:     { label: 'Canceled',    badgeClass: 'bg-red-100 text-red-800' },
};

type Tab = 'orders' | 'clock';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function MemberOverviewPage({ member, onBack }: MemberOverviewPageProps) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  useEffect(() => {
    fetchOrders()
      .then((all) =>
        setOrders(all.filter((o) => o.assignedEmployees?.some((e) => e === member.name)))
      )
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [member.id]);

  const completed  = orders.filter((o) => o.status === 'completed').length;
  const inProgress = orders.filter((o) => o.status === 'in-progress').length;
  const scheduled  = orders.filter((o) => o.status === 'scheduled').length;
  const canceled   = orders.filter((o) => o.status === 'canceled').length;

  // Clock history: completed jobs with both timestamps
  const clockEntries = useMemo(() => {
    const entries = orders
      .filter((o) => o.status === 'completed' && o.startedAt && o.completedAt)
      .map((o) => ({
        date: new Date(o.startedAt!).toISOString().split('T')[0],
        clockIn: o.startedAt!,
        clockOut: o.completedAt!,
        orderNumber: o.orderNumber,
        duration: o.completedAt! - o.startedAt!,
      }))
      .sort((a, b) => b.clockIn - a.clockIn);

    const grouped: Record<string, typeof entries> = {};
    entries.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });
    return { entries, grouped: Object.entries(grouped) };
  }, [orders]);

  const totalHoursMs = clockEntries.entries.reduce((a, e) => a + e.duration, 0);

  const roleBadgeClass =
    member.role === 'Admin'      ? 'bg-[#033620] text-white shadow-sm' :
    member.role === 'Supervisor' ? 'bg-gray-700 text-white shadow-sm'  :
                                   'bg-gray-200 text-gray-700 shadow-sm';

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 p-4 md:p-6 lg:p-8">

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Team Members
        </button>

        {/* ── Profile header ── */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-4 mb-3">
            <Avatar className="w-14 h-14 shadow-sm shrink-0">
              {member.avatar_url && (
                <AvatarImage
                  src={`http://localhost:3001${member.avatar_url}`}
                  alt={member.name}
                />
              )}
              <AvatarFallback className="bg-[#033620] text-white text-lg font-semibold">
                {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-[Poppins] font-bold">{member.name}</h1>
                <Badge className={roleBadgeClass}>{member.role}</Badge>
              </div>
              {member.email && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                  <IconMail className="w-3.5 h-3.5" />
                  {member.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <IconCircleCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Completed</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{completed}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-[#033620]">Successfully finished</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-yellow-400 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <IconClock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">In Progress</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{inProgress}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-yellow-600">Active today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <IconClipboardList className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Scheduled</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{scheduled}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-blue-600">Pending to start</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-red-400 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <IconX className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Canceled</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">{canceled}</div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-red-500">Not completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                  <IconClock className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Total Hours</span>
                  <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">
                    {totalHoursMs > 0 ? formatDuration(totalHoursMs) : '—'}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
                <p className="text-xs text-purple-600">All completed jobs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'orders'
                ? 'border-[#033620] text-[#033620]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconClipboardList className="w-4 h-4" />
              Assigned Orders
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clock')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'clock'
                ? 'border-[#033620] text-[#033620]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <IconClock className="w-4 h-4" />
              Clock History
            </span>
          </button>
        </div>

        {/* ── Assigned orders table ── */}
        {activeTab === 'orders' && (
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Assigned Orders
              <span className="ml-2 text-sm font-normal text-gray-500">({orders.length} total)</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#033620] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <IconClipboardList className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No orders assigned to this member.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, badgeClass: 'bg-gray-100 text-gray-700' };
                    const dateStr = order.date
                      ? new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—';
                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="pl-6 font-medium text-gray-900">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell className="text-gray-700">{order.clientName || '—'}</TableCell>
                        <TableCell className="text-gray-600">{order.serviceType}</TableCell>
                        <TableCell className="text-gray-600">{dateStr}</TableCell>
                        <TableCell className="text-gray-600">{order.time || '—'}</TableCell>
                        <TableCell className="pr-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badgeClass}`}>
                            {cfg.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        )}

        {/* ── Clock History ── */}
        {activeTab === 'clock' && (
        <Card className="shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Clock History
              <span className="ml-2 text-sm font-normal text-gray-500">
                {clockEntries.entries.length} session{clockEntries.entries.length !== 1 ? 's' : ''}
                {totalHoursMs > 0 && ` · ${formatDuration(totalHoursMs)} total`}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-[#033620] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clockEntries.grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <IconClock className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No clock history yet.</p>
                <p className="text-xs text-gray-400">Complete a job to see clock-in/out records.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clockEntries.grouped.map(([date, entries]) => {
                  const dayTotal = entries.reduce((a, e) => a + e.duration, 0);
                  return (
                    <div key={date} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Day header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <IconCalendar className="w-4 h-4 text-gray-400" />
                          {formatDateLabel(date)}
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#033620] text-white text-xs font-medium px-2.5 py-1 rounded-full">
                          <IconClock className="w-3 h-3" />
                          {formatDuration(dayTotal)}
                        </div>
                      </div>

                      {/* Entries */}
                      <div className="divide-y divide-gray-100">
                        {entries.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                            <span className="text-sm font-semibold text-gray-800">#{entry.orderNumber}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                                <IconLogin className="w-3 h-3" />
                                {formatTime(entry.clockIn)}
                              </div>
                              <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                                <IconLogout className="w-3 h-3" />
                                {formatTime(entry.clockOut)}
                              </div>
                              <span className="text-xs text-gray-500 w-12 text-right">{formatDuration(entry.duration)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

      </div>
    </div>
  );
}
