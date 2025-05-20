
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePwa } from '@/context/PwaContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { login, isAuthenticated, loading, error } = useAuth();
  const { installPrompt, promptInstall, isStandalone } = usePwa();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    if (isAuthenticated) {
      navigate('/');
    }
    
    // Show install prompt if available and not already installed
    if (installPrompt && !isStandalone) {
      setShowInstallPrompt(true);
    }
  }, [isAuthenticated, navigate, installPrompt, isStandalone]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">POS System Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            {showInstallPrompt && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full mt-2"
                onClick={promptInstall}
              >
                Install as App
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="text-center">Demo Accounts:</p>
        <p className="text-center">owner@example.com / password</p>
        <p className="text-center">manager@example.com / password</p>
        <p className="text-center">cashier@example.com / password</p>
      </div>
    </div>
  );
};

export default LoginPage;
