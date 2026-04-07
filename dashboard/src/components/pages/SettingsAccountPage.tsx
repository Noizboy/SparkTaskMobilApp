import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { IconUser, IconBuilding } from '@tabler/icons-react';

export function SettingsAccountPage({ user }: { user: any }) {
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
                <Input id="fullName" defaultValue={user?.name} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Admin" disabled className="shadow-sm bg-gray-50" />
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
                <Input id="companyPhone" type="tel" defaultValue="+1 (555) 987-6543" className="shadow-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Input id="companyAddress" defaultValue="123 Cleaning St, Suite 100" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" defaultValue="New York" className="shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input id="zipCode" defaultValue="10001" className="shadow-sm" />
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
