import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { fetchTeamMembers, updateTeamMember, deleteTeamMember } from '../../services/api';
import { mockTeamMembers } from '../../data/mockTeamMembers';
import {
  IconUserPlus, IconPencil, IconTrash,
  IconUsers, IconUserCheck, IconShield,
  IconChevronLeft, IconChevronRight, IconClipboardList,
  IconCircleCheck, IconSettings,
} from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { TeamMembersSkeleton } from '../skeletons';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  ordersCompleted: number;
  avatar_url?: string;
};

interface TeamMembersPageProps {
  user: any;
  teamMembers?: TeamMember[];
  onInvite?: (email: string) => Promise<void>;
  onUpdateMember?: (id: string, data: Partial<TeamMember>) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void>;
  onViewMember?: (member: TeamMember) => void;
}

// ─── Role badge helper ───────────────────────────────────────────────────────
function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === 'supervisor') return 'bg-[#033620] text-white border-transparent';
  if (r === 'cleaner') return 'bg-blue-100 text-blue-800 border-transparent';
  return 'bg-gray-100 text-gray-700 border-transparent';
}

// ─── Status badge helper ─────────────────────────────────────────────────────
function getStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active') return 'bg-green-100 text-green-800 border-transparent';
  if (s === 'inactive') return 'bg-red-100 text-red-700 border-transparent';
  return 'bg-gray-100 text-gray-600 border-transparent';
}

