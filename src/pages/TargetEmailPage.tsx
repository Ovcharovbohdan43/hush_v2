import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, TargetEmail } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function TargetEmailPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [targetEmail, setTargetEmail] = useState<TargetEmail | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadTargetEmail();
  }, [isAuthenticated, navigate]);

  const loadTargetEmail = async () => {
    try {
      setLoading(true);
      const target = await apiClient.getTargetEmail();
      setTargetEmail(target);
      setEmail(target.email);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load target email');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setRequesting(true);
      await apiClient.requestVerification(email.trim());
      toast.success('Verification email sent! Check your inbox.');
      loadTargetEmail();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request verification');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Target Email Settings</CardTitle>
            <CardDescription>
              Configure the email address where forwarded emails will be sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {targetEmail && (
              <div className="space-y-2">
                <Label>Current Target Email</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono bg-slate-100 px-3 py-2 rounded">
                    {targetEmail.email}
                  </code>
                  <Badge variant={targetEmail.verified ? 'default' : 'secondary'}>
                    {targetEmail.verified ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Not Verified
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
              />
              <p className="text-sm text-muted-foreground">
                Enter the email address where you want to receive forwarded emails
              </p>
            </div>

            {targetEmail && !targetEmail.verified && (
              <Alert>
                <AlertDescription>
                  Your email is not verified. Please check your inbox and click the verification link.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleRequestVerification}
              className="w-full"
              disabled={requesting || !email.trim()}
            >
              {requesting ? 'Sending...' : targetEmail?.verified ? 'Update Email' : 'Request Verification'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

