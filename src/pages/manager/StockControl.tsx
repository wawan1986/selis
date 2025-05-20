
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { usePwa } from '@/context/PwaContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  initialStock: number;
  storeId: string;
}

interface Store {
  id: string;
  name: string;
  branchId: string;
}

interface StoreStock {
  id: string;
  storeId: string;
  stockItemId: string;
  quantity: number;
  isActive: boolean;
  sellingDate: string;
}

const StockControl: React.FC = () => {
  const { user } = useAuth();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStartSellingDialog, setShowStartSellingDialog] = useState(false);
  const [showEndSellingDialog, setShowEndSellingDialog] = useState(false);
  const [sellingStartedStores, setSellingStartedStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user?.branchId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stores for the manager's branch
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, branch_id')
          .eq('branch_id', user.branchId);
        
        if (storeError) throw storeError;
        
        if (storeData) {
          setStores(storeData);
          
          // Filter stores for manager's branch
          const managerStores = storeData.filter((store: Store) => 
            store.branchId === user.branchId
          );
          setUserStores(managerStores);
          
          // Set first store as default if none selected
          if (managerStores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(managerStores[0].id);
          }
        }
        
        // Fetch stock items
        const { data: stockItemsData, error: stockItemsError } = await supabase
          .from('stock_items')
          .select('*');
        
        if (stockItemsError) throw stockItemsError;
        
        // Fetch current store stocks status (selling started stores)
        const { data: storeStocksData, error: storeStocksError } = await supabase
          .from('store_stocks')
          .select('store_id, is_active')
          .eq('is_active', true);
        
        if (storeStocksError) throw storeStocksError;
        
        // Determine which stores have selling started
        const activeStoreIds: string[] = [];
        if (storeStocksData) {
          storeStocksData.forEach((stockItem: any) => {
            if (stockItem.is_active && !activeStoreIds.includes(stockItem.store_id)) {
              activeStoreIds.push(stockItem.store_id);
            }
          });
          setSellingStartedStores(activeStoreIds);
        }
        
        if (stockItemsData) {
          // Transform to match our interface
          const formattedStockItems = stockItemsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            currentStock: item.current_stock,
            minimumStock: item.minimum_stock,
            initialStock: item.current_stock, // Use as initial stock for now
            storeId: ''  // This will be filled when fetching store specific stock
          }));
          setStockItems(formattedStockItems);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error fetching data",
          description: "Could not load stock data. Using cached data if available.",
          variant: "destructive"
        });
        
        // Use cached data as fallback
        const savedStores = localStorage.getItem('stores');
        if (savedStores) {
          const parsedStores = JSON.parse(savedStores);
          setStores(parsedStores);
          
          // Filter stores to only include those assigned to the manager's branch
          const managerStores = parsedStores.filter((store: Store) => 
            store.branchId === user.branchId
          );
          setUserStores(managerStores);
          
          // Set the first store as selected by default
          if (managerStores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(managerStores[0].id);
          }
        }
        
        // Load stock items
        const savedStockItems = localStorage.getItem('stockItems');
        if (savedStockItems) {
          setStockItems(JSON.parse(savedStockItems));
        }
        
        // Check selling status for each store
        const sellingStartedData = localStorage.getItem('sellingStartedStores');
        if (sellingStartedData) {
          setSellingStartedStores(JSON.parse(sellingStartedData));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.branchId]);
  
  // Effect to load store-specific stock when a store is selected
  useEffect(() => {
    if (!selectedStoreId) return;
    
    const fetchStoreStock = async () => {
      try {
        const { data: storeStocksData, error: storeStocksError } = await supabase
          .from('store_stocks')
          .select('id, store_id, stock_item_id, quantity, is_active')
          .eq('store_id', selectedStoreId)
          .eq('selling_date', new Date().toISOString().split('T')[0]);
        
        if (storeStocksError) throw storeStocksError;
        
        // Update stock items with store-specific stock levels
        if (storeStocksData && storeStocksData.length > 0) {
          const updatedStockItems = stockItems.map(item => {
            const storeStock = storeStocksData.find((ss: any) => ss.stock_item_id === item.id);
            if (storeStock) {
              return {
                ...item,
                currentStock: storeStock.quantity,
                storeId: selectedStoreId
              };
            }
            return item;
          });
          setStockItems(updatedStockItems);
        }
      } catch (error) {
        console.error('Error fetching store stock:', error);
      }
    };
    
    fetchStoreStock();
  }, [selectedStoreId, stockItems]);

  // Handle store selection change
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
  };

  // Get filtered stock items for the selected store
  const getStoreStockItems = () => {
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Check if selling has started for the selected store
  const isSellingStarted = (storeId: string) => {
    return sellingStartedStores.includes(storeId);
  };

  const handleStartSelling = async () => {
    if (!selectedStoreId) {
      toast({
        title: "Store not selected",
        description: "Please select a store first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Start a transaction for all the stock items
      const updatedItems = stockItems.map(item => ({
        ...item,
        currentStock: item.initialStock,
        storeId: selectedStoreId
      }));
      
      // For each stock item, create or update a store_stocks record
      for (const item of updatedItems) {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if a record already exists for today
        const { data: existingRecord, error: existingError } = await supabase
          .from('store_stocks')
          .select('id')
          .eq('store_id', selectedStoreId)
          .eq('stock_item_id', item.id)
          .eq('selling_date', today)
          .maybeSingle();
        
        if (existingError) throw existingError;
        
        if (existingRecord) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('store_stocks')
            .update({
              quantity: item.initialStock,
              is_active: true
            })
            .eq('id', existingRecord.id);
          
          if (updateError) throw updateError;
        } else {
          // Create new record
          const { error: insertError } = await supabase
            .from('store_stocks')
            .insert({
              store_id: selectedStoreId,
              stock_item_id: item.id,
              quantity: item.initialStock,
              is_active: true,
              selling_date: today
            });
          
          if (insertError) throw insertError;
        }
      }
      
      // Update local state
      setStockItems(updatedItems);
      setSellingStartedStores([...sellingStartedStores, selectedStoreId]);
      
      // Also update localStorage for offline fallback
      localStorage.setItem('stockItems', JSON.stringify(updatedItems));
      localStorage.setItem('sellingStartedStores', JSON.stringify([...sellingStartedStores, selectedStoreId]));
      
      // If offline, queue for sync
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'START_SELLING',
          data: {
            storeId: selectedStoreId,
            branchId: user?.branchId,
            items: updatedItems.filter(item => item.storeId === selectedStoreId),
            timestamp: new Date().toISOString()
          }
        });
      }
      
      toast({
        title: "Selling started",
        description: `Initial stock levels have been set for ${getStoreName(selectedStoreId)}.`,
      });
      
    } catch (error) {
      console.error('Error starting selling:', error);
      toast({
        title: "Error",
        description: "Could not start selling. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowStartSellingDialog(false);
    }
  };

  const handleEndSelling = async () => {
    if (!selectedStoreId) {
      toast({
        title: "Store not selected",
        description: "Please select a store first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update all store_stocks records for this store to inactive
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('store_stocks')
        .update({ is_active: false })
        .eq('store_id', selectedStoreId)
        .eq('selling_date', today);
      
      if (error) throw error;
      
      // Set all items of the selected store to zero stock in our local state
      const updatedItems = stockItems.map(item => {
        if (item.storeId === selectedStoreId) {
          return {
            ...item,
            currentStock: 0
          };
        }
        return item;
      });
      
      setStockItems(updatedItems);
      
      // Update selling started stores
      const updatedSellingStarted = sellingStartedStores.filter(id => id !== selectedStoreId);
      setSellingStartedStores(updatedSellingStarted);
      
      // Save to localStorage for offline fallback
      localStorage.setItem('stockItems', JSON.stringify(updatedItems));
      localStorage.setItem('sellingStartedStores', JSON.stringify(updatedSellingStarted));
      
      // If offline, queue for sync
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'END_SELLING',
          data: {
            storeId: selectedStoreId,
            branchId: user?.branchId,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      toast({
        title: "Selling ended",
        description: `Stock levels have been reset to zero for ${getStoreName(selectedStoreId)}.`,
      });
      
    } catch (error) {
      console.error('Error ending selling:', error);
      toast({
        title: "Error",
        description: "Could not end selling. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowEndSellingDialog(false);
    }
  };

  const handleStockChange = async (itemId: string, newStock: number) => {
    // Validate input
    if (newStock < 0) {
      toast({
        title: "Invalid stock value",
        description: "Stock cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update the store_stocks record
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('store_stocks')
        .select('id')
        .eq('store_id', selectedStoreId)
        .eq('stock_item_id', itemId)
        .eq('selling_date', today)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('store_stocks')
          .update({
            quantity: newStock
          })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new record if doesn't exist
        const { error: insertError } = await supabase
          .from('store_stocks')
          .insert({
            store_id: selectedStoreId,
            stock_item_id: itemId,
            quantity: newStock,
            is_active: true,
            selling_date: today
          });
        
        if (insertError) throw insertError;
      }
      
      // Update local state
      const updatedItems = stockItems.map(item => 
        item.id === itemId ? 
          { ...item, currentStock: newStock, storeId: selectedStoreId } : 
          item
      );
      
      setStockItems(updatedItems);
      
      // Save to localStorage for offline fallback
      localStorage.setItem('stockItems', JSON.stringify(updatedItems));
      
      // If offline, queue for sync
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'UPDATE_STOCK_ITEM',
          data: {
            storeId: selectedStoreId,
            branchId: user?.branchId,
            itemId,
            newStock,
            timestamp: new Date().toISOString()
          }
        });
      }
      
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Could not update stock. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to get store name by id
  const getStoreName = (storeId: string): string => {
    const store = stores.find(store => store.id === storeId);
    return store ? store.name : 'Unknown Store';
  };

  return (
    <PosLayout>
      <div className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Stock Management</h1>
            <p className="text-muted-foreground">
              Manage stock levels for your stores
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {selectedStoreId && !isSellingStarted(selectedStoreId) ? (
              <Button 
                onClick={() => setShowStartSellingDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Selling for {getStoreName(selectedStoreId)}
              </Button>
            ) : selectedStoreId && (
              <Button 
                onClick={() => setShowEndSellingDialog(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                End Selling for {getStoreName(selectedStoreId)}
              </Button>
            )}
          </div>
        </div>
        
        {/* Store selection dropdown */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-64">
            <Select
              value={selectedStoreId}
              onValueChange={handleStoreChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {userStores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name} 
                    {isSellingStarted(store.id) ? " (Selling)" : " (Not Selling)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Input
              placeholder="Search stock items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <p className="text-muted-foreground">Loading stock data...</p>
          </div>
        ) : selectedStoreId ? (
          <Card>
            <CardHeader>
              <CardTitle>Stock Items for {getStoreName(selectedStoreId)}</CardTitle>
              <CardDescription>
                {isSellingStarted(selectedStoreId) 
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
                      <th className="text-right p-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getStoreStockItems().length > 0 ? (
                      getStoreStockItems().map((item) => (
                        <tr 
                          key={item.id} 
                          className={`border-t ${
                            isSellingStarted(selectedStoreId) && item.currentStock < item.minimumStock
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : ''
                          }`}
                        >
                          <td className="p-2 pl-4">{item.name}</td>
                          <td className="text-center p-2">
                            {isSellingStarted(selectedStoreId) ? (
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
                            {isSellingStarted(selectedStoreId) && item.currentStock < item.minimumStock && (
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
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">Please select a store to manage stock</p>
          </div>
        )}
      </div>
      
      {/* Start Selling Dialog */}
      <Dialog open={showStartSellingDialog} onOpenChange={setShowStartSellingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Selling</DialogTitle>
            <DialogDescription>
              This will set all items for {getStoreName(selectedStoreId)} to their initial stock levels. Are you sure you want to start selling for today?
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
              This will reset all stock levels for {getStoreName(selectedStoreId)} to zero. Are you sure you want to end selling for today?
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
