import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { IconBell, IconWorld } from '@tabler/icons-react';

export function SettingsGeneralPage({ user }: { user: any }) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1>General Settings</h1>
        <p className="text-gray-600">Configure notifications and regional preferences</p>
      </div>

      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell className="w-5 h-5 text-[#033620]" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#033620] rounded shadow-sm" />
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-gray-500">Get notified about order status changes</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-[#033620] rounded shadow-sm" />
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Team Activity</p>
                <p className="text-sm text-gray-500">Notifications about team member actions</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-[#033620] rounded shadow-sm" />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-gray-500">Receive news and promotions</p>
              </div>
              <input type="checkbox" className="w-5 h-5 text-[#033620] rounded shadow-sm" />
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWorld className="w-5 h-5 text-[#033620]" />
              Regional Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select id="language" className="w-full px-3 py-2 border rounded-lg shadow-sm">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select id="timezone" className="w-full px-3 py-2 border rounded-lg shadow-sm">
                  <option>Eastern Time (ET)</option>
                  <option>Central Time (CT)</option>
                  <option>Mountain Time (MT)</option>
                  <option>Pacific Time (PT)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <select id="dateFormat" className="w-full px-3 py-2 border rounded-lg shadow-sm">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeFormat">Time Format</Label>
                <select id="timeFormat" className="w-full px-3 py-2 border rounded-lg shadow-sm">
                  <option>12-hour</option>
                  <option>24-hour</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t">
              <Button className="bg-[#033620] hover:bg-[#022819] text-white shadow-md">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
