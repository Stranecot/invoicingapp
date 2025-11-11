import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export default function SettingsPage() {
  return (
    <div>
      <Header
        title="Settings"
        description="Configure admin dashboard settings"
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Configure basic dashboard settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Dashboard Name"
              defaultValue="Admin Dashboard"
              placeholder="Enter dashboard name"
            />
            <Input
              label="Support Email"
              type="email"
              defaultValue="admin@invoiceapp.com"
              placeholder="Enter support email"
            />
            <Select
              label="Default Language"
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
              ]}
              defaultValue="en"
            />
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>Configure email service settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="From Email"
              type="email"
              defaultValue="noreply@invoiceapp.com"
              placeholder="Enter from email"
            />
            <Input
              label="From Name"
              defaultValue="Invoice App Admin"
              placeholder="Enter from name"
            />
            <Input
              label="Reply-To Email"
              type="email"
              defaultValue="support@invoiceapp.com"
              placeholder="Enter reply-to email"
            />
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security and access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Session Timeout"
              options={[
                { value: '30', label: '30 minutes' },
                { value: '60', label: '1 hour' },
                { value: '120', label: '2 hours' },
                { value: '480', label: '8 hours' },
              ]}
              defaultValue="60"
            />
            <Select
              label="Two-Factor Authentication"
              options={[
                { value: 'optional', label: 'Optional' },
                { value: 'required', label: 'Required for all users' },
              ]}
              defaultValue="optional"
            />
            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