// ─── Avatar initials helper ──────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TeamMembersPage({
  user,
  teamMembers: externalTeamMembers,
  onInvite,
  onUpdateMember,
  onDeleteMember,
  onViewMember,
}: TeamMembersPageProps) {
  // ── Dialog / action state ─────────────────────────────────────────────────
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Cleaner');
  const [newMemberStatus, setNewMemberStatus] = useState('active');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(externalTeamMembers || []);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(!externalTeamMembers);

  // ── Overview dialog state ──────────────────────────────────────────────────
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [overviewMember, setOverviewMember] = useState<TeamMember | null>(null);
  const [overviewRole, setOverviewRole] = useState('');
  const [overviewStatus, setOverviewStatus] = useState('');

  // ── Table / filter state (new) ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Data fetch (preserved) ─────────────────────────────────────────────────
  useEffect(() => {
    if (externalTeamMembers) {
      setTeamMembers(externalTeamMembers);
      setFetchLoading(false);
      return;
    }
    setFetchError(null);
    setFetchLoading(true);
    fetchTeamMembers()
      .then((members) => {
        setTeamMembers(
          members.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            status: 'active',
            ordersCompleted: u.orders_completed ?? 0,
            avatar_url: u.avatar_url ?? undefined,
          }))
        );
      })
      .catch((err: Error) => {
        // Fall back to mock data so the page remains usable when the API is
        // unavailable (server not running, missing env var, wrong URL, etc.).
        // The banner informs the user they're seeing demo data.
        setTeamMembers(
          mockTeamMembers.map((m) => ({ ...m, avatar_url: undefined }))
        );
        setFetchError(
          `Unable to reach the API — showing demo data. (${err.message})`
        );
      })
      .finally(() => {
        setFetchLoading(false);
      });
  }, [externalTeamMembers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  // ── Stats computed from full list ──────────────────────────────────────────
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter((m) => m.status === 'active').length;
  const supervisors = teamMembers.filter(
    (m) => m.role.toLowerCase() === 'supervisor'
  ).length;
  const totalOrdersCompleted = teamMembers.reduce(
    (sum, m) => sum + m.ordersCompleted,
    0
  );

  // ── Filtered & paginated list ──────────────────────────────────────────────
  const filteredMembers = teamMembers.filter((member) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q);
    const matchRole =
      roleFilter === 'all' ||
      member.role.toLowerCase() === roleFilter.toLowerCase();
    const matchStatus =
      statusFilter === 'all' ||
      member.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedMembers = filteredMembers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const firstRow = filteredMembers.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRow = Math.min(safePage * pageSize, filteredMembers.length);

  // ── Add Member handler ────────────────────────────────────────────────────
  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      setAddMemberError('Name and email are required');
      return;
    }
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      email: newMemberEmail.trim(),
      role: newMemberRole,
      status: newMemberStatus,
      ordersCompleted: 0,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    setIsAddMemberOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('Cleaner');
    setNewMemberStatus('active');
    setAddMemberError(null);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditRole(member.role);
  };

  const handleSaveEdit = async () => {
    if (!editingMember) return;
    setIsLoading(true);
    try {
      await updateTeamMember(editingMember.id, { role: editRole.toLowerCase() });
      if (onUpdateMember) await onUpdateMember(editingMember.id, { role: editRole });
      setTeamMembers(teamMembers.map((m) =>
        m.id === editingMember.id ? { ...m, role: editRole } : m
      ));
      setEditingMember(null);
      setError(null);
    } catch {
      setError('Failed to update member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    setIsLoading(true);
    try {
      await deleteTeamMember(memberToDelete);
      if (onDeleteMember) await onDeleteMember(memberToDelete);
      setTeamMembers(teamMembers.filter((m) => m.id !== memberToDelete));
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      setError(null);
    } catch {
      setError('Failed to delete member');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Overview dialog handlers ───────────────────────────────────────────────
  const openOverviewDialog = (member: TeamMember) => {
    setOverviewMember(member);
    setOverviewRole(member.role);
    setOverviewStatus(member.status);
    setIsOverviewOpen(true);
  };

  const handleSaveOverview = async () => {
    if (!overviewMember) return;
    setIsLoading(true);
    try {
      // API only accepts role updates; status is managed in local state only
      await updateTeamMember(overviewMember.id, {
        role: overviewRole.toLowerCase(),
      });
      if (onUpdateMember) {
        await onUpdateMember(overviewMember.id, { role: overviewRole, status: overviewStatus });
      }
      setTeamMembers((prev) =>
        prev.map((m) =>
          m.id === overviewMember.id
            ? { ...m, role: overviewRole, status: overviewStatus }
            : m
        )
      );
      setIsOverviewOpen(false);
      setOverviewMember(null);
      setError(null);
    } catch {
      setError('Failed to update member');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return <TeamMembersSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-full flex flex-col gap-6">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[Poppins] font-bold text-[24px] text-gray-900">
            Team Members
          </h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Manage your team and their roles
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => { setAddMemberError(null); setIsAddMemberOpen(true); }}
            className="bg-[#033620] hover:bg-[#033620]/90 shadow-md text-white gap-2"
          >
            <IconUserPlus className="w-4 h-4" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Members */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <IconUsers className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Total Members</span>
                <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">
                  {totalMembers}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
              <p className="text-xs text-[#033620]">All registered members</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Members */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <IconUserCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Active Members</span>
                <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">
                  {activeMembers}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
              <p className="text-xs text-[#033620]">Available for work</p>
            </div>
          </CardContent>
        </Card>

        {/* Supervisors */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <IconShield className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Supervisors</span>
                <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">
                  {supervisors}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
              <p className="text-xs text-[#033620]">Team leads</p>
            </div>
          </CardContent>
        </Card>

        {/* Orders Completed */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <IconClipboardList className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="text-xs md:text-sm text-gray-600 block mb-1 md:mb-2">Orders Completed</span>
                <div className="text-gray-900 font-bold text-[24px] md:text-[32px] font-[Poppins] leading-none">
                  {totalOrdersCompleted}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-2 md:pt-3 mt-2 md:mt-3">
              <p className="text-xs text-[#033620]">Across all members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Fetch Error ───────────────────────────────────────────────────────── */}
      {fetchError && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-700">{fetchError}</AlertDescription>
        </Alert>
      )}

      {/* ── Table Card ───────────────────────────────────────────────────────── */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row flex-wrap items-center gap-3">
          <CardTitle className="font-[Poppins] font-bold text-base">
            All Members
          </CardTitle>
          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Search */}
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 h-9 shadow-sm text-sm"
            />
            {/* Role filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-48 shadow-sm text-sm border border-gray-200 rounded-md">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Cleaner">Cleaner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* ── Data Table ── */}
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="pl-4 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <div className="flex items-center gap-1.5"><IconUsers size={14} /><span>Members</span></div>
                </TableHead>
                <TableHead className="text-left text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <div className="flex items-center gap-1.5"><IconShield size={14} /><span>Role</span></div>
                </TableHead>
                <TableHead className="text-left text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <div className="flex items-center gap-1.5"><IconCircleCheck size={14} /><span>Status</span></div>
                </TableHead>
                <TableHead className="text-center text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <div className="flex items-center justify-center gap-1.5"><IconClipboardList size={14} /><span>Orders</span></div>
                </TableHead>
                <TableHead className="pr-4 text-right text-xs uppercase text-gray-500 font-semibold tracking-wider w-24">
                  <div className="flex items-center justify-end gap-1.5"><IconSettings size={14} /><span>Actions</span></div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="p-16 text-center">
                      <div className="flex justify-center mb-4">
                        <IconUsers className="w-16 h-16 text-gray-300" />
                      </div>
                      <h3 className="text-gray-900 mb-2">
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'No members match your filters'
                          : 'No team members yet'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-6">
                        {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search or filters'
                          : 'Add members to get started'}
                      </p>
                      <Button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="bg-[#033620] hover:bg-[#022819] text-white shadow-md"
                      >
                        <IconUserPlus className="w-4 h-4 mr-2" />
                        Add New Member
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Member */}
                    <TableCell className="pl-4 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => openOverviewDialog(member)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View overview for ${member.name}`}
                        onKeyDown={(e) => e.key === 'Enter' && openOverviewDialog(member)}
                      >
                        <Avatar className="w-9 h-9 shadow-sm flex-shrink-0">
                          {member.avatar_url && (
                            <AvatarImage src={member.avatar_url} alt={member.name} />
                          )}
                          <AvatarFallback className="bg-[#033620] text-white text-xs font-semibold">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm leading-tight truncate group-hover:underline">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-4">
                      <Badge className={getRoleBadgeClass(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          member.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="text-center py-4">
                      <span className="font-semibold text-[#033620] font-[Poppins]">
                        {member.ordersCompleted}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="pr-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-[#033620]"
                          onClick={() => handleEditMember(member)}
                          aria-label={`Edit ${member.name}`}
                          title="Edit role"
                        >
                          <IconPencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => handleDeleteMember(member.id)}
                          aria-label={`Delete ${member.name}`}
                          title="Delete member"
                        >
                          <IconTrash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ── Pagination Footer ── */}
          {filteredMembers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
              {/* Rows per page + row count */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 whitespace-nowrap">Rows per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => setPageSize(Number(v))}
                  >
                    <SelectTrigger className="h-7 w-[64px] text-xs shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs text-gray-500">
                  {firstRow}–{lastRow} of {filteredMembers.length} members
                </span>
              </div>

              {/* Page controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shadow-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                >
                  <IconChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shadow-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                >
                  <IconChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Add New Member Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={isAddMemberOpen}
        onOpenChange={(open) => {
          setIsAddMemberOpen(open);
          if (!open) {
            setNewMemberName('');
            setNewMemberEmail('');
            setNewMemberRole('Cleaner');
            setNewMemberStatus('active');
            setAddMemberError(null);
          }
        }}
      >
        <DialogContent className="shadow-xl !max-w-md !w-auto" aria-describedby="add-member-dialog-description">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription id="add-member-dialog-description">
              Create a new member account. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="newMemberName">Name</Label>
              <Input
                id="newMemberName"
                placeholder="Enter full name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="shadow-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="newMemberEmail">Email</Label>
              <Input
                id="newMemberEmail"
                type="email"
                placeholder="Enter email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="shadow-sm"
              />
            </div>

            {/* Role + Status side-by-side */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newMemberRole">Role</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger id="newMemberRole" className="shadow-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleaner">Cleaner</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newMemberStatus">Status</Label>
                <Select value={newMemberStatus} onValueChange={setNewMemberStatus}>
                  <SelectTrigger id="newMemberStatus" className="shadow-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inline validation error */}
            {addMemberError && (
              <p className="text-sm text-red-600">{addMemberError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleAddMember}
              className="bg-[#033620] text-white hover:bg-[#033620]/90 shadow-md"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Role Dialog (preserved) ──────────────────────────────────────── */}
      <Dialog
        open={editingMember !== null}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent className="shadow-xl" aria-describedby="edit-dialog-description">
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription id="edit-dialog-description">
              Change the role of {editingMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="shadow-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cleaner">Cleaner</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="bg-[#033620] hover:bg-[#022819] shadow-md text-white"
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog (preserved) ────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this team member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Member Overview Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={isOverviewOpen}
        onOpenChange={(open) => {
          setIsOverviewOpen(open);
          if (!open) setOverviewMember(null);
        }}
      >
        <DialogContent className="shadow-xl !max-w-sm" aria-describedby="overview-dialog-description">
          <DialogHeader>
            <DialogTitle>Member Overview</DialogTitle>
            <DialogDescription id="overview-dialog-description">
              View and update this member&apos;s role and status.
            </DialogDescription>
          </DialogHeader>

          {overviewMember && (
            <div className="space-y-5 py-2">
              {/* Avatar + name + email */}
              <div className="flex flex-col items-center gap-2 text-center">
                <Avatar className="h-16 w-16 shadow-md">
                  {overviewMember.avatar_url && (
                    <AvatarImage src={overviewMember.avatar_url} alt={overviewMember.name} />
                  )}
                  <AvatarFallback className="bg-[#033620] text-white text-xl font-bold">
                    {getInitials(overviewMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">{overviewMember.name}</p>
                  <p className="text-sm text-gray-500">{overviewMember.email}</p>
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="overviewRole">Role</Label>
                <Select value={overviewRole} onValueChange={setOverviewRole}>
                  <SelectTrigger id="overviewRole" className="shadow-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleaner">Cleaner</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="overviewStatus">Status</Label>
                <Select value={overviewStatus} onValueChange={setOverviewStatus}>
                  <SelectTrigger id="overviewStatus" className="shadow-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverviewOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOverview}
              disabled={isLoading}
              className="bg-[#033620] hover:bg-[#022819] shadow-md text-white"
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Global Error (preserved) ──────────────────────────────────────────── */}
      {error && !isAddMemberOpen && editingMember === null && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}