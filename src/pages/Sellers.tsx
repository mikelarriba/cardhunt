import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Store,
  ArrowLeft,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  ArrowUpDown,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useSellers } from '@/hooks/useSellers';
import { useSellerStats, SellerWithStats } from '@/hooks/useSellerStats';
import { AssignBuyOptionModal } from '@/components/AssignBuyOptionModal';
import { Seller } from '@/types/database';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortDir = 'asc' | 'desc';

const Sellers = () => {
  const { user, loading: authLoading } = useAuth();
  const { createSeller, updateSeller, deleteSeller } = useSellers();
  const { data: sellerStats = [], isLoading } = useSellerStats();

  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Seller form
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');

  // Assign buy option modal
  const [assignSeller, setAssignSeller] = useState<Seller | null>(null);

  const sortedSellers = useMemo(() => {
    let result = sellerStats.filter((s) => {
      if (!searchQuery) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [sellerStats, sortDir, searchQuery]);

  const openAddForm = () => {
    setEditingSeller(null);
    setFormName('');
    setFormUrl('');
    setShowForm(true);
  };

  const openEditForm = (seller: Seller) => {
    setEditingSeller(seller);
    setFormName(seller.name);
    setFormUrl(seller.url || '');
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!formName.trim()) return;
    if (editingSeller) {
      await updateSeller.mutateAsync({
        id: editingSeller.id,
        name: formName,
        url: formUrl || undefined,
      });
    } else {
      await createSeller.mutateAsync({
        name: formName,
        url: formUrl || undefined,
      });
    }
    setShowForm(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please sign in to view sellers.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sellers | Card Hunt</title>
        <meta name="description" content="Manage your card sellers and vendors." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/">
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </Button>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-gradient-gold">Sellers</h1>
                  <p className="text-xs text-muted-foreground">{sellerStats.length} seller{sellerStats.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button onClick={openAddForm} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Seller
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{sellerStats.length}</p>
              <p className="text-xs text-muted-foreground">Sellers</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-display font-bold text-primary">
                {sellerStats.reduce((sum, s) => sum + s.buy_option_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Buy Options</p>
            </div>
            <div className="glass-card p-4 text-center col-span-2 md:col-span-1">
              <p className="text-2xl font-display font-bold text-status-owned">
                ${sellerStats.reduce((sum, s) => sum + s.total_value, 0).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 mb-6">
            <Input
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm bg-background border-border"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="shrink-0"
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Name {sortDir === 'asc' ? 'A–Z' : 'Z–A'}
            </Button>
          </div>

          {/* Sellers Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : sortedSellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                <Store className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display font-semibold text-xl mb-2">
                {sellerStats.length === 0 ? 'No sellers yet' : 'No results'}
              </h2>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                {sellerStats.length === 0
                  ? 'Add your first seller to start tracking where you buy cards.'
                  : 'Try a different search term.'}
              </p>
              {sellerStats.length === 0 && (
                <Button onClick={openAddForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Seller
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-center">Buy Options</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                     <TableHead className="text-right">Avg Price</TableHead>
                     <TableHead className="text-right">Shipping Avg</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSellers.map((seller) => (
                    <TableRow key={seller.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <Link to={`/seller/${seller.id}`} className="font-medium hover:text-primary transition-colors">
                            {seller.name}
                          </Link>
                          {seller.url && (
                            <a
                              href={seller.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Store
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center tabular-nums font-semibold">
                        {seller.buy_option_count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {seller.total_value > 0
                          ? `$${seller.total_value.toFixed(2)}`
                          : '-'}
                      </TableCell>
                       <TableCell className="text-right tabular-nums">
                         {seller.buy_option_count > 0
                           ? `$${seller.avg_price.toFixed(2)}`
                           : '-'}
                       </TableCell>
                       <TableCell className="text-right tabular-nums">
                         {seller.buy_option_count > 0
                           ? `$${seller.avg_shipping.toFixed(2)}`
                           : '-'}
                       </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Assign buy option"
                            onClick={() => setAssignSeller(seller)}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditForm(seller)}
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
                                <AlertDialogTitle>Delete Seller</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{seller.name}"? Buy options linked to this seller will lose their seller reference.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSeller.mutate(seller.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Seller Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingSeller ? 'Edit Seller' : 'Add New Seller'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seller Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., CardShop123"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>eBay Store URL</Label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://ebay.com/usr/..."
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={!formName.trim() || createSeller.isPending || updateSeller.isPending}
            >
              {editingSeller ? 'Update' : 'Create'} Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Buy Option Modal */}
      {assignSeller && (
        <AssignBuyOptionModal
          open={!!assignSeller}
          onOpenChange={(val) => !val && setAssignSeller(null)}
          seller={assignSeller}
        />
      )}
    </>
  );
};

export default Sellers;
