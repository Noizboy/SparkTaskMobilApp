import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { IconUser, IconBuilding } from '@tabler/icons-react';
import { updateUser } from '../../services/api';

export function SettingsAccountPage({ user, onUserUpdate }: { user: any; onUserUpdate: (updated: any) => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await updateUser(user.id, { name, phone });
      onUserUpdate({ ...user, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1>Account Settings</h1>
        <p className="text-gray-600">Manage your personal and company information</p>
      </div>

      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="w-5 h-5 text-[#033620]" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled className="shadow-sm bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue={user?.role ?? 'Admin'} disabled className="shadow-sm bg-gray-50" />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saved && <p className="text-sm text-green-600">Saved successfully.</p>}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuilding className="w-5 h-5 text-[#033620]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue={user?.company} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input id="companyPhone" type="tel" className="shadow-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Input id="companyAddress" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" className="shadow-sm" />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" className="shadow-sm" />
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
