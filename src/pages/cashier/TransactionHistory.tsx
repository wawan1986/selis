
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PosLayout from '@/components/layouts/PosLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  cashPrice: number;
  qrisPrice: number;
}

interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'qris';
  timestamp: string;
  storeId: string;
  cashierId: string;
}

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  useEffect(() => {
    // Check if a transaction ID was passed in the URL
    const transactionId = searchParams.get('transactionId');
    if (transactionId) {
      setHighlightedTransactionId(transactionId);
    }
    
    // Load transactions from localStorage (in a real app, this would be from an API)
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions: Transaction[] = JSON.parse(savedTransactions);
      
      // Filter transactions for this store
      const storeTransactions = parsedTransactions.filter(
        transaction => transaction.storeId === user?.storeId
      );
      
      // Sort by timestamp (newest first)
      storeTransactions.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setTransactions(storeTransactions);
      
      // If there's a highlighted transaction, find and select it
      if (transactionId) {
        const transaction = storeTransactions.find(t => t.id === transactionId);
        if (transaction) {
          setSelectedTransaction(transaction);
        }
      }
    }
  }, [searchParams, user?.storeId]);

  // Filter transactions based on search term and date filter
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const transactionDate = new Date(transaction.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let matchesDate = true;
    
    if (dateFilter === 'today') {
      matchesDate = transactionDate >= today;
    } else if (dateFilter === 'yesterday') {
      matchesDate = transactionDate >= yesterday && transactionDate < today;
    } else if (dateFilter === 'thisWeek') {
      matchesDate = transactionDate >= thisWeekStart;
    } else if (dateFilter === 'thisMonth') {
      matchesDate = transactionDate >= thisMonthStart;
    }
    
    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + transactionsPerPage
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <PosLayout>
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold">Transaction History</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <Select 
                value={dateFilter}
                onValueChange={setDateFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 pl-4">ID</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-center p-2">Payment</th>
                        <th className="text-right p-2 pr-4">Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.length > 0 ? (
                        paginatedTransactions.map(transaction => (
                          <tr 
                            key={transaction.id} 
                            className={`border-t cursor-pointer hover:bg-muted/50 ${
                              transaction.id === highlightedTransactionId ? 'bg-primary/10' : ''
                            }`}
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <td className="p-2 pl-4 font-mono text-sm">{transaction.id.substring(3, 10)}</td>
                            <td className="p-2">{formatTimestamp(transaction.timestamp)}</td>
                            <td className="text-right p-2">Rp {transaction.total.toLocaleString()}</td>
                            <td className="text-center p-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                transaction.paymentMethod === 'cash'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.paymentMethod === 'cash' ? 'Cash' : 'QRIS'}
                              </span>
                            </td>
                            <td className="text-right p-2 pr-4">
                              {transaction.items.reduce((total, item) => total + item.quantity, 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted-foreground">
                            No transactions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {totalPages > 1 && (
                  <div className="py-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => (
                          <PaginationItem key={i + 1}>
                            <PaginationLink
                              isActive={currentPage === i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full md:w-80 lg:w-96">
            {selectedTransaction ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Receipt</CardTitle>
                      <CardDescription>
                        {formatTimestamp(selectedTransaction.timestamp)}
                      </CardDescription>
                    </div>
                    <span className="font-mono text-sm">
                      {selectedTransaction.id}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-t border-dashed my-2"></div>
                  
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between py-1">
                      <div>
                        <div>{item.name} × {item.quantity}</div>
                        <div className="text-sm text-muted-foreground">
                          @ Rp {(selectedTransaction.paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-medium">
                        Rp {((selectedTransaction.paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-dashed my-2"></div>
                  
                  <div className="flex justify-between py-1">
                    <div className="text-muted-foreground">Payment Method</div>
                    <div className="font-medium">
                      {selectedTransaction.paymentMethod === 'cash' ? 'Cash' : 'QRIS'}
                    </div>
                  </div>
                  
                  <div className="flex justify-between py-1">
                    <div className="font-bold">Total</div>
                    <div className="font-bold">
                      Rp {selectedTransaction.total.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedTransaction(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center text-center p-8">
                  <p className="text-muted-foreground mb-2">
                    Select a transaction to view details
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/pos')}
                  >
                    Return to POS
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PosLayout>
  );
};

export default TransactionHistory;
