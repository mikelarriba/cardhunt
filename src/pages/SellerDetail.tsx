import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Store, ExternalLink, Pencil, Trash2, Hash, Plus,
  Package, DollarSign, Truck, ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useSellers } from '@/hooks/useSellers';
import { usePlayers } from '@/hooks/usePlayers';
import { useBuyOptions } from '@/hooks/useBuyOptions';
import { useSellerStats } from '@/hooks/useSellerStats';
import { cn } from '@/lib/utils';
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
import { Card, BuyOption, PlayerWithCards } from '@/types/database';
import { AddCardFromSellerModal } from '@/components/AddCardFromSellerModal';

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
      status === 'owned' && 'bg-status-owned/15 text-status-owned',
      status === 'located' && 'bg-status-located/15 text-status-located',
      status === 'missing' && 'bg-status-missing/15 text-status-missing',
    )}>
      {status}
    </span>
  );
}

interface BuyOptionWithCard extends BuyOption {
  card?: Card;
  playerName?: string;
  playerId?: string;
}

export default function SellerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { sellers, isLoading: sellersLoading, updateSeller, deleteSeller } = useSellers();
  const { players, isLoading: playersLoading } = usePlayers();
  const { data: sellerStats = [], isLoading: sellerStatsLoading } = useSellerStats();

  const [showEdit, setShowEdit] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCombinedShipping, setFormCombinedShipping] = useState(false);
  const [formShippingCost, setFormShippingCost] = useState('');

  const seller = useMemo(() => sellers.find(s => s.id === id) || null, [sellers, id]);

  const sellerStatsEntry = useMemo(() => sellerStats.find((entry) => entry.id === id) || null, [sellerStats, id]);

  // Build a list of seller-related cards for display
  const { buyOptionsForSeller, stats } = useMemo(() => {
    if (!seller || !players) return { buyOptionsForSeller: [] as BuyOptionWithCard[], stats: { totalCards: 0, totalValue: 0, totalShipping: 0, avgPrice: 0, avgShipping: 0 } };

    const allCards = new Map<string, { card: Card; playerName: string; playerId: string }>();
    for (const p of players) {
      for (const c of p.cards) {
        allCards.set(c.id, { card: c, playerName: p.name, playerId: p.id });
      }
    }

    // Collect buy options that reference this seller
    const boList: BuyOptionWithCard[] = [];
    for (const p of players) {
      for (const c of p.cards) {
        // We need buy_options — they're loaded per-card, but we can check via the card's seller field too
        // Actually buy_options are in a separate table. Let's collect from all cards.
      }
    }

    // We need to query buy_options. Since we don't have them all loaded, let's compute from what we have.
    // The useSellerStats already aggregates, but for detail we need per-card info.
    // For now, let's show cards where card.seller matches this seller's name
    const cardsBySeller: BuyOptionWithCard[] = [];
    for (const p of players) {
      for (const c of p.cards) {
        if (c.seller && c.seller.toLowerCase() === seller.name.toLowerCase()) {
          cardsBySeller.push({
            id: c.id,
            card_id: c.id,
            seller_id: seller.id,
            source_url: c.source_url,
            price: c.price,
            shipping_cost: null,
            notes: c.notes,
            is_numbered: c.is_numbered || false,
            serial_num: c.serial_num ?? null,
            serial_total: c.serial_total ?? null,
            created_at: c.created_at,
            updated_at: c.updated_at,
            card: c,
            playerName: p.name,
            playerId: p.id,
          });
        }
      }
    }

    const totalValue = sellerStatsEntry?.total_value ?? cardsBySeller.reduce((sum, bo) => sum + (bo.price || 0) + (bo.shipping_cost || 0), 0);
    const totalShipping = sellerStatsEntry?.total_shipping ?? cardsBySeller.reduce((sum, bo) => sum + (bo.shipping_cost || 0), 0);
    const avgPrice = sellerStatsEntry?.avg_price ?? (cardsBySeller.length > 0 ? cardsBySeller.reduce((sum, bo) => sum + (bo.price || 0), 0) / cardsBySeller.length : 0);
    const avgShipping = sellerStatsEntry?.avg_shipping ?? (cardsBySeller.length > 0 ? totalShipping / cardsBySeller.length : 0);

    return {
      buyOptionsForSeller: cardsBySeller.sort((a, b) => (a.playerName || '').localeCompare(b.playerName || '')),
      stats: {
        totalCards: sellerStatsEntry?.buy_option_count ?? cardsBySeller.length,
        totalValue,
        totalShipping,
        avgPrice,
        avgShipping,
      },
    };
  }, [seller, players, sellerStatsEntry]);

  const openEdit = () => {
    if (!seller) return;
    setFormName(seller.name);
    setFormUrl(seller.url || '');
    setFormCombinedShipping(seller.combined_shipping || false);
    setFormShippingCost(seller.shipping_cost != null ? String(seller.shipping_cost) : '');
    setShowEdit(true);
  };

  const handleUpdate = async () => {
    if (!seller || !formName.trim()) return;
    await updateSeller.mutateAsync({
      id: seller.id,
      name: formName,
      url: formUrl || undefined,
    });
    // Update new fields via direct supabase call since the hook may not support them yet
    const { supabase } = await import('@/integrations/supabase/client');
    await (supabase as any).from('sellers').update({
      combined_shipping: formCombinedShipping,
      shipping_cost: formShippingCost ? parseFloat(formShippingCost) : null,
    }).eq('id', seller.id);
    setShowEdit(false);
  };

  const handleDelete = () => {
    if (!seller) return;
    deleteSeller.mutate(seller.id, {
      onSuccess: () => navigate('/sellers'),
    });
  };

  if (!authLoading && !user) {
    navigate('/');
    return null;
  }

  const isLoading = authLoading || sellersLoading || playersLoading || sellerStatsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet><title>Seller Not Found | Card Hunt</title></Helmet>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-2">Seller Not Found</h1>
          <Button onClick={() => navigate('/sellers')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sellers
          </Button>
        </div>
      </div>
    );
  }

  // Estimate combined shipping savings
  const combinedShippingSavings = seller.combined_shipping && seller.shipping_cost != null && stats.totalCards > 1
    ? (stats.totalCards - 1) * (seller.shipping_cost || 0)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{seller.name} | Card Hunt</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/sellers')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Sellers
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => setShowAddCard(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Card
              </Button>
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Seller</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{seller.name}"? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-foreground">{seller.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                {seller.url && (
                  <a href={seller.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Store
                  </a>
                )}
                {seller.combined_shipping && (
                  <span className="text-[10px] font-medium text-status-owned bg-status-owned/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Combined Shipping
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">{stats.totalCards}</p>
            <p className="text-xs text-muted-foreground">Cards</p>
          </div>
          <div className="glass-card p-4 text-center">
            <DollarSign className="w-5 h-5 text-status-owned mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">${stats.totalValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
          <div className="glass-card p-4 text-center">
            <ShoppingCart className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">${stats.avgPrice.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Avg Price</p>
          </div>
          <div className="glass-card p-4 text-center">
            <Truck className="w-5 h-5 text-status-located mx-auto mb-1" />
            <p className="text-2xl font-display font-bold text-foreground">
              {stats.totalCards > 0 ? `$${stats.avgShipping.toFixed(2)}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Shipping Avg</p>
          </div>
        </div>

        {/* Combined shipping savings */}
        {combinedShippingSavings > 0 && (
          <div className="glass-card p-4 flex items-center gap-3 bg-status-owned/5 border border-status-owned/20">
            <Truck className="w-5 h-5 text-status-owned flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Combined shipping saves you <span className="text-status-owned font-bold">${combinedShippingSavings.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pay shipping once instead of {stats.totalCards} times
              </p>
            </div>
          </div>
        )}

        {/* Cards List */}
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground mb-3">
            Cards from {seller.name}
          </h2>

          {buyOptionsForSeller.length === 0 ? (
            <div className="glass-card p-8 text-center text-muted-foreground">
              <p>No cards from this seller yet.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden divide-y divide-border/10">
              {buyOptionsForSeller.map((bo) => {
                const card = bo.card;
                if (!card) return null;
                const labels = card.card_labels || [];
                const hasImage = card.image_front || card.image_url;

                return (
                  <div key={bo.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-10 h-14 rounded bg-muted/50 flex-shrink-0 overflow-hidden">
                      {hasImage ? (
                        <img
                          src={card.image_front || card.image_url || ''}
                          alt={`${bo.playerName} card`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                          <Hash className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/player/${bo.playerId}`}
                        className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {bo.playerName}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {labels.map(l => (
                          <span key={l} className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded',
                            l.toLowerCase() === 'rookie' && 'bg-primary/10 text-primary',
                            l.toLowerCase() === 'autographed' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            l.toLowerCase() === 'base' && 'bg-secondary text-muted-foreground',
                            !['rookie', 'autographed', 'base'].includes(l.toLowerCase()) && 'bg-secondary text-muted-foreground',
                          )}>
                            {l}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {card.brand && <span>{card.brand}</span>}
                        {card.brand && card.series && <span>·</span>}
                        {card.series && <span>{card.series}</span>}
                        {card.card_year && <span>· {card.card_year}</span>}
                      </div>
                    </div>

                    {/* Price & Status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {card.price != null && (
                        <span className="text-sm font-medium text-foreground tabular-nums">${card.price.toFixed(2)}</span>
                      )}
                      <StatusBadge status={card.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Seller</DialogTitle>
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
              <Label>Store URL</Label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://ebay.com/usr/..."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Shipping Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formShippingCost}
                onChange={(e) => setFormShippingCost(e.target.value)}
                placeholder="e.g., 3.99"
                className="bg-background border-border"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Combined Shipping</Label>
                <p className="text-xs text-muted-foreground">Pay shipping once for multiple cards</p>
              </div>
              <Switch
                checked={formCombinedShipping}
                onCheckedChange={setFormCombinedShipping}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!formName.trim() || updateSeller.isPending}>
              Update Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Card from Seller */}
      {seller && (
        <AddCardFromSellerModal
          open={showAddCard}
          onOpenChange={setShowAddCard}
          sellerName={seller.name}
        />
      )}
    </div>
  );
}
