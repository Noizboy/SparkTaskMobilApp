import { useState, useEffect } from 'react';
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

export function MemberOverviewPage({ member, onBack }: MemberOverviewPageProps) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
        </div>

        {/* ── Assigned orders table ── */}
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

      </div>
    </div>
  );
}
