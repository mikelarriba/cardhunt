import { useState, useMemo } from 'react';
import { Search, Plus, User, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { usePlayers } from '@/hooks/usePlayers';
import { useTeams } from '@/hooks/useTeams';
import { AddCardModal } from './AddCardModal';
import { AddPlayerModal } from './AddPlayerModal';
import { PlayerWithCards } from '@/types/database';
import { cn } from '@/lib/utils';

interface AddCardFromSellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerName: string;
}

export function AddCardFromSellerModal({
  open,
  onOpenChange,
  sellerName,
}: AddCardFromSellerModalProps) {
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithCards | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const { players } = usePlayers();

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.toLowerCase();
    return players.filter(p => p.name.toLowerCase().includes(q));
  }, [players, search]);

  const handleSelectPlayer = (player: PlayerWithCards) => {
    setSelectedPlayer(player);
    setShowAddCard(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearch('');
    setSelectedPlayer(null);
  };

  const handleCardModalClose = (open: boolean) => {
    setShowAddCard(open);
    if (!open) {
      handleClose();
    }
  };

  const handlePlayerCreated = () => {
    setShowAddPlayer(false);
    // Player list will refresh via query invalidation
  };

  return (
    <>
      <Dialog open={open && !showAddCard && !showAddPlayer} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Select Player for New Card
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Card will be assigned to seller "{sellerName}"
            </p>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50 border-border/50"
                autoFocus
              />
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-1 min-h-0">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No players found
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.sport} · {player.cards.length} cards
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Create New Player */}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowAddPlayer(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Player
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Player Modal */}
      <AddPlayerModal
        open={showAddPlayer}
        onOpenChange={handlePlayerCreated}
      />

      {/* Add Card Modal - with seller pre-filled */}
      {selectedPlayer && (
        <AddCardModalWithSeller
          open={showAddCard}
          onOpenChange={handleCardModalClose}
          player={selectedPlayer}
          sellerName={sellerName}
        />
      )}
    </>
  );
}

/**
 * Wrapper around AddCardModal that pre-fills the seller field.
 * We render AddCardModal and override the seller default via a modified version.
 */
import { Calendar, Users, Store } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { CardStatus, CARD_STATUSES, CARD_BRANDS } from '@/types/database';
import { useCards } from '@/hooks/useCards';
import { DualImageUpload } from './DualImageUpload';
import { SerialNumberInput } from './SerialNumberInput';
import { SeriesInput } from './SeriesInput';
import { CardLabelsInput } from './CardLabelsInput';
import { TeamAutocomplete } from './TeamAutocomplete';

function AddCardModalWithSeller({
  open,
  onOpenChange,
  player,
  sellerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerWithCards;
  sellerName: string;
}) {
  const [cardLabels, setCardLabels] = useState<string[]>([]);
  const [status, setStatus] = useState<CardStatus>('located');
  const [notes, setNotes] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [series, setSeries] = useState('');
  const [isNumbered, setIsNumbered] = useState(false);
  const [serialNum, setSerialNum] = useState('');
  const [serialTotal, setSerialTotal] = useState('');
  const [imageFront, setImageFront] = useState<string | null>(null);
  const [imageBack, setImageBack] = useState<string | null>(null);
  const [cardYear, setCardYear] = useState('');
  const [cardTeam, setCardTeam] = useState('');
  const [price, setPrice] = useState('');

  const { createCard } = useCards();

  const existingSeries = Array.from(
    new Set(player.cards.map(c => c.series).filter(Boolean) as string[])
  );
  const existingLabels = Array.from(
    new Set(player.cards.flatMap(c => c.card_labels || []))
  );

  const PRIMARY_SLOTS = ['Rookie', 'Autographed', 'Base'];
  const hasPrimarySlot = cardLabels.some(l => PRIMARY_SLOTS.includes(l));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPrimarySlot) return;

    const finalBrand = brand === 'custom' ? customBrand : brand;
    const legacyType = cardLabels.includes('Rookie') ? 'rookie'
      : cardLabels.includes('Autographed') ? 'autographed'
      : cardLabels.includes('Rated') ? 'rated'
      : 'regular';

    createCard.mutate(
      {
        player_id: player.id,
        card_type: legacyType,
        card_types: [legacyType],
        status,
        price: price ? parseFloat(price) : null,
        source_url: null,
        notes: notes || null,
        brand: finalBrand || null,
        series: series || null,
        is_numbered: isNumbered,
        serial_num: isNumbered && serialNum ? parseInt(serialNum) : null,
        serial_total: isNumbered && serialTotal ? parseInt(serialTotal) : null,
        card_labels: cardLabels,
        image_front: imageFront,
        image_back: imageBack,
        card_year: cardYear ? parseInt(cardYear) : null,
        card_team: cardTeam || null,
        seller: sellerName,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Card for {player.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Store className="w-3 h-3" /> Seller: {sellerName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Card Images</Label>
            <DualImageUpload
              frontImageUrl={imageFront}
              backImageUrl={imageBack}
              onFrontImageChange={setImageFront}
              onBackImageChange={setImageBack}
            />
          </div>

          <CardLabelsInput
            labels={cardLabels}
            onChange={setCardLabels}
            existingLabels={existingLabels}
          />

          <SeriesInput
            value={series}
            onChange={setSeries}
            existingSeries={existingSeries}
          />

          <div className="space-y-2">
            <Label>Brand</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_BRANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrand(b)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                    brand === b
                      ? 'bg-primary/20 text-primary ring-1 ring-primary'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {b}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBrand('custom')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                  brand === 'custom'
                    ? 'bg-primary/20 text-primary ring-1 ring-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                Custom
              </button>
            </div>
            {brand === 'custom' && (
              <Input
                placeholder="Enter brand name..."
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="mt-2 bg-secondary/50 border-border/50"
              />
            )}
          </div>

          <SerialNumberInput
            isNumbered={isNumbered}
            serialNum={serialNum}
            serialTotal={serialTotal}
            onIsNumberedChange={setIsNumbered}
            onSerialNumChange={setSerialNum}
            onSerialTotalChange={setSerialTotal}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Year
              </Label>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="2024"
                value={cardYear}
                onChange={(e) => setCardYear(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Team
              </Label>
              <TeamAutocomplete
                value={cardTeam}
                onChange={setCardTeam}
                onSelect={setCardTeam}
                placeholder="Type 3+ letters..."
                showIcon={false}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                $ Price
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              {CARD_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                    status === value
                      ? value === 'owned'
                        ? 'bg-status-owned/20 text-status-owned ring-1 ring-status-owned'
                        : value === 'located'
                        ? 'bg-status-located/20 text-status-located ring-1 ring-status-located'
                        : 'bg-status-missing/20 text-status-missing ring-1 ring-status-missing'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 border-border/50 resize-none"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={!hasPrimarySlot || createCard.isPending}
          >
            {createCard.isPending ? 'Adding...' : 'Add Card'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
