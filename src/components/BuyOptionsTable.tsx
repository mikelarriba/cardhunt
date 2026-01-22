import { useState } from 'react';
import { ExternalLink, Plus, Pencil, Trash2, Store } from 'lucide-react';
import { BuyOption } from '@/types/database';
import { useBuyOptions } from '@/hooks/useBuyOptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SellerSelect } from './SellerSelect';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface BuyOptionsTableProps {
  cardId: string;
  readOnly?: boolean;
}

interface BuyOptionFormData {
  seller_id?: string;
  source_url: string;
  price: string;
  shipping_cost: string;
  notes: string;
}

const initialFormData: BuyOptionFormData = {
  seller_id: undefined,
  source_url: '',
  price: '',
  shipping_cost: '',
  notes: '',
};

export function BuyOptionsTable({ cardId, readOnly = false }: BuyOptionsTableProps) {
  const { buyOptions, isLoading, createBuyOption, updateBuyOption, deleteBuyOption } = useBuyOptions(cardId);
  const [showForm, setShowForm] = useState(false);
  const [editingOption, setEditingOption] = useState<BuyOption | null>(null);
  const [formData, setFormData] = useState<BuyOptionFormData>(initialFormData);

  // Find lowest total
  const lowestTotal = buyOptions.reduce((min, opt) => {
    const total = (opt.price || 0) + (opt.shipping_cost || 0);
    return total > 0 && (min === null || total < min) ? total : min;
  }, null as number | null);

  const openAddForm = () => {
    setFormData(initialFormData);
    setEditingOption(null);
    setShowForm(true);
  };

  const openEditForm = (option: BuyOption) => {
    setFormData({
      seller_id: option.seller_id || undefined,
      source_url: option.source_url || '',
      price: option.price?.toString() || '',
      shipping_cost: option.shipping_cost?.toString() || '',
      notes: option.notes || '',
    });
    setEditingOption(option);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const data = {
      seller_id: formData.seller_id,
      source_url: formData.source_url || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
      notes: formData.notes || undefined,
    };

    if (editingOption) {
      await updateBuyOption.mutateAsync({ id: editingOption.id, ...data });
    } else {
      await createBuyOption.mutateAsync(data);
    }

    setShowForm(false);
    setFormData(initialFormData);
    setEditingOption(null);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return `$${amount.toFixed(2)}`;
  };

  if (isLoading) {
    return <div className="py-4 text-muted-foreground text-sm">Loading buy options...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Buy Options
        </h3>
        {!readOnly && (
          <Button size="sm" onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-1" />
            Add Option
          </Button>
        )}
      </div>

      {buyOptions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <Store className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No buy options yet</p>
          {!readOnly && (
            <Button variant="link" onClick={openAddForm} className="mt-2">
              Add your first buy option
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Seller</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Shipping</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyOptions.map((option) => {
                const total = (option.price || 0) + (option.shipping_cost || 0);
                const isLowest = lowestTotal !== null && total === lowestTotal && total > 0;

                return (
                  <TableRow key={option.id} className="hover:bg-muted/30">
                    <TableCell>
                      {option.seller ? (
                        option.seller.url ? (
                          <a
                            href={option.seller.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {option.seller.name}
                          </a>
                        ) : (
                          <span className="font-medium">{option.seller.name}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                      {option.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{option.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(option.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(option.shipping_cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-semibold tabular-nums px-2 py-1 rounded',
                          isLowest && 'bg-emerald-500/20 text-emerald-500'
                        )}
                      >
                        {formatCurrency(total > 0 ? total : null)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {option.source_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8"
                          >
                            <a
                              href={option.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditForm(option)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Buy Option</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure? This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteBuyOption.mutate(option.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Edit Buy Option' : 'Add Buy Option'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seller</Label>
              <SellerSelect
                value={formData.seller_id}
                onChange={(id) => setFormData({ ...formData, seller_id: id })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping">Shipping ($)</Label>
                <Input
                  id="shipping"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                  placeholder="0.00"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source_url">Listing URL</Label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://ebay.com/itm/..."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="bg-background border-border resize-none"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createBuyOption.isPending || updateBuyOption.isPending}
            >
              {editingOption ? 'Update' : 'Add'} Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
