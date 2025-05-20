
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePwa } from '@/context/PwaContext';

interface BrandData {
  name: string;
  slogan: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

const BrandSetup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { networkStatus, addPendingOperation } = usePwa();
  
  const [formData, setFormData] = useState<BrandData>({
    name: '',
    slogan: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });

  useEffect(() => {
    // In a real app, this would fetch from an API
    const savedBrandData = localStorage.getItem('brandData');
    if (savedBrandData) {
      setFormData(JSON.parse(savedBrandData));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      toast({
        title: "Brand name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real app, this would call an API
      localStorage.setItem('brandData', JSON.stringify(formData));
      
      // If offline, queue the operation for later sync
      if (networkStatus === 'offline') {
        addPendingOperation({
          type: 'UPDATE_BRAND',
          data: formData
        });
        
        toast({
          title: "Changes saved locally",
          description: "Your changes will sync when you're back online.",
        });
      } else {
        // In a real app, this would be an API call
        // Simulate an API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({
          title: "Brand setup saved",
          description: "Your brand information has been updated successfully.",
        });
      }
      
      // Mark the brand setup step as complete
      const savedProgress = localStorage.getItem('setupProgress') || '{}';
      const progress = JSON.parse(savedProgress);
      progress.brand = true;
      localStorage.setItem('setupProgress', JSON.stringify(progress));
      
      // Navigate to the next setup step
      navigate('/admin/branches');
    } catch (error) {
      toast({
        title: "Error saving brand setup",
        description: "Please try again.",
        variant: "destructive",
      });
      console.error('Error saving brand data:', error);
    }
  };

  return (
    <AdminLayout title="Brand Setup">
      <Card className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
            <CardDescription>
              Add your brand details that will appear on receipts and the POS interface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter your brand name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slogan">Brand Slogan</Label>
              <Input
                id="slogan"
                name="slogan"
                placeholder="Enter your brand slogan"
                value={formData.slogan}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a description of your business"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="contact@example.com"
                value={formData.contactEmail}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder="+62..."
                value={formData.contactPhone}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter your business address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save and Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  );
};

export default BrandSetup;
