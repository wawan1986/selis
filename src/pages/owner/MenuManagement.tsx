
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
  DialogClose
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Edit, Trash } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  cashPrice: number;
  qrisPrice: number;
  categoryId: string;
  categoryName: string;
}

const MenuManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'categoryName'>>({
    name: '',
    description: '',
    cashPrice: 0,
    qrisPrice: 0,
    categoryId: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Load categories
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    
    // Load menu items
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
      setMenuItems(JSON.parse(savedMenuItems));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'cashPrice' || name === 'qrisPrice') {
      const numValue = parseFloat(value);
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
  
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, categoryId: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.categoryId || formData.cashPrice <= 0 || formData.qrisPrice <= 0) {
      toast({
        title: "Missing or invalid fields",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (!selectedCategory) {
        toast({
          title: "Invalid category",
          description: "Please select a valid category.",
          variant: "destructive",
        });
        return;
      }
      
      if (isEditing && currentItemId) {
        // Update existing menu item
        const updatedMenuItems = menuItems.map(item =>
          item.id === currentItemId
            ? { 
                ...item, 
                ...formData,
                categoryName: selectedCategory.name
              }
            : item
        );
        setMenuItems(updatedMenuItems);
        localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_MENU_ITEM',
            data: { id: currentItemId, ...formData, categoryName: selectedCategory.name }
          });
        }
        
        toast({
          title: "Menu item updated",
          description: "Menu item has been updated successfully."
        });
      } else {
        // Create new menu item
        const newMenuItem: MenuItem = {
          id: `menu-${Date.now()}`,
          ...formData,
          categoryName: selectedCategory.name
        };
        
        const updatedMenuItems = [...menuItems, newMenuItem];
        setMenuItems(updatedMenuItems);
        localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_MENU_ITEM',
            data: newMenuItem
          });
        }
        
        toast({
          title: "Menu item created",
          description: "New menu item has been added successfully."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        description: '',
        cashPrice: 0,
        qrisPrice: 0,
        categoryId: '',
      });
      setIsEditing(false);
      setCurrentItemId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving menu item",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      cashPrice: item.cashPrice,
      qrisPrice: item.qrisPrice,
      categoryId: item.categoryId,
    });
    setIsEditing(true);
    setCurrentItemId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    try {
      const updatedMenuItems = menuItems.filter(item => item.id !== itemId);
      setMenuItems(updatedMenuItems);
      localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_MENU_ITEM',
          data: { id: itemId }
        });
      }
      
      toast({
        title: "Menu item deleted",
        description: "Menu item has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting menu item",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting menu item:', error);
    }
  };

  const filteredMenuItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.categoryId === activeCategory);

  return (
    <AdminLayout title="Menu Management">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (categories.length === 0) {
                toast({
                  title: "No categories available",
                  description: "Please create at least one category before adding menu items.",
                  variant: "destructive",
                });
                return;
              }
              
              setFormData({
                name: '',
                description: '',
                cashPrice: 0,
                qrisPrice: 0,
                categoryId: categories.length > 0 ? categories[0].id : '',
              });
              setIsEditing(false);
              setCurrentItemId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the menu item. All fields are required.
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
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  className="col-span-3"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  onValueChange={handleCategoryChange}
                  value={formData.categoryId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cashPrice" className="text-right">
                  Cash Price
                </Label>
                <Input
                  id="cashPrice"
                  name="cashPrice"
                  type="number"
                  className="col-span-3"
                  value={formData.cashPrice}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qrisPrice" className="text-right">
                  QRIS Price
                </Label>
                <Input
                  id="qrisPrice"
                  name="qrisPrice"
                  type="number"
                  className="col-span-3"
                  value={formData.qrisPrice}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update' : 'Add'} Menu Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No categories created yet. You need to create categories first.</p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/categories'}
          >
            Go to Category Management
          </Button>
        </div>
      ) : (
        <>
          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="overflow-x-auto">
              <TabsTrigger value="all" onClick={() => setActiveCategory('all')}>
                All Categories
              </TabsTrigger>
              {categories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.length > 0 ? (
              filteredMenuItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm font-medium">Cash Price</p>
                        <p>Rp {item.cashPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">QRIS Price</p>
                        <p>Rp {item.qrisPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-sm mt-2">
                      Category: {item.categoryName}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {activeCategory === 'all' 
                    ? 'No menu items created yet' 
                    : 'No menu items in this category yet'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: '',
                      description: '',
                      cashPrice: 0,
                      qrisPrice: 0,
                      categoryId: activeCategory === 'all' ? (categories.length > 0 ? categories[0].id : '') : activeCategory,
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Menu Item
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default MenuManagement;
