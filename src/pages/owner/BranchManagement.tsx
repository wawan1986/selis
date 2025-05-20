
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

interface Branch {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
}

const BranchManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState<Omit<Branch, 'id'>>({
    name: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // In a real app, this would be an API call
    const savedBranches = localStorage.getItem('branches');
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches));
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
    if (!formData.name || !formData.address) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && currentBranchId) {
        // Update existing branch
        const updatedBranches = branches.map(branch =>
          branch.id === currentBranchId
            ? { ...branch, ...formData }
            : branch
        );
        setBranches(updatedBranches);
        localStorage.setItem('branches', JSON.stringify(updatedBranches));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_BRANCH',
            data: { id: currentBranchId, ...formData }
          });
        }
        
        toast({
          title: "Branch updated",
          description: "Branch information has been updated successfully."
        });
      } else {
        // Create new branch
        const newBranch: Branch = {
          id: `branch-${Date.now()}`,
          ...formData
        };
        
        const updatedBranches = [...branches, newBranch];
        setBranches(updatedBranches);
        localStorage.setItem('branches', JSON.stringify(updatedBranches));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_BRANCH',
            data: newBranch
          });
        }
        
        toast({
          title: "Branch created",
          description: "New branch has been added successfully."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
      });
      setIsEditing(false);
      setCurrentBranchId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving branch",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving branch:', error);
    }
  };

  const handleEdit = (branch: Branch) => {
    setFormData({
      name: branch.name,
      address: branch.address,
      contactPerson: branch.contactPerson,
      contactPhone: branch.contactPhone,
    });
    setIsEditing(true);
    setCurrentBranchId(branch.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (branchId: string) => {
    try {
      const updatedBranches = branches.filter(branch => branch.id !== branchId);
      setBranches(updatedBranches);
      localStorage.setItem('branches', JSON.stringify(updatedBranches));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_BRANCH',
          data: { id: branchId }
        });
      }
      
      toast({
        title: "Branch deleted",
        description: "Branch has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting branch",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting branch:', error);
    }
  };

  return (
    <AdminLayout title="Branch Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Branches</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                name: '',
                address: '',
                contactPerson: '',
                contactPhone: '',
              });
              setIsEditing(false);
              setCurrentBranchId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the branch. Fields marked with * are required.
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
                <Label htmlFor="contactPerson" className="text-right">
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  className="col-span-3"
                  value={formData.contactPerson}
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
                {isEditing ? 'Update' : 'Add'} Branch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.length > 0 ? (
          branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader>
                <CardTitle>{branch.name}</CardTitle>
                <CardDescription>{branch.address}</CardDescription>
              </CardHeader>
              <CardContent>
                {branch.contactPerson && (
                  <p className="text-sm">Contact: {branch.contactPerson}</p>
                )}
                {branch.contactPhone && (
                  <p className="text-sm">Phone: {branch.contactPhone}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(branch)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(branch.id)}>
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No branches created yet</p>
            <Button
              variant="outline"
              onClick={() => {
                setFormData({
                  name: '',
                  address: '',
                  contactPerson: '',
                  contactPhone: ''
                });
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Branch
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BranchManagement;
