import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { IconSparkles, IconArrowLeft, IconCircleCheck } from '@tabler/icons-react';
import { Alert, AlertDescription } from './ui/alert';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onSubmit?: (email: string) => Promise<void>;
}

export function ForgotPassword({ onBackToLogin, onSubmit }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (onSubmit) {
        // Use external API
        await onSubmit(email);
      }
      // Mock sending reset email (or API success)
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <IconCircleCheck className="w-10 h-10 text-[#033620]" />
              </div>
            </div>
            <CardTitle className="text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-600">
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="button" 
              onClick={onBackToLogin}
              className="w-full bg-[#033620] hover:bg-[#022819] shadow-md text-white"
            >
              Back to Sign In
            </Button>
            <button
              type="button"
              onClick={() => setEmailSent(false)}
              className="text-sm text-[#033620] hover:underline font-medium"
            >
              Didn't receive the email? Try again
            </button>
          </CardFooter>
        </Card>
      </div>
    );
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
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
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
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full bg-[#033620] hover:bg-[#022819] shadow-md text-white" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send reset link'}
            </Button>
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#033620] font-medium"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}