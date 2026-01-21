import { useState, useEffect } from 'react';
import { DollarSign, Link2 } from 'lucide-react';
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
import { Card, CardStatus, CARD_STATUSES, CARD_BRANDS } from '@/types/database';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/utils';
import { DualImageUpload } from './DualImageUpload';
import { SerialNumberInput } from './SerialNumberInput';
import { SeriesInput } from './SeriesInput';
import { CardLabelsInput } from './CardLabelsInput';

interface EditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
}

export function EditCardModal({ open, onOpenChange, card }: EditCardModalProps) {
  // Card labels
  const [cardLabels, setCardLabels] = useState<string[]>(card.card_labels || []);
  const [status, setStatus] = useState<CardStatus>(card.status);
  const [price, setPrice] = useState(card.price?.toString() || '');
  const [sourceUrl, setSourceUrl] = useState(card.source_url || '');
  const [notes, setNotes] = useState(card.notes || '');
  const [brand, setBrand] = useState(card.brand || '');
  const [customBrand, setCustomBrand] = useState('');
  
  // New fields
  const [series, setSeries] = useState(card.series || '');
  const [isNumbered, setIsNumbered] = useState(card.is_numbered || false);
  const [serialNum, setSerialNum] = useState(card.serial_num?.toString() || '');
  const [serialTotal, setSerialTotal] = useState(card.serial_total?.toString() || '');
  const [imageFront, setImageFront] = useState<string | null>(card.image_front || card.image_url);
  const [imageBack, setImageBack] = useState<string | null>(card.image_back || null);

  const { updateCard } = useCards();

  useEffect(() => {
    if (open) {
      setCardLabels(card.card_labels || []);
      setStatus(card.status);
      setPrice(card.price?.toString() || '');
      setSourceUrl(card.source_url || '');
      setNotes(card.notes || '');
      setBrand(card.brand || '');
      setCustomBrand('');
      setSeries(card.series || '');
      setIsNumbered(card.is_numbered || false);
      setSerialNum(card.serial_num?.toString() || '');
      setSerialTotal(card.serial_total?.toString() || '');
      setImageFront(card.image_front || card.image_url);
      setImageBack(card.image_back || null);
    }
  }, [open, card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardLabels.length === 0) return;

    const finalBrand = brand === 'custom' ? customBrand : brand;

    updateCard.mutate(
      {
        cardId: card.id,
        updates: {
          card_labels: cardLabels,
          status,
          price: price ? parseFloat(price) : null,
          source_url: sourceUrl || null,
          notes: notes || null,
          brand: finalBrand || null,
          series: series || null,
          is_numbered: isNumbered,
          serial_num: isNumbered && serialNum ? parseInt(serialNum) : null,
          serial_total: isNumbered && serialTotal ? parseInt(serialTotal) : null,
          image_front: imageFront,
          image_back: imageBack,
        },
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
          <DialogTitle className="font-display text-xl">Edit Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Images - Dual Upload */}
          <div className="space-y-2">
            <Label>Card Images</Label>
            <DualImageUpload
              cardId={card.id}
              frontImageUrl={imageFront}
              backImageUrl={imageBack}
              onFrontImageChange={setImageFront}
              onBackImageChange={setImageBack}
              immediateUpload
            />
          </div>

          {/* Card Labels - Searchable Tags */}
          <CardLabelsInput
            labels={cardLabels}
            onChange={setCardLabels}
          />

          {/* Series / Set */}
          <SeriesInput
            value={series}
            onChange={setSeries}
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
                  brand === 'custom' || (brand && !CARD_BRANDS.includes(brand as any))
                    ? 'bg-primary/20 text-primary ring-1 ring-primary'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                )}
              >
                Custom
              </button>
            </div>
            {(brand === 'custom' || (brand && !CARD_BRANDS.includes(brand as any))) && (
              <Input
                placeholder="Enter brand name..."
                value={brand === 'custom' ? customBrand : brand}
                onChange={(e) => {
                  if (brand === 'custom') {
                    setCustomBrand(e.target.value);
                  } else {
                    setBrand(e.target.value);
                  }
                }}
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
            disabled={cardLabels.length === 0 || updateCard.isPending}
          >
            {updateCard.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
