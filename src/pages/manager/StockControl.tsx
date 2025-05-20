
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePwa } from '@/context/PwaContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  initialStock: number;
}

const StockControl: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStartSellingDialog, setShowStartSellingDialog] = useState(false);
  const [showEndSellingDialog, setShowEndSellingDialog] = useState(false);
  const [isSellingStarted, setIsSellingStarted] = useState(false);
  
  useEffect(() => {
    // In a real app, fetch from API
    // For demo, use mock data
    const mockStockItems = [
      { id: '1', name: 'Iced Coffee', currentStock: 0, minimumStock: 5, initialStock: 10 },
      { id: '2', name: 'Hot Coffee', currentStock: 0, minimumStock: 5, initialStock: 15 },
      { id: '3', name: 'Sandwich', currentStock: 0, minimumStock: 3, initialStock: 8 },
      { id: '4', name: 'French Fries', currentStock: 0, minimumStock: 4, initialStock: 12 },
    ];
    
    // Check if selling has started for today
    const sellingStarted = localStorage.getItem(`sellingStarted-${user?.storeId}`) === 'true';
    
    if (sellingStarted) {
      // Load current stock levels
      const savedStockItems = localStorage.getItem(`stockItems-${user?.storeId}`);
      if (savedStockItems) {
        setStockItems(JSON.parse(savedStockItems));
      } else {
        setStockItems(mockStockItems);
      }
      setIsSellingStarted(true);
    } else {
      setStockItems(mockStockItems);
      setIsSellingStarted(false);
    }
  }, [user?.storeId]);

  const filteredStockItems = stockItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartSelling = () => {
    // Set all items to their initial stock levels
    const updatedItems = stockItems.map(item => ({
      ...item,
      currentStock: item.initialStock
    }));
    
    setStockItems(updatedItems);
    setIsSellingStarted(true);
    
    // Save to localStorage
    localStorage.setItem(`stockItems-${user?.storeId}`, JSON.stringify(updatedItems));
    localStorage.setItem(`sellingStarted-${user?.storeId}`, 'true');
    
    // If offline, queue for sync
    if (networkStatus === 'offline') {
      addPendingOperation({
        type: 'START_SELLING',
        data: {
          storeId: user?.storeId,
          branchId: user?.branchId,
          items: updatedItems,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    toast({
      title: "Selling started",
      description: "Initial stock levels have been set for all items.",
    });
    
    setShowStartSellingDialog(false);
  };

  const handleEndSelling = () => {
    // Set all items to zero stock
    const updatedItems = stockItems.map(item => ({
      ...item,
      currentStock: 0
    }));
    
    setStockItems(updatedItems);
    setIsSellingStarted(false);
    
    // Save to localStorage
    localStorage.setItem(`stockItems-${user?.storeId}`, JSON.stringify(updatedItems));
    localStorage.setItem(`sellingStarted-${user?.storeId}`, 'false');
    
    // If offline, queue for sync
    if (networkStatus === 'offline') {
      addPendingOperation({
        type: 'END_SELLING',
        data: {
          storeId: user?.storeId,
          branchId: user?.branchId,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    toast({
      title: "Selling ended",
      description: "All stock levels have been reset to zero.",
    });
    
    setShowEndSellingDialog(false);
  };

  const handleStockChange = (itemId: string, newStock: number) => {
    // Validate input
    if (newStock < 0) {
      toast({
        title: "Invalid stock value",
        description: "Stock cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedItems = stockItems.map(item => 
      item.id === itemId ? { ...item, currentStock: newStock } : item
    );
    
    setStockItems(updatedItems);
    
    // Save to localStorage
    localStorage.setItem(`stockItems-${user?.storeId}`, JSON.stringify(updatedItems));
    
    // If offline, queue for sync
    if (networkStatus === 'offline') {
      addPendingOperation({
        type: 'UPDATE_STOCK_ITEM',
        data: {
          storeId: user?.storeId,
          branchId: user?.branchId,
          itemId,
          newStock,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return (
    <PosLayout>
      <div className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground">
              {isSellingStarted 
                ? "Update stock levels for today's operation." 
                : "Start selling to set initial stock levels."}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {!isSellingStarted ? (
              <Button 
                onClick={() => setShowStartSellingDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Selling
              </Button>
            ) : (
              <Button 
                onClick={() => setShowEndSellingDialog(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                End Selling
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          <Input
            placeholder="Search stock items..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Stock Items</CardTitle>
            <CardDescription>
              {isSellingStarted 
                ? "Current stock levels for today's operation." 
                : "Stock levels are currently set to zero. Start selling to initialize."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 pl-4">Item</th>
                    <th className="text-center p-2">Current Stock</th>
                    <th className="text-center p-2">Initial Stock</th>
                    <th className="text-center p-2">Minimum Stock</th>
                    <th className="text-right p-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockItems.length > 0 ? (
                    filteredStockItems.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={`border-t ${
                          isSellingStarted && item.currentStock < item.minimumStock
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : ''
                        }`}
                      >
                        <td className="p-2 pl-4">{item.name}</td>
                        <td className="text-center p-2">
                          {isSellingStarted ? (
                            <Input
                              type="number"
                              value={item.currentStock}
                              onChange={(e) => handleStockChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center mx-auto"
                              min="0"
                            />
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="text-center p-2">{item.initialStock}</td>
                        <td className="text-center p-2">{item.minimumStock}</td>
                        <td className="text-right p-2 pr-4">
                          {isSellingStarted && item.currentStock < item.minimumStock && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Low Stock
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted-foreground">
                        No items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Start Selling Dialog */}
      <Dialog open={showStartSellingDialog} onOpenChange={setShowStartSellingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Selling</DialogTitle>
            <DialogDescription>
              This will set all items to their initial stock levels. Are you sure you want to start selling for today?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartSellingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartSelling} className="bg-green-600 hover:bg-green-700">
              Start Selling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* End Selling Dialog */}
      <Dialog open={showEndSellingDialog} onOpenChange={setShowEndSellingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Selling</DialogTitle>
            <DialogDescription>
              This will reset all stock levels to zero. Are you sure you want to end selling for today?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndSellingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndSelling} className="bg-red-600 hover:bg-red-700">
              End Selling
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PosLayout>
  );
};

export default StockControl;
