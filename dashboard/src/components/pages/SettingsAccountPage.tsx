import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { IconUser, IconBuilding } from '@tabler/icons-react';
import { updateUser, changePassword } from '../../services/api';

export function SettingsAccountPage({ user, onUserUpdate }: { user: any; onUserUpdate: (updated: any) => void }) {
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [companyName, setCompanyName] = useState(user?.company ?? '');
  const [companyPhone, setCompanyPhone] = useState(user?.company_phone ?? '');
  const [companyAddress, setCompanyAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [zipCode, setZipCode] = useState(user?.zip_code ?? '');
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyError, setCompanyError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

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

  const handleSaveCompany = async () => {
    setCompanySaving(true);
    setCompanyError('');
    setCompanySaved(false);
    try {
      const updated = await updateUser(user.id, {
        company: companyName,
        company_phone: companyPhone,
        address: companyAddress,
        city,
        zip_code: zipCode,
      });
      onUserUpdate({ ...user, ...updated });
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2500);
    } catch (e: any) {
      setCompanyError(e.message || 'Save failed');
    } finally {
      setCompanySaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSaved(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(user.id, currentPassword, newPassword);
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e: any) {
      setPwError(e.message || 'Password change failed');
    } finally {
      setPwSaving(false);
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
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input id="companyPhone" type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="shadow-sm" />
              </div>
            </div>
            {companyError && <p className="text-sm text-red-600">{companyError}</p>}
            {companySaved && <p className="text-sm text-green-600">Saved successfully.</p>}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleSaveCompany} disabled={companySaving} className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                {companySaving ? 'Saving...' : 'Save Changes'}
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
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="shadow-sm" />
            </div>
            {pwError && <p className="text-sm text-red-600">{pwError}</p>}
            {pwSaved && <p className="text-sm text-green-600">Password updated successfully.</p>}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleChangePassword} disabled={pwSaving} className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                {pwSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
