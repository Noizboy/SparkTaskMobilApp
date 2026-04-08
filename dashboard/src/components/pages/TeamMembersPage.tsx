import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { fetchTeamMembers, updateTeamMember, deleteTeamMember, inviteTeamMember, linkTeamMember } from '../../services/api';
import { IconUserPlus, IconCheck, IconCopy, IconSearch, IconPencil, IconTrash, IconLink } from '@tabler/icons-react';
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
}

export function TeamMembersPage({ user, teamMembers: externalTeamMembers, onInvite, onUpdateMember, onDeleteMember }: TeamMembersPageProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(externalTeamMembers || []);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(!externalTeamMembers);

  useEffect(() => {
    if (externalTeamMembers) { setTeamMembers(externalTeamMembers); setFetchLoading(false); return; }
    setFetchError(null);
    setFetchLoading(true);
    fetchTeamMembers().then((members) => {
      setTeamMembers(members.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
        status: 'active',
        ordersCompleted: u.orders_completed ?? 0,
        avatar_url: u.avatar_url ?? undefined,
      })));
    }).catch((err: Error) => {
      setFetchError(err.message || 'Failed to load team members');
      setTeamMembers([]);
    }).finally(() => {
      setFetchLoading(false);
    });
  }, [externalTeamMembers]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) {
      setError('Please enter an email address');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInviteSuccess('');
    try {
      const result = await inviteTeamMember(inviteEmail);
      setInviteLink(result.inviteLink);
      setInviteSuccess(`Invite link generated for ${result.email}`);
      if (onInvite) await onInvite(inviteEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkEmployee = async () => {
    if (!linkEmail) {
      setError('Please enter an employee email');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const linked = await linkTeamMember(linkEmail);
      setTeamMembers((prev) => [
        ...prev,
        {
          id: linked.id,
          name: linked.name,
          email: linked.email,
          role: linked.role.charAt(0).toUpperCase() + linked.role.slice(1),
          status: 'active',
          ordersCompleted: 0,
          avatar_url: linked.avatar_url ?? undefined,
        },
      ]);
      setLinkEmail('');
      setIsLinkDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to link employee');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter team members by name or email
  const filteredMembers = teamMembers.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  });

  const handleEditMember = (member: any) => {
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
    } catch (err) {
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
    } catch (err) {
      setError('Failed to delete member');
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return <TeamMembersSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Team Members</h1>
          <p className="text-gray-600">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
            <IconUserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
          <Button variant="outline" onClick={() => { setError(null); setIsLinkDialogOpen(true); }} className="shadow-md">
            <IconLink className="w-4 h-4 mr-2" />
            Link Existing
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <IconSearch className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 shadow-sm"
          />
        </div>
      </div>

      {fetchError && (
        <Alert className="mb-6 border-red-300 bg-red-50">
          <AlertDescription className="text-red-700">{fetchError}</AlertDescription>
        </Alert>
      )}

      {filteredMembers.length === 0 && !fetchError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <IconUserPlus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'No members found' : 'No team members yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            {searchQuery
              ? 'Try a different search term.'
              : 'Invite or link employees to start building your team.'}
          </p>
          {!searchQuery && (
            <div className="flex gap-2">
              <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
                <IconUserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
              <Button variant="outline" onClick={() => { setError(null); setIsLinkDialogOpen(true); }} className="shadow-md">
                <IconLink className="w-4 h-4 mr-2" />
                Link Existing
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 relative">
              {/* Action Buttons - Top Right */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEditMember(member)}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors border border-gray-300 shadow-sm"
                >
                  <IconPencil className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteMember(member.id)}
                  className="p-1.5 hover:bg-red-50 rounded-md transition-colors border border-red-300 shadow-sm"
                >
                  <IconTrash className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <Avatar className="w-16 h-16 mb-4 shadow-sm">
                  {member.avatar_url && <AvatarImage src={member.avatar_url} alt={member.name} />}
                  <AvatarFallback className="bg-[#033620] text-white text-lg font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-gray-900 mb-1 font-medium">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{member.email}</p>
                <Badge className={member.role === 'Supervisor' ? 'bg-gray-700 text-white shadow-sm' : 'bg-gray-200 text-gray-700 shadow-sm'}>
                  {member.role}
                </Badge>
                <div className="mt-4 pt-4 border-t border-gray-200 w-full">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orders completed</span>
                    <span className="text-[#033620] font-bold font-[Poppins]">{member.ordersCompleted}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="shadow-xl" aria-describedby="invite-dialog-description">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription id="invite-dialog-description">
              Send an email invitation or share the invitation link
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Employee email</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="employee@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="shadow-sm"
              />
            </div>

            {inviteSuccess && (
              <p className="text-sm text-green-700 font-medium">{inviteSuccess}</p>
            )}

            {inviteLink && (
              <div className="space-y-2">
                <Label>Invitation link (share with employee)</Label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="flex-1 shadow-sm text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0 shadow-sm"
                  >
                    {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsInviteDialogOpen(false); setInviteEmail(''); setInviteLink(''); setInviteSuccess(''); setError(null); }}>
              Close
            </Button>
            <Button onClick={handleSendInvite} disabled={isLoading} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              {isLoading ? 'Generating…' : 'Generate Invite Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Existing Employee Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={(open) => { setIsLinkDialogOpen(open); if (!open) { setLinkEmail(''); setError(null); } }}>
        <DialogContent className="shadow-xl" aria-describedby="link-dialog-description">
          <DialogHeader>
            <DialogTitle>Link Existing Employee</DialogTitle>
            <DialogDescription id="link-dialog-description">
              Link an existing employee account to your business by their email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkEmail">Employee email</Label>
              <Input
                id="linkEmail"
                type="email"
                placeholder="employee@email.com"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                className="shadow-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsLinkDialogOpen(false); setLinkEmail(''); setError(null); }}>
              Cancel
            </Button>
            <Button onClick={handleLinkEmployee} disabled={isLoading} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              {isLoading ? 'Linking…' : 'Link Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editingMember !== null} onOpenChange={(open) => !open && setEditingMember(null)}>
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
            <Button onClick={handleSaveEdit} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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

      {/* Error Alert */}
      {error && (
        <Alert className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}