
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/context/PwaContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  items: any[];
  total: number;
  paymentMethod: string;
  timestamp: string;
  storeId: string;
  storeName?: string;
  cashierId: string;
}

interface Store {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
}

const ManagerSalesReport: React.FC = () => {
  const { user } = useAuth();
  const { networkStatus } = usePwa();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stores for this manager's branch
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('id, name, branch_id, branches(name)')
          .eq('branch_id', user.branchId || '')
          .order('name');

        if (storeError) {
          throw storeError;
        }

        if (storeData) {
          const formattedStores = storeData.map(store => ({
            id: store.id,
            name: store.name,
            branchId: store.branch_id,
            branchName: store.branches?.name || 'Unknown Branch'
          }));
          setStores(formattedStores);
        }

        // Fetch transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            id, 
            total_amount, 
            payment_method, 
            transaction_date, 
            store_id,
            cashier_id,
            stores(name),
            transaction_items(
              id,
              menu_item_id,
              quantity,
              price_per_unit,
              total_price
            )
          `)
          .order('transaction_date', { ascending: false });

        if (transactionError) {
          throw transactionError;
        }

        if (transactionData) {
          // Format transactions to match our interface
          const formattedTransactions = transactionData.map(tx => ({
            id: tx.id,
            total: tx.total_amount,
            paymentMethod: tx.payment_method,
            timestamp: tx.transaction_date,
            storeId: tx.store_id,
            storeName: tx.stores?.name || 'Unknown Store',
            cashierId: tx.cashier_id,
            items: tx.transaction_items || []
          }));
          setTransactions(formattedTransactions);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load sales data. Using cached data if available.",
          variant: "destructive"
        });

        // Load from local storage as fallback
        const savedStores = localStorage.getItem('stores');
        if (savedStores) {
          const allStores = JSON.parse(savedStores);
          const branchStores = allStores.filter((store: Store) => store.branchId === user.branchId);
          setStores(branchStores);
        }
        
        const savedTransactions = localStorage.getItem('transactions');
        if (savedTransactions) {
          const parsedTransactions = JSON.parse(savedTransactions);
          const branchStoreIds = stores.map(store => store.id);
          const filteredTx = parsedTransactions.filter((tx: Transaction) => 
            branchStoreIds.includes(tx.storeId)
          ).map((transaction: Transaction) => {
            const store = stores.find(s => s.id === transaction.storeId);
            return {
              ...transaction,
              storeName: store?.name || 'Unknown Store',
            };
          });
          
          setTransactions(filteredTx);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  useEffect(() => {
    // Apply filters whenever filter criteria change
    filterTransactions();
  }, [transactions, selectedStore, dateRange]);

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Filter by store
    if (selectedStore !== 'all') {
      filtered = filtered.filter(transaction => transaction.storeId === selectedStore);
    }
    
    // Filter by date range
    const now = new Date();
    
    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(transaction => {
          const txDate = new Date(transaction.timestamp);
          return txDate.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
        });
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        filtered = filtered.filter(transaction => {
          const txDate = new Date(transaction.timestamp);
          return txDate.setHours(0, 0, 0, 0) === yesterday.setHours(0, 0, 0, 0);
        });
        break;
      case 'this-week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        filtered = filtered.filter(transaction => {
          const txDate = new Date(transaction.timestamp);
          return txDate >= weekStart && txDate <= weekEnd;
        });
        break;
      case 'this-month':
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        filtered = filtered.filter(transaction => {
          const txDate = new Date(transaction.timestamp);
          return txDate >= monthStart && txDate <= monthEnd;
        });
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        const lastMonthStart = startOfMonth(lastMonth);
        const lastMonthEnd = endOfMonth(lastMonth);
        filtered = filtered.filter(transaction => {
          const txDate = new Date(transaction.timestamp);
          return txDate >= lastMonthStart && txDate <= lastMonthEnd;
        });
        break;
      default:
        break;
    }
    
    setFilteredTransactions(filtered);
  };

  // Calculate summaries
  const totalSales = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const cashSales = filteredTransactions
    .filter(tx => tx.paymentMethod === 'cash')
    .reduce((sum, tx) => sum + tx.total, 0);
  const qrisSales = filteredTransactions
    .filter(tx => tx.paymentMethod === 'qris')
    .reduce((sum, tx) => sum + tx.total, 0);
  const transactionCount = filteredTransactions.length;
  const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;

  // Create data for charts
  const getStoreData = () => {
    const storeMap = new Map<string, number>();
    
    filteredTransactions.forEach(tx => {
      const storeName = tx.storeName || 'Unknown';
      const currentTotal = storeMap.get(storeName) || 0;
      storeMap.set(storeName, currentTotal + tx.total);
    });
    
    return Array.from(storeMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getPaymentMethodData = () => [
    { name: 'Cash', value: cashSales },
    { name: 'QRIS', value: qrisSales }
  ];

  return (
    <PosLayout>
      <div className="flex flex-col space-y-6 p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <h1 className="text-2xl font-bold">Branch Sales Report</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* Date range filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Store filter */}
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {totalSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {cashSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">QRIS Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {qrisSales.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactionCount}</div>
              <p className="text-xs text-muted-foreground">
                Avg. Rp {averageTransaction.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts and tables */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="charts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Store</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getStoreData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="value" fill="#6366F1" name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sales by Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPaymentMethodData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="value" fill="#10B981" name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">{tx.id}</TableCell>
                          <TableCell>{format(new Date(tx.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>{tx.storeName || 'Unknown'}</TableCell>
                          <TableCell className="capitalize">{tx.paymentMethod}</TableCell>
                          <TableCell>{tx.items.length} items</TableCell>
                          <TableCell className="text-right">Rp {tx.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8">
                    <p className="text-muted-foreground">No transactions found for the selected filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PosLayout>
  );
};

export default ManagerSalesReport;
