import { useState } from 'react';
import { DollarSign, Link2, Calendar, Users, Store } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CardStatus, Card, CARD_STATUSES, CARD_BRANDS } from '@/types/database';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/utils';
import { DualImageUpload } from './DualImageUpload';
import { SerialNumberInput } from './SerialNumberInput';
import { SeriesInput } from './SeriesInput';
import { CardLabelsInput } from './CardLabelsInput';

interface AddCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  existingCards: Card[];
}

export function AddCardModal({
  open,
  onOpenChange,
  playerId,
  playerName,
  existingCards,
}: AddCardModalProps) {
  // Card labels (replacing fixed card types)
  const [cardLabels, setCardLabels] = useState<string[]>([]);
  const [status, setStatus] = useState<CardStatus>('missing');
  const [price, setPrice] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [brand, setBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  
  // New fields
  const [series, setSeries] = useState('');
  const [isNumbered, setIsNumbered] = useState(false);
  const [serialNum, setSerialNum] = useState('');
  const [serialTotal, setSerialTotal] = useState('');
  const [imageFront, setImageFront] = useState<string | null>(null);
  const [imageBack, setImageBack] = useState<string | null>(null);
  
  // eBay integration fields
  const [cardYear, setCardYear] = useState('');
  const [cardTeam, setCardTeam] = useState('');
  const [seller, setSeller] = useState('');

  const { createCard } = useCards();

  // Get existing series from user's cards for suggestions
  const existingSeries = Array.from(
    new Set(existingCards.map(c => c.series).filter(Boolean) as string[])
  );

  // Get existing labels from user's cards for suggestions
  const existingLabels = Array.from(
    new Set(existingCards.flatMap(c => c.card_labels || []))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardLabels.length === 0) return;

    const finalBrand = brand === 'custom' ? customBrand : brand;

    // Determine primary card type for legacy support
    const legacyType = cardLabels.includes('Rookie') ? 'rookie' 
      : cardLabels.includes('Autographed') ? 'autographed'
      : cardLabels.includes('Rated') ? 'rated'
      : 'regular';

    createCard.mutate(
      {
        player_id: playerId,
        card_type: legacyType,
        card_types: [legacyType],
        status,
        price: price ? parseFloat(price) : null,
        source_url: sourceUrl || null,
        notes: notes || null,
        brand: finalBrand || null,
        // New fields
        series: series || null,
        is_numbered: isNumbered,
        serial_num: isNumbered && serialNum ? parseInt(serialNum) : null,
        serial_total: isNumbered && serialTotal ? parseInt(serialTotal) : null,
        card_labels: cardLabels,
        image_front: imageFront,
        image_back: imageBack,
        // eBay integration fields
        card_year: cardYear ? parseInt(cardYear) : null,
        card_team: cardTeam || null,
        seller: seller || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setCardLabels([]);
    setStatus('missing');
    setPrice('');
    setSourceUrl('');
    setNotes('');
    setBrand('');
    setCustomBrand('');
    setSeries('');
    setIsNumbered(false);
    setSerialNum('');
    setSerialTotal('');
    setImageFront(null);
    setImageBack(null);
    setCardYear('');
    setCardTeam('');
    setSeller('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Card for {playerName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Images - Dual Upload */}
          <div className="space-y-2">
            <Label>Card Images</Label>
            <DualImageUpload
              frontImageUrl={imageFront}
              backImageUrl={imageBack}
              onFrontImageChange={setImageFront}
              onBackImageChange={setImageBack}
            />
          </div>

          {/* Card Labels - Searchable Tags */}
          <CardLabelsInput
            labels={cardLabels}
            onChange={setCardLabels}
            existingLabels={existingLabels}
          />

          {/* Series / Set */}
          <SeriesInput
            value={series}
            onChange={setSeries}
            existingSeries={existingSeries}
          />

          {/* Brand Selection */}
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

          {/* Serial Numbering */}
          <SerialNumberInput
            isNumbered={isNumbered}
            serialNum={serialNum}
            serialTotal={serialTotal}
            onIsNumberedChange={setIsNumbered}
            onSerialNumChange={setSerialNum}
            onSerialTotalChange={setSerialTotal}
          />

          {/* Year, Team, Seller - Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cardYear" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Year
              </Label>
              <Input
                id="cardYear"
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
              <Label htmlFor="cardTeam" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Team
              </Label>
              <Input
                id="cardTeam"
                placeholder="Lakers"
                value={cardTeam}
                onChange={(e) => setCardTeam(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller" className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                Seller
              </Label>
              <Input
                id="seller"
                placeholder="eBay seller"
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          {/* Status Selection */}
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

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">
              {status === 'owned' ? 'Paid Price' : 'Price to Pay'}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          {/* Source URL */}
          {status !== 'owned' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="sourceUrl"
                  type="url"
                  placeholder="https://..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary/50 border-border/50 resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={cardLabels.length === 0 || createCard.isPending}
          >
            {createCard.isPending ? 'Adding...' : 'Add Card'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
