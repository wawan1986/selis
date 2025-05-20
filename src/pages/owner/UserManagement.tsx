
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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

interface Branch {
  id: string;
  name: string;
}

interface Store {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'cashier';
  branchId: string;
  branchName: string;
  storeId: string;
  storeName: string;
}

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [formData, setFormData] = useState<Omit<User, 'id' | 'branchName' | 'storeName'>>({
    name: '',
    email: '',
    role: 'cashier',
    branchId: '',
    storeId: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);

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
    
    // Load users
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  useEffect(() => {
    // Filter stores based on selected branch
    if (formData.branchId) {
      const branchStores = stores.filter(store => store.branchId === formData.branchId);
      setFilteredStores(branchStores);
      
      // If the selected store doesn't belong to the selected branch, reset it
      if (formData.storeId && !branchStores.some(store => store.id === formData.storeId)) {
        setFormData(prev => ({
          ...prev,
          storeId: branchStores.length > 0 ? branchStores[0].id : ''
        }));
      }
    } else {
      setFilteredStores([]);
      setFormData(prev => ({
        ...prev,
        storeId: ''
      }));
    }
  }, [formData.branchId, stores]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.branchId || !formData.storeId) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedBranch = branches.find(branch => branch.id === formData.branchId);
      const selectedStore = stores.find(store => store.id === formData.storeId);
      
      if (!selectedBranch || !selectedStore) {
        toast({
          title: "Invalid selection",
          description: "Please select a valid branch and store.",
          variant: "destructive",
        });
        return;
      }
      
      if (isEditing && currentUserId) {
        // Update existing user
        const updatedUsers = users.map(user =>
          user.id === currentUserId
            ? { 
                ...user, 
                ...formData,
                branchName: selectedBranch.name,
                storeName: selectedStore.name
              }
            : user
        );
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'UPDATE_USER',
            data: { 
              id: currentUserId, 
              ...formData, 
              branchName: selectedBranch.name,
              storeName: selectedStore.name
            }
          });
        }
        
        toast({
          title: "User updated",
          description: "User information has been updated successfully."
        });
      } else {
        // Check for duplicate email
        if (users.some(user => user.email.toLowerCase() === formData.email.toLowerCase())) {
          toast({
            title: "Email already in use",
            description: "This email address is already registered.",
            variant: "destructive",
          });
          return;
        }
        
        // Create new user
        const newUser: User = {
          id: `user-${Date.now()}`,
          ...formData,
          branchName: selectedBranch.name,
          storeName: selectedStore.name
        };
        
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        if (networkStatus === 'offline') {
          addPendingOperation({
            type: 'CREATE_USER',
            data: newUser
          });
        }
        
        toast({
          title: "User created",
          description: "New user has been added successfully. The default password is 'password'."
        });
      }
      
      // Reset form and state
      setFormData({
        name: '',
        email: '',
        role: 'cashier',
        branchId: '',
        storeId: '',
      });
      setIsEditing(false);
      setCurrentUserId(null);
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error saving user",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      storeId: user.storeId,
    });
    setIsEditing(true);
    setCurrentUserId(user.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    try {
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'DELETE_USER',
          data: { id: userId }
        });
      }
      
      toast({
        title: "User deleted",
        description: "User has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
      console.error('Error deleting user:', error);
    }
  };

  return (
    <AdminLayout title="User Management">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              if (branches.length === 0 || stores.length === 0) {
                toast({
                  title: "Setup required",
                  description: "Please create at least one branch and store before adding users.",
                  variant: "destructive",
                });
                return;
              }
              
              setFormData({
                name: '',
                email: '',
                role: 'cashier',
                branchId: '',
                storeId: '',
              });
              setIsEditing(false);
              setCurrentUserId(null);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                Fill in the details for the user. All fields are required.
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
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  className="col-span-3"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange('role', value)}
                  value={formData.role}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch" className="text-right">
                  Branch
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange('branchId', value)}
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
                <Label htmlFor="store" className="text-right">
                  Store
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange('storeId', value)}
                  value={formData.storeId}
                  disabled={!formData.branchId || filteredStores.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Update' : 'Add'} User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {branches.length === 0 || stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">You need to create branches and stores before adding users.</p>
          <div className="flex space-x-4">
            {branches.length === 0 && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/branches'}
              >
                Go to Branch Management
              </Button>
            )}
            {stores.length === 0 && (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin/stores'}
              >
                Go to Store Management
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {users.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
                      <TableCell>{user.branchName}</TableCell>
                      <TableCell>{user.storeName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <p className="text-muted-foreground mb-4">No users created yet</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      role: 'cashier',
                      branchId: branches.length > 0 ? branches[0].id : '',
                      storeId: '',
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
};

export default UserManagement;
