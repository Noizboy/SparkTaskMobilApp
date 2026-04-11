import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { IconSparkles } from '@tabler/icons-react';
import { Alert, AlertDescription } from './ui/alert';

interface LoginProps {
  onLogin: (userData: any) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onSubmit?: (email: string, password: string, rememberMe: boolean) => Promise<void>;
}

export function Login({ onLogin, onSwitchToRegister, onSwitchToForgotPassword, onSubmit }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (onSubmit) {
        // Use external API
        await onSubmit(email, password, rememberMe);
      } else {
        // Mock login
        onLogin({
          id: '1',
          email,
          name: 'Demo User',
          company: 'Clean Pro Services',
          role: 'admin'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                <Label htmlFor="remember" className="ml-2 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-[#033620] hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            {error && (
              <Alert className="border-red-200 bg-red-50 mb-2">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full bg-[#033620] hover:bg-[#022819] shadow-md text-white" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            {/* Register Link */}
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#033620] hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}