
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePwa } from '@/context/PwaContext';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
}

interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  linkedMenuItems: string[]; // Array of menu item IDs
}

const StockManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [formData, setFormData] = useState<Omit<StockItem, 'id' | 'linkedMenuItems'>>({
    name: '',
    currentStock: 0,
    minimumStock: 0,
    unit: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Load menu items
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
      const parsedMenuItems = JSON.parse(savedMenuItems);
      setMenuItems(parsedMenuItems.map((item: any) => ({ id: item.id, name: item.name })));
    }
    
    // Load stock items
    const savedStockItems = localStorage.getItem('stockItems');
    if (savedStockItems) {
      setStockItems(JSON.parse(savedStockItems));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'currentStock' || name === 'minimumStock') {
      const numValue = parseInt(value);
      setFormData(prevData => ({
        ...prevData,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const toggleMenuItemSelection = (menuItemId: string) => {
    setSelectedMenuItems(prev => {
      if (prev.includes(menuItemId)) {
        return prev.filter(id => id !== menuItemId);
      } else {
        return [...prev, menuItemId];
      }
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.unit || formData.minimumStock < 0) {
      toast({
        title: "Missing or invalid fields",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    try {      
      if (isEditing && currentItemId) {
        // Update existing stock item
        const updatedStockItems = stockItems.map(item =>
          item.id === currentItemId
            ? { 
                ...item, 
                ...formData,
                linkedMenuItems: selectedMenuItems
              }
            : item
        );
        setStockItems(updatedStockItems);
        localStorage.setItem('stockItems', JSON.stringify(updatedStockItems));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_STOCK_ITEM',
            data: { id: currentItemId, ...formData, linkedMenuItems: selectedMenuItems }
          });
        }
        
        toast({
          title: "Stock item updated",
          description: "Stock item has been updated successfully."
        });
      } else {
        // Create new stock item
        const newStockItem: StockItem = {
          id: `stock-${Date.now()}`,
          ...formData,
          linkedMenuItems: selectedMenuItems
        };
        
        const updatedStockItems = [...stockItems, newStockItem];
        setStockItems(updatedStockItems);
        localStorage.setItem('stockItems', JSON.stringify(updatedStockItems));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_STOCK_ITEM',
            data: newStockItem
          });
        }
        
        toast({
          title: "Stock item created",
          description: "New stock item has been added successfully."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        currentStock: 0,
        minimumStock: 0,
        unit: '',
      });
      setSelectedMenuItems([]);
      setIsEditing(false);
      setCurrentItemId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving stock item",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving stock item:', error);
    }
  };

  const handleEdit = (item: StockItem) => {
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
    });
    setSelectedMenuItems([...item.linkedMenuItems]);
    setIsEditing(true);
    setCurrentItemId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    try {
      const updatedStockItems = stockItems.filter(item => item.id !== itemId);
      setStockItems(updatedStockItems);
      localStorage.setItem('stockItems', JSON.stringify(updatedStockItems));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_STOCK_ITEM',
          data: { id: itemId }
        });
      }
      
      toast({
        title: "Stock item deleted",
        description: "Stock item has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting stock item",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting stock item:', error);
    }
  };

  const getLinkedMenuItemNames = (linkedIds: string[]) => {
    return menuItems
      .filter(item => linkedIds.includes(item.id))
      .map(item => item.name)
      .join(', ');
  };

  return (
    <AdminLayout title="Stock Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Items</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                name: '',
                currentStock: 0,
                minimumStock: 0,
                unit: '',
              });
              setSelectedMenuItems([]);
              setIsEditing(false);
              setCurrentItemId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stock Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Stock Item' : 'Add New Stock Item'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the stock item.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentStock" className="text-right">
                  Current Stock
                </Label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  className="col-span-3"
                  value={formData.currentStock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minimumStock" className="text-right">
                  Minimum Stock
                </Label>
                <Input
                  id="minimumStock"
                  name="minimumStock"
                  type="number"
                  className="col-span-3"
                  value={formData.minimumStock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">
                  Unit
                </Label>
                <Input
                  id="unit"
                  name="unit"
                  className="col-span-3"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="kg, liter, etc."
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right mt-2">
                  Menu Items
                </Label>
                <div className="col-span-3 border rounded-md p-3 max-h-40 overflow-y-auto">
                  {menuItems.length > 0 ? (
                    menuItems.map(item => (
                      <div key={item.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`menu-${item.id}`}
                          checked={selectedMenuItems.includes(item.id)}
                          onChange={() => toggleMenuItemSelection(item.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`menu-${item.id}`} className="text-sm">
                          {item.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No menu items available.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update' : 'Add'} Stock Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {stockItems.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Stock</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Linked Menu Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className={item.currentStock <= item.minimumStock ? "text-red-500 font-bold" : ""}>
                      {item.currentStock}
                    </TableCell>
                    <TableCell>{item.minimumStock}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{getLinkedMenuItemNames(item.linkedMenuItems)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No stock items created yet</p>
          <Button
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                currentStock: 0,
                minimumStock: 0,
                unit: '',
              });
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Stock Item
          </Button>
        </div>
      )}
    </AdminLayout>
  );
};

export default StockManagement;
