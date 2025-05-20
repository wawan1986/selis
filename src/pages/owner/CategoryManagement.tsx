
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Edit, Trash } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
}

const CategoryManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Omit<Category, 'id'>>({
    name: '',
    description: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    const savedCategories = localStorage.getItem('categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({
        title: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && currentCategoryId) {
        // Update existing category
        const updatedCategories = categories.map(category =>
          category.id === currentCategoryId
            ? { ...category, ...formData }
            : category
        );
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_CATEGORY',
            data: { id: currentCategoryId, ...formData }
          });
        }
        
        toast({
          title: "Category updated",
          description: "Category has been updated successfully."
        });
      } else {
        // Create new category
        const newCategory: Category = {
          id: `category-${Date.now()}`,
          ...formData
        };
        
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        localStorage.setItem('categories', JSON.stringify(updatedCategories));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_CATEGORY',
            data: newCategory
          });
        }
        
        toast({
          title: "Category created",
          description: "New category has been added successfully."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        description: '',
      });
      setIsEditing(false);
      setCurrentCategoryId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving category",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsEditing(true);
    setCurrentCategoryId(category.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    try {
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_CATEGORY',
          data: { id: categoryId }
        });
      }
      
      toast({
        title: "Category deleted",
        description: "Category has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting category",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting category:', error);
    }
  };

  return (
    <AdminLayout title="Category Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Categories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                name: '',
                description: '',
              });
              setIsEditing(false);
              setCurrentCategoryId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the menu category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update' : 'Add'} Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No categories created yet</p>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  name: '',
                  description: ''
                });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Category
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoryManagement;
