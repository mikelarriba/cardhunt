import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSellers } from '@/hooks/useSellers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SellerSelectProps {
  value?: string;
  onChange: (sellerId: string | undefined) => void;
}

export function SellerSelect({ value, onChange }: SellerSelectProps) {
  const { sellers, isLoading, createSeller } = useSellers();
  const [showNewSeller, setShowNewSeller] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerUrl, setNewSellerUrl] = useState('');

  const handleCreateSeller = async () => {
    if (!newSellerName.trim()) return;
    
    const result = await createSeller.mutateAsync({
      name: newSellerName,
      url: newSellerUrl || undefined,
    });
    
    onChange(result.id);
    setShowNewSeller(false);
    setNewSellerName('');
    setNewSellerUrl('');
  };

  const handleValueChange = (val: string) => {
    if (val === 'new') {
      setShowNewSeller(true);
    } else if (val === 'none') {
      onChange(undefined);
    } else {
      onChange(val);
    }
  };

  return (
    <>
      <Select value={value || 'none'} onValueChange={handleValueChange}>
        <SelectTrigger className="bg-background border-border">
          <SelectValue placeholder="Select seller..." />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border z-50">
          <SelectItem value="none">No seller</SelectItem>
          {sellers.map((seller) => (
            <SelectItem key={seller.id} value={seller.id}>
              {seller.name}
            </SelectItem>
          ))}
          <SelectItem value="new" className="text-primary">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Seller
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showNewSeller} onOpenChange={setShowNewSeller}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Seller</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seller-name">Seller Name *</Label>
              <Input
                id="seller-name"
                value={newSellerName}
                onChange={(e) => setNewSellerName(e.target.value)}
                placeholder="e.g., CardShop123"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller-url">eBay Store URL</Label>
              <Input
                id="seller-url"
                value={newSellerUrl}
                onChange={(e) => setNewSellerUrl(e.target.value)}
                placeholder="https://ebay.com/usr/..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSeller(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSeller}
              disabled={!newSellerName.trim() || createSeller.isPending}
            >
              {createSeller.isPending ? 'Creating...' : 'Create Seller'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
