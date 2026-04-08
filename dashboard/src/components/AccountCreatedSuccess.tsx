import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { IconSparkles, IconCircleCheck } from '@tabler/icons-react';
import { Alert, AlertDescription } from './ui/alert';
import { useState, useEffect } from 'react';

interface AccountCreatedSuccessProps {
  email: string;
  onBackToLogin: () => void;
  onResendEmail?: (email: string) => Promise<void>;
}

export function AccountCreatedSuccess({ email, onBackToLogin, onResendEmail }: AccountCreatedSuccessProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!onResendEmail) return;
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);
    try {
      await onResendEmail(email);
      setResendSuccess(true);
      setCountdown(60); // Start 60 second countdown
    } catch (error) {
      setResendError('Failed to resend email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#033620] rounded-lg flex items-center justify-center shadow-md">
                <IconSparkles className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-[#033620] font-semibold text-xl">SparkTask</span>
            </div>
          </div>
          
          <CardTitle className="text-center text-2xl">Account Created Successfully!</CardTitle>
          <CardDescription className="text-center">
            Your SparkTask account has been created
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Icon with Alert */}
          <Alert className="bg-[#033620]/5 border-[#033620]/20">
            <IconCircleCheck className="h-10 w-10 text-[#033620]" />
            <AlertDescription className="ml-2">
              <span className="font-medium text-[#033620]">Check your email</span>
              <p className="text-sm text-gray-600 mt-1">
                We've sent a verification link to:
              </p>
              <p className="text-sm font-medium text-black mt-1 break-all">
                {email}
              </p>
            </AlertDescription>
          </Alert>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border shadow-sm">
              <h3 className="font-semibold text-sm text-black mb-3">Next Steps:</h3>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#033620] min-w-[20px]" style={{ fontFamily: 'Poppins, sans-serif' }}>1.</span>
                  <span>Open your email inbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#033620] min-w-[20px]" style={{ fontFamily: 'Poppins, sans-serif' }}>2.</span>
                  <span>Look for an email from SparkTask</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#033620] min-w-[20px]" style={{ fontFamily: 'Poppins, sans-serif' }}>3.</span>
                  <span>Click the activation link to verify your account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#033620] min-w-[20px]" style={{ fontFamily: 'Poppins, sans-serif' }}>4.</span>
                  <span>Sign in and start managing your cleaning services</span>
                </li>
              </ol>
            </div>

            {/* Resend Email Section */}
            <div className="text-center text-sm text-gray-600 px-2">
              <p>Didn't receive the email?</p>
              {onResendEmail && (
                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    onClick={handleResendEmail}
                    variant="outline"
                    className="border-[#033620] text-[#033620] hover:bg-[#033620] hover:text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResending || countdown > 0}
                  >
                    {isResending ? 'Resending...' : 'Resend Email'}
                  </Button>
                  {countdown > 0 && (
                    <p className="text-gray-500 text-xs">
                      You can resend in <span className="font-bold text-[#033620]" style={{ fontFamily: 'Poppins, sans-serif' }}>{countdown}s</span>
                    </p>
                  )}
                  {resendSuccess && countdown === 0 && (
                    <p className="text-green-600 text-sm font-medium">✓ Email sent successfully!</p>
                  )}
                  {resendError && (
                    <p className="text-red-600 text-sm">{resendError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={onBackToLogin} 
            className="w-full bg-[#033620] hover:bg-[#022819] shadow-md text-white"
          >
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}