import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { IconBuildingSkyscraper, IconMail, IconPhone, IconMapPin, IconBell, IconClock, IconWorld } from '@tabler/icons-react';

export function CompanySettingsPage({ user }: { user: any }) {
  const [companyData, setCompanyData] = useState({
    name: user?.company || 'Clean Pro Services',
    email: 'contact@cleanpro.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, Suite 100',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    website: 'www.cleanpro.com',
    description: 'Leading professional cleaning services company',
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailReports: true,
    smsReminders: false,
    pushNotifications: true,
  });

  const [businessHours, setBusinessHours] = useState({
    weekdayStart: '08:00',
    weekdayEnd: '18:00',
    weekendStart: '09:00',
    weekendEnd: '15:00',
    timezone: 'America/New_York',
  });

  const handleSaveCompanyInfo = () => {
    console.log('Saving company info:', companyData);
  };

  const handleSaveNotifications = () => {
    console.log('Saving notifications:', notifications);
  };

  const handleSaveBusinessHours = () => {
    console.log('Saving business hours:', businessHours);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1>Company Settings</h1>
        <p className="text-gray-600">Manage your company information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic details about your company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="relative">
                  <IconBuildingSkyscraper className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="companyName"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <div className="relative">
                  <IconPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <div className="relative">
                  <IconWorld className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="companyWebsite"
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Address</Label>
              <div className="relative">
                <IconMapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  id="companyAddress"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  className="pl-10 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyCity">City</Label>
                <Input
                  id="companyCity"
                  value={companyData.city}
                  onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                  className="shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyState">State</Label>
                <Input
                  id="companyState"
                  value={companyData.state}
                  onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                  className="shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyZip">Zip Code</Label>
                <Input
                  id="companyZip"
                  value={companyData.zipCode}
                  onChange={(e) => setCompanyData({ ...companyData, zipCode: e.target.value })}
                  className="shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyDescription">Description</Label>
              <Textarea
                id="companyDescription"
                value={companyData.description}
                onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                rows={3}
                className="shadow-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveCompanyInfo} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>Define your company's operating hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monday to Friday - Start</Label>
                <div className="relative">
                  <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={businessHours.weekdayStart}
                    onChange={(e) => setBusinessHours({ ...businessHours, weekdayStart: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monday to Friday - End</Label>
                <div className="relative">
                  <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={businessHours.weekdayEnd}
                    onChange={(e) => setBusinessHours({ ...businessHours, weekdayEnd: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Weekends - Start</Label>
                <div className="relative">
                  <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={businessHours.weekendStart}
                    onChange={(e) => setBusinessHours({ ...businessHours, weekendStart: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Weekends - End</Label>
                <div className="relative">
                  <IconClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="time"
                    value={businessHours.weekendEnd}
                    onChange={(e) => setBusinessHours({ ...businessHours, weekendEnd: e.target.value })}
                    className="pl-10 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBusinessHours} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
                Save Hours
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure how you want to receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Order Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive emails when orders are created or updated</p>
                </div>
              </div>
              <Switch
                checked={notifications.emailOrders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailOrders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconMail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Weekly Email Reports</p>
                  <p className="text-sm text-gray-500">Weekly activity and statistics summary</p>
                </div>
              </div>
              <Switch
                checked={notifications.emailReports}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconPhone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">SMS Reminders</p>
                  <p className="text-sm text-gray-500">Upcoming order reminders</p>
                </div>
              </div>
              <Switch
                checked={notifications.smsReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, smsReminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500">Real-time browser notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.pushNotifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveNotifications} className="bg-[#033620] hover:bg-[#022819] shadow-md text-white">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}