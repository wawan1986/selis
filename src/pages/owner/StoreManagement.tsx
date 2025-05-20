
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
import { Plus, Edit, Trash } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  address: string;
  managerName?: string;
  contactPhone?: string;
}

const StoreManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<Omit<Store, 'id' | 'branchName'>>({
    name: '',
    branchId: '',
    address: '',
    managerName: '',
    contactPhone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Load branches
    const savedBranches = localStorage.getItem('branches');
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches));
    }
    
    // Load stores
    const savedStores = localStorage.getItem('stores');
    if (savedStores) {
      setStores(JSON.parse(savedStores));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleBranchChange = (value: string) => {
    setFormData(prev => ({ ...prev, branchId: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.branchId || !formData.address) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedBranch = branches.find(branch => branch.id === formData.branchId);
      if (!selectedBranch) {
        toast({
          title: "Invalid branch",
          description: "Please select a valid branch.",
          variant: "destructive",
        });
        return;
      }
      
      if (isEditing && currentStoreId) {
        // Update existing store
        const updatedStores = stores.map(store =>
          store.id === currentStoreId
            ? { 
                ...store, 
                ...formData,
                branchName: selectedBranch.name
              }
            : store
        );
        setStores(updatedStores);
        localStorage.setItem('stores', JSON.stringify(updatedStores));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_STORE',
            data: { id: currentStoreId, ...formData, branchName: selectedBranch.name }
          });
        }
        
        toast({
          title: "Store updated",
          description: "Store information has been updated successfully."
        });
      } else {
        // Create new store
        const newStore: Store = {
          id: `store-${Date.now()}`,
          ...formData,
          branchName: selectedBranch.name
        };
        
        const updatedStores = [...stores, newStore];
        setStores(updatedStores);
        localStorage.setItem('stores', JSON.stringify(updatedStores));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_STORE',
            data: newStore
          });
        }
        
        toast({
          title: "Store created",
          description: "New store has been added successfully."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        branchId: '',
        address: '',
        managerName: '',
        contactPhone: '',
      });
      setIsEditing(false);
      setCurrentStoreId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving store",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving store:', error);
    }
  };

  const handleEdit = (store: Store) => {
    setFormData({
      name: store.name,
      branchId: store.branchId,
      address: store.address,
      managerName: store.managerName || '',
      contactPhone: store.contactPhone || '',
    });
    setIsEditing(true);
    setCurrentStoreId(store.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (storeId: string) => {
    try {
      const updatedStores = stores.filter(store => store.id !== storeId);
      setStores(updatedStores);
      localStorage.setItem('stores', JSON.stringify(updatedStores));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_STORE',
          data: { id: storeId }
        });
      }
      
      toast({
        title: "Store deleted",
        description: "Store has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting store",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting store:', error);
    }
  };

  const getBranchStores = (branchId: string) => {
    return stores.filter(store => store.branchId === branchId);
  };

  return (
    <AdminLayout title="Store Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stores</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (branches.length === 0) {
                toast({
                  title: "No branches available",
                  description: "Please create at least one branch before adding a store.",
                  variant: "destructive",
                });
                return;
              }
              
              setFormData({
                name: '',
                branchId: '',
                address: '',
                managerName: '',
                contactPhone: '',
              });
              setIsEditing(false);
              setCurrentStoreId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Store' : 'Add New Store'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the store. Fields marked with * are required.
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
                <Label htmlFor="branch" className="text-right">
                  Branch *
                </Label>
                <Select
                  onValueChange={handleBranchChange}
                  value={formData.branchId}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address *
                </Label>
                <Input
                  id="address"
                  name="address"
                  className="col-span-3"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="managerName" className="text-right">
                  Manager
                </Label>
                <Input
                  id="managerName"
                  name="managerName"
                  className="col-span-3"
                  value={formData.managerName}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactPhone" className="text-right">
                  Contact Phone
                </Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  className="col-span-3"
                  value={formData.contactPhone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update' : 'Add'} Store
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No branches created yet. You need to create branches first.</p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin/branches'}
          >
            Go to Branch Management
          </Button>
        </div>
      ) : (
        <>
          {branches.map((branch) => {
            const branchStores = getBranchStores(branch.id);
            return (
              <div key={branch.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{branch.name}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchStores.length > 0 ? (
                    branchStores.map((store) => (
                      <Card key={store.id}>
                        <CardHeader>
                          <CardTitle>{store.name}</CardTitle>
                          <CardDescription>{store.address}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {store.managerName && (
                            <p className="text-sm">Manager: {store.managerName}</p>
                          )}
                          {store.contactPhone && (
                            <p className="text-sm">Phone: {store.contactPhone}</p>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(store)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(store.id)}>
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">No stores in this branch yet</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            name: '',
                            branchId: branch.id,
                            address: '',
                            managerName: '',
                            contactPhone: ''
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Store to {branch.name}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}
    </AdminLayout>
  );
};

export default StoreManagement;
