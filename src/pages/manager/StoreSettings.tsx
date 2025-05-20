
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePwa } from '@/context/PwaContext';

const StoreSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [holidayMode, setHolidayMode] = useState(false);

  useEffect(() => {
    // Check if store is in holiday mode
    const isHolidayMode = localStorage.getItem(`holidayMode-${user?.storeId}`) === 'true';
    setHolidayMode(isHolidayMode);
  }, [user?.storeId]);

  const handleHolidayModeToggle = (enabled: boolean) => {
    setHolidayMode(enabled);
    
    // Save to localStorage
    localStorage.setItem(`holidayMode-${user?.storeId}`, enabled ? 'true' : 'false');
    
    // If offline, queue the operation for sync
    if (networkStatus === 'offline') {
      addPendingOperation({
        type: 'UPDATE_HOLIDAY_MODE',
        data: {
          storeId: user?.storeId,
          branchId: user?.branchId,
          holidayMode: enabled,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    toast({
      title: enabled ? "Holiday mode enabled" : "Holiday mode disabled",
      description: enabled 
        ? "Transactions are now disabled for this store." 
        : "Transactions are now enabled for this store."
    });
  };

  return (
    <PosLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Store Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Store Operations</CardTitle>
            <CardDescription>
              Configure store operation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between space-x-2">
                <div>
                  <h3 className="font-medium">Holiday Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Disable all transactions for this store
                  </p>
                </div>
                <Switch 
                  checked={holidayMode} 
                  onCheckedChange={handleHolidayModeToggle}
                  aria-label="Toggle holiday mode"
                />
              </div>
              
              {holidayMode && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                  Holiday mode is active. All transactions are disabled.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>
              View store details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Store Name</h3>
              <p>{user?.storeName || 'Not assigned'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Branch</h3>
              <p>{user?.branchName || 'Not assigned'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Manager</h3>
              <p>{user?.name || 'Not assigned'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PosLayout>
  );
};

export default StoreSettings;
