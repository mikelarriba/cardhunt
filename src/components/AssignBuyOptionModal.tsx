import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlayers } from '@/hooks/usePlayers';
import { useCards } from '@/hooks/useCards';
import { useBuyOptions } from '@/hooks/useBuyOptions';
import { Seller, SPORTS, SportType, CARD_STATUSES, CardStatus } from '@/types/database';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AssignBuyOptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: Seller;
}

type Step = 'select-player' | 'select-card' | 'buy-option-details';

export function AssignBuyOptionModal({ open, onOpenChange, seller }: AssignBuyOptionModalProps) {
  const { players } = usePlayers();
  const { createCard } = useCards();

  const [step, setStep] = useState<Step>('select-player');
  const [playerSearch, setPlayerSearch] = useState('');

  // New player form
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerSport, setNewPlayerSport] = useState<SportType>('basketball');

  // Selected state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // New card
  const [showNewCard, setShowNewCard] = useState(false);
  const [newCardStatus, setNewCardStatus] = useState<CardStatus>('located');
  const [newCardSeries, setNewCardSeries] = useState('');

  // Buy option details
  const [price, setPrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy hook call for dynamic card id — we'll use direct supabase call instead
  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  const filteredPlayers = useMemo(() => {
    if (!playerSearch) return players;
    const q = playerSearch.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teams?.some((t) => t.toLowerCase().includes(q))
    );
  }, [players, playerSearch]);

  const resetForm = () => {
    setStep('select-player');
    setPlayerSearch('');
    setShowNewPlayer(false);
    setNewPlayerName('');
    setNewPlayerSport('basketball');
    setSelectedPlayerId(null);
    setSelectedCardId(null);
    setShowNewCard(false);
    setNewCardStatus('located');
    setNewCardSeries('');
    setPrice('');
    setShippingCost('');
    setSourceUrl('');
    setNotes('');
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setStep('select-card');
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('players')
      .insert({
        user_id: user.id,
        name: newPlayerName.trim(),
        sport: newPlayerSport,
        teams: [],
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create player');
      return;
    }

    setSelectedPlayerId(data.id);
    setShowNewPlayer(false);
    setStep('select-card');
    toast.success(`Player "${data.name}" created`);
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setStep('buy-option-details');
  };

  const handleCreateCard = async () => {
    if (!selectedPlayerId) return;

    const result = await createCard.mutateAsync({
      player_id: selectedPlayerId,
      card_type: 'regular',
      status: newCardStatus,
      series: newCardSeries || null,
    });

    setSelectedCardId(result.id);
    setShowNewCard(false);
    setStep('buy-option-details');
  };

  const handleSubmit = async () => {
    if (!selectedCardId) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('buy_options')
        .insert({
          card_id: selectedCardId,
          seller_id: seller.id,
          price: price ? parseFloat(price) : null,
          shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
          source_url: sourceUrl.trim() || null,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast.success('Buy option assigned to seller');
      handleClose(false);
    } catch {
      toast.error('Failed to create buy option');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Assign Buy Option — {seller.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'select-player' && 'Step 1: Choose or create a player'}
            {step === 'select-card' && 'Step 2: Choose or create a card'}
            {step === 'buy-option-details' && 'Step 3: Enter buy option details'}
          </p>
        </DialogHeader>

        {/* Step 1: Select Player */}
        {step === 'select-player' && (
          <div className="space-y-4 py-2">
            {!showNewPlayer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-10 bg-background border-border"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handleSelectPlayer(player.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-medium text-sm">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.sport} · {player.cards.length} card{player.cards.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                        Select →
                      </span>
                    </button>
                  ))}
                  {filteredPlayers.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No players found</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewPlayer(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Player
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Player Name</Label>
                  <Input
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="e.g., LeBron James"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select value={newPlayerSport} onValueChange={(v) => setNewPlayerSport(v as SportType)}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {SPORTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewPlayer(false)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleCreatePlayer} disabled={!newPlayerName.trim()} className="flex-1">
                    Create Player
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Card */}
        {step === 'select-card' && selectedPlayer && (
          <div className="space-y-4 py-2">
            <p className="text-sm font-medium">
              Player: <span className="text-primary">{selectedPlayer.name}</span>
            </p>

            {!showNewCard ? (
              <>
                {selectedPlayer.cards.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {selectedPlayer.cards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleSelectCard(card.id)}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {card.series || card.brand || 'Card'} {card.card_year ? `(${card.card_year})` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {card.status} · {(card.card_labels || []).join(', ') || 'No labels'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                          Select →
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No cards yet for this player
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('select-player')} className="flex-1">
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewCard(true)} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    New Card
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newCardStatus} onValueChange={(v) => setNewCardStatus(v as CardStatus)}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {CARD_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Series (optional)</Label>
                  <Input
                    value={newCardSeries}
                    onChange={(e) => setNewCardSeries(e.target.value)}
                    placeholder="e.g., Prizm"
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewCard(false)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleCreateCard} disabled={createCard.isPending} className="flex-1">
                    Create Card
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Buy Option Details */}
        {step === 'buy-option-details' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Shipping ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0.00"
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Listing URL</Label>
              <Input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://ebay.com/itm/..."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="bg-background border-border resize-none"
                rows={2}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setStep('select-card')}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Assign Buy Option'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
