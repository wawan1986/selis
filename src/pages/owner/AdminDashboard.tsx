
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowRight } from 'lucide-react';

// Dummy data for the setup steps
const setupSteps = [
  { id: 'brand', label: 'Brand Setup', path: '/admin/brand', completed: false },
  { id: 'branches', label: 'Branch Management', path: '/admin/branches', completed: false },
  { id: 'stores', label: 'Store Management', path: '/admin/stores', completed: false },
  { id: 'categories', label: 'Menu Categories', path: '/admin/categories', completed: false },
  { id: 'menu', label: 'Menu Items', path: '/admin/menu', completed: false },
  { id: 'stock', label: 'Stock Items', path: '/admin/stock', completed: false },
  { id: 'users', label: 'User Management', path: '/admin/users', completed: false },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [steps, setSteps] = useState(setupSteps);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    // In a real app, we'd fetch the setup progress from an API
    // For demo purposes, we'll check localStorage
    const savedProgress = localStorage.getItem('setupProgress');
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      setSteps(steps.map(step => ({
        ...step,
        completed: parsedProgress[step.id] || false
      })));
      
      // Check if setup is complete
      const allComplete = Object.values(parsedProgress).every(val => val === true);
      setSetupComplete(allComplete);
    }
  }, []);

  const markStepComplete = (stepId: string) => {
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    );
    setSteps(updatedSteps);
    
    // Save progress to localStorage
    const progressObject = updatedSteps.reduce((acc, step) => ({
      ...acc,
      [step.id]: step.completed
    }), {});
    localStorage.setItem('setupProgress', JSON.stringify(progressObject));
    
    // Check if all steps are complete
    const allComplete = updatedSteps.every(step => step.completed);
    setSetupComplete(allComplete);
  };

  // Find the next incomplete step
  const nextIncompleteStep = steps.find(step => !step.completed);

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>
              {setupComplete 
                ? "Your POS system is fully configured and ready to use." 
                : "Let's set up your POS system by completing these steps in order."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!setupComplete && nextIncompleteStep && (
              <Alert className="mb-6 bg-primary/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Next Step: {nextIncompleteStep.label}</AlertTitle>
                <AlertDescription>
                  Please complete this step before proceeding to the next one.
                </AlertDescription>
                <Button 
                  className="mt-3" 
                  onClick={() => navigate(nextIncompleteStep.path)}
                >
                  Continue Setup
                </Button>
              </Alert>
            )}

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  className={`flex items-center justify-between p-4 rounded-md border ${
                    step.completed 
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900' 
                      : index === steps.findIndex(s => !s.completed) 
                        ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900' 
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <div 
                      className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : index === steps.findIndex(s => !s.completed)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{step.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.completed 
                          ? 'Completed' 
                          : index === steps.findIndex(s => !s.completed)
                            ? 'Current step'
                            : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={step.completed ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      navigate(step.path);
                      if (!step.completed && index === steps.findIndex(s => !s.completed)) {
                        markStepComplete(step.id);
                      }
                    }}
                  >
                    {step.completed ? 'Edit' : 'Start'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {setupComplete && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Today</CardTitle>
                <CardDescription>Total sales for today</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">Rp 0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
                <CardDescription>Active branches</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Stores</CardTitle>
                <CardDescription>Active stores</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
