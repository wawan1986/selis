
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PosLayout from '@/components/layouts/PosLayout';
import { useAuth } from '@/context/AuthContext';
import { usePwa } from '@/context/PwaContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Minus, Trash, CreditCard } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  cashPrice: number;
  qrisPrice: number;
  categoryId: string;
  categoryName: string;
  image?: string;
  stock: number;
}

interface CartItem extends MenuItem {
  quantity: number;
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

const POSInterface: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { networkStatus, addPendingOperation } = usePwa();
  const { toast } = useToast();

  // Mock categories and menu items
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: '1', name: 'Drinks' },
    { id: '2', name: 'Food' },
    { id: '3', name: 'Snacks' },
  ]);
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { 
      id: '1', 
      name: 'Iced Coffee', 
      description: 'Cold brewed coffee with ice', 
      cashPrice: 20000, 
      qrisPrice: 22000, 
      categoryId: '1',
      categoryName: 'Drinks',
      stock: 10
    },
    { 
      id: '2', 
      name: 'Hot Coffee', 
      description: 'Freshly brewed hot coffee', 
      cashPrice: 18000, 
      qrisPrice: 20000, 
      categoryId: '1',
      categoryName: 'Drinks',
      stock: 15
    },
    { 
      id: '3', 
      name: 'Sandwich', 
      description: 'Chicken sandwich with veggies', 
      cashPrice: 25000, 
      qrisPrice: 27500, 
      categoryId: '2',
      categoryName: 'Food',
      stock: 8
    },
    { 
      id: '4', 
      name: 'French Fries', 
      description: 'Crispy potato fries', 
      cashPrice: 15000, 
      qrisPrice: 16500, 
      categoryId: '3',
      categoryName: 'Snacks',
      stock: 12
    },
  ]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [isHolidayMode, setIsHolidayMode] = useState(false);

  useEffect(() => {
    // Check if this store is in holiday mode
    // For demo, we'll use localStorage
    const holidayMode = localStorage.getItem(`holidayMode-${user?.storeId}`) === 'true';
    setIsHolidayMode(holidayMode);
    
    if (holidayMode) {
      toast({
        title: "Holiday Mode Active",
        description: "This store is currently in holiday mode. Transactions are disabled.",
        variant: "destructive",
      });
    }
    
    // In a real app, fetch menu items from the API with current stock levels
    // For demo, we'll load from localStorage if available
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
      setMenuItems(JSON.parse(savedMenuItems));
    }
    
    // Load categories
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    
    // Set the first category as active
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, []);

  // Filter menu items based on active category and search term
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = !activeCategory || item.categoryId === activeCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast({
        title: "Out of stock",
        description: `${item.name} is out of stock.`,
        variant: "destructive",
      });
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Check stock before increasing quantity
        if (existingItem.quantity >= item.stock) {
          toast({
            title: "Stock limit reached",
            description: `Only ${item.stock} ${item.name} available in stock.`,
            variant: "destructive",
          });
          return prevCart;
        }
        
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    // Check stock limit
    const item = menuItems.find(item => item.id === itemId);
    if (item && newQuantity > item.stock) {
      toast({
        title: "Stock limit reached",
        description: `Only ${item.stock} ${item.name} available in stock.`,
        variant: "destructive",
      });
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleCheckout = async () => {
    if (isHolidayMode) {
      toast({
        title: "Cannot process transaction",
        description: "This store is in holiday mode. Transactions are disabled.",
        variant: "destructive",
      });
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create transaction record
      const transaction: Transaction = {
        id: `TR-${Date.now()}`,
        items: cart,
        total: calculateTotal(),
        paymentMethod,
        timestamp: new Date().toISOString(),
        storeId: user?.storeId || '',
        cashierId: user?.id || '',
      };
      
      // Update stock levels
      const updatedMenuItems = menuItems.map(item => {
        const cartItem = cart.find(cartItem => cartItem.id === item.id);
        if (cartItem) {
          return {
            ...item,
            stock: item.stock - cartItem.quantity
          };
        }
        return item;
      });
      
      // In a real app, this would be sent to an API
      // For demo, we'll save to localStorage
      const savedTransactions = localStorage.getItem('transactions') || '[]';
      const transactions = JSON.parse(savedTransactions);
      transactions.push(transaction);
      localStorage.setItem('transactions', JSON.stringify(transactions));
      localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
      
      // If offline, queue the operation for sync
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'CREATE_TRANSACTION',
          data: transaction
        });
        
        addPendingOperation({
          type: 'UPDATE_STOCK',
          data: {
            items: cart.map(item => ({
              id: item.id,
              quantity: item.quantity
            }))
          }
        });
      }
      
      // Update the menu items state
      setMenuItems(updatedMenuItems);
      
      toast({
        title: "Transaction complete",
        description: `Total: Rp ${calculateTotal().toLocaleString()}`,
      });
      
      // Navigate to transaction history with the new transaction
      navigate(`/pos/history?transactionId=${transaction.id}`);
    } catch (error) {
      toast({
        title: "Error processing transaction",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error('Error processing transaction:', error);
    }
  };

  return (
    <PosLayout>
      <div className="h-full flex flex-col lg:flex-row">
        {/* Left side - Menu items */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto lg:max-w-[60%]">
          <div className="mb-4 flex flex-col">
            <Input
              className="mb-4"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="flex overflow-x-auto py-2 space-x-2">
              <Button
                variant={!activeCategory ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => setActiveCategory(null)}
              >
                All Items
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          
          {isHolidayMode && (
            <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md mb-4 text-center">
              <p className="font-bold">Holiday Mode Active</p>
              <p className="text-sm">Transactions are currently disabled for this store.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map(item => (
              <Card 
                key={item.id} 
                className={`${item.stock <= 0 ? 'opacity-50' : ''}`}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-sm text-muted-foreground mb-1">{item.description}</p>
                  <div className="flex justify-between text-sm">
                    <span>Cash: Rp {item.cashPrice.toLocaleString()}</span>
                    <span>QRIS: Rp {item.qrisPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-xs mt-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full inline-block">
                    Stock: {item.stock}
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0">
                  <Button 
                    onClick={() => addToCart(item)}
                    className="w-full"
                    disabled={item.stock <= 0 || isHolidayMode}
                  >
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {filteredMenuItems.length === 0 && (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground">No items found.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Cart */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center border-b pb-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Rp {(paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-8 text-center">{item.quantity}</span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            
            <div className="p-4 border-t">
              <div className="flex justify-between mb-2">
                <span>Payment Method</span>
                <div className="space-x-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    Cash
                  </Button>
                  <Button
                    variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('qris')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    QRIS
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between py-2 border-t">
                <span className="font-bold">Total</span>
                <span className="font-bold">Rp {calculateTotal().toLocaleString()}</span>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={clearCart}
                >
                  Clear
                </Button>
                <Button 
                  className="flex-1" 
                  disabled={cart.length === 0 || isHolidayMode}
                  onClick={() => setShowPaymentDialog(true)}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Payment confirmation dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Review the items and payment details before confirming.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p>{item.name} × {item.quantity}</p>
                    <p className="text-sm text-muted-foreground">
                      Rp {(paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice).toLocaleString()} each
                    </p>
                  </div>
                  <p className="font-medium">
                    Rp {((paymentMethod === 'cash' ? item.cashPrice : item.qrisPrice) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between py-2 border-t">
              <span className="font-bold">Total</span>
              <span className="font-bold">Rp {calculateTotal().toLocaleString()}</span>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">
                Payment Method: {paymentMethod === 'cash' ? 'Cash' : 'QRIS'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PosLayout>
  );
};

export default POSInterface;
