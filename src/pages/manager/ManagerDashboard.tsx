
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleAlert } from 'lucide-react';

interface StockAlert {
  itemId: string;
  itemName: string;
  currentStock: number;
  minThreshold: number;
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [salesData, setSalesData] = useState({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    // In a real app, fetch these from an API
    // For demo, we'll use mock data
    
    // Mock stock alerts
    setStockAlerts([
      { itemId: '1', itemName: 'Iced Coffee', currentStock: 2, minThreshold: 5 },
      { itemId: '3', itemName: 'Sandwich', currentStock: 1, minThreshold: 3 },
    ]);
    
    // Mock sales data
    setSalesData({
      today: 250000,
      yesterday: 320000,
      thisWeek: 1750000,
      thisMonth: 7500000,
    });
  }, []);

  return (
    <PosLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {salesData.today.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yesterday's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {salesData.yesterday.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {salesData.thisWeek.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month's Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {salesData.thisMonth.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Items that are low in stock</CardDescription>
            </CardHeader>
            <CardContent>
              {stockAlerts.length > 0 ? (
                <div className="space-y-4">
                  {stockAlerts.map(alert => (
                    <div key={alert.itemId} className="flex items-start space-x-4 bg-amber-50 p-3 rounded-md">
                      <CircleAlert className="text-amber-500 h-5 w-5 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{alert.itemName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Current stock: {alert.currentStock} (Minimum: {alert.minThreshold})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No stock alerts at the moment.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for store management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = '/manager/stock'}
              >
                Manage Stock
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = '/manager/reports'}
              >
                View Sales Report
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = '/manager/settings'}
              >
                Store Settings
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = '/pos'}
              >
                Open POS Interface
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PosLayout>
  );
};

export default ManagerDashboard;
