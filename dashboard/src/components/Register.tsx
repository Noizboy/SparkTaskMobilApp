import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { IconSparkles } from '@tabler/icons-react';
import { Alert, AlertDescription } from './ui/alert';
import { AccountCreatedSuccess } from './AccountCreatedSuccess';

interface RegisterProps {
  onRegister: (userData: any) => void;
  onSwitchToLogin: () => void;
  onSubmit?: (formData: any) => Promise<void>;
  onResendEmail?: (email: string) => Promise<void>;
}

export function Register({ onRegister, onSwitchToLogin, onSubmit, onResendEmail }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    plan: 'starter'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        // Use external API
        await onSubmit(formData);
      } else {
        // Mock registration - simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Show success screen instead of auto-login
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen if registration was successful
  if (showSuccess) {
    return <AccountCreatedSuccess 
      email={formData.email} 
      onBackToLogin={onSwitchToLogin}
      onResendEmail={onResendEmail}
    />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-md">
                <IconSparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-[#033620] font-semibold text-xl">SparkTask</span>
            </div>
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Register your company and start managing your services
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Clean Pro Services"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter - $29/month</SelectItem>
                  <SelectItem value="professional">Professional - $79/month</SelectItem>
                  <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {error && (
              <Alert className="border-red-200 bg-red-50 mb-2">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full bg-[#033620] hover:bg-[#022819] shadow-md text-white" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#033620] hover:underline font-medium"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}