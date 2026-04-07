import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { IconUserPlus, IconCheck, IconCopy, IconSearch, IconPencil, IconTrash } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  ordersCompleted: number;
};

const mockTeamMembers = [
  { id: '1', name: 'John Perez', email: 'john@email.com', role: 'Employee', status: 'active', ordersCompleted: 45 },
  { id: '2', name: 'Anna Lopez', email: 'anna@email.com', role: 'Employee', status: 'active', ordersCompleted: 38 },
  { id: '3', name: 'Peter Sanchez', email: 'peter@email.com', role: 'Employee', status: 'active', ordersCompleted: 52 },
  { id: '4', name: 'Maria Torres', email: 'maria@email.com', role: 'Employee', status: 'active', ordersCompleted: 31 },
  { id: '5', name: 'Carlos Ramirez', email: 'carlos@email.com', role: 'Supervisor', status: 'active', ordersCompleted: 67 },
];

interface TeamMembersPageProps {
  user: any;
  teamMembers?: TeamMember[];
  onInvite?: (email: string) => Promise<void>;
  onUpdateMember?: (id: string, data: Partial<TeamMember>) => Promise<void>;
  onDeleteMember?: (id: string) => Promise<void>;
}

export function TeamMembersPage({ user, teamMembers: externalTeamMembers, onInvite, onUpdateMember, onDeleteMember }: TeamMembersPageProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState(externalTeamMembers || mockTeamMembers);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update local state when external data changes
  useState(() => {
    if (externalTeamMembers) {
      setTeamMembers(externalTeamMembers);
    }
  });

  const generateInviteLink = () => {
    const randomToken = Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    const companyName = encodeURIComponent(user?.companyName || 'SparkTask Company');
    const link = `${baseUrl}?invite=${randomToken}&company=${companyName}`;
    setInviteLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async () => {
    if (!inviteLink) {
      generateInviteLink();
    }
    console.log('Sending invite to:', inviteEmail);
    // Here you would typically send the email
    if (onInvite) {
      setIsLoading(true);
      try {
        await onInvite(inviteEmail);
        setError(null);
      } catch (err) {
        setError('Failed to send invite');
      } finally {
        setIsLoading(false);
      }
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
    if (editingMember && onUpdateMember) {
      setIsLoading(true);
      try {
        await onUpdateMember(editingMember.id, { role: editRole });
        const updatedMembers = teamMembers.map((member) =>
          member.id === editingMember.id ? { ...member, role: editRole } : member
        );
        setTeamMembers(updatedMembers);
        setEditingMember(null);
        setError(null);
      } catch (err) {
        setError('Failed to update member');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteMember = (id: string) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (memberToDelete && onDeleteMember) {
      setIsLoading(true);
      try {
        await onDeleteMember(memberToDelete);
        const updatedMembers = teamMembers.filter((member) => member.id !== memberToDelete);
        setTeamMembers(updatedMembers);
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
        setError(null);
      } catch (err) {
        setError('Failed to delete member');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1>Team Members</h1>
          <p className="text-gray-600">Manage your team members</p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
          <IconUserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
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
                  <AvatarFallback className="bg-[#033620] text-white">
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

            <div className="space-y-2">
              <Label>Or share this invitation link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink || 'Click "Generate Link"'}
                  readOnly
                  className="flex-1 shadow-sm"
                />
                {inviteLink ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="shrink-0 shadow-sm"
                  >
                    {copied ? <IconCheck className="w-4 h-4" /> : <IconCopy className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateInviteLink}
                    className="shrink-0 shadow-sm"
                  >
                    Generate Link
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
              Send Invitation
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
                  <SelectItem value="Employee">Employee</SelectItem>
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