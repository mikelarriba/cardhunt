import { useState, useEffect } from 'react';
import { DollarSign, Link2, Check } from 'lucide-react';
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
import { Card, CardType, CardStatus, CARD_TYPES, CARD_STATUSES, CARD_BRANDS } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/utils';

interface EditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
}

export function EditCardModal({ open, onOpenChange, card }: EditCardModalProps) {
  const [cardTypes, setCardTypes] = useState<CardType[]>(card.card_types?.length ? card.card_types : [card.card_type]);
  const [status, setStatus] = useState<CardStatus>(card.status);
  const [price, setPrice] = useState(card.price?.toString() || '');
  const [sourceUrl, setSourceUrl] = useState(card.source_url || '');
  const [notes, setNotes] = useState(card.notes || '');
  const [brand, setBrand] = useState(card.brand || '');
  const [customBrand, setCustomBrand] = useState('');
  const { updateCard } = useCards();

  useEffect(() => {
    if (open) {
      setCardTypes(card.card_types?.length ? card.card_types : [card.card_type]);
      setStatus(card.status);
      setPrice(card.price?.toString() || '');
      setSourceUrl(card.source_url || '');
      setNotes(card.notes || '');
      setBrand(card.brand || '');
      setCustomBrand('');
    }
  }, [open, card]);

  const handleTypeToggle = (type: CardType) => {
    if (cardTypes.includes(type)) {
      if (cardTypes.length > 1) {
        setCardTypes(cardTypes.filter(t => t !== type));
      }
    } else {
      setCardTypes([...cardTypes, type]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardTypes.length === 0) return;

    const finalBrand = brand === 'custom' ? customBrand : brand;

    updateCard.mutate(
      {
        cardId: card.id,
        updates: {
          card_types: cardTypes,
          status,
          price: price ? parseFloat(price) : null,
          source_url: sourceUrl || null,
          notes: notes || null,
          brand: finalBrand || null,
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
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit Card</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Types - Multi-select */}
          <div className="space-y-2">
            <Label>Card Types (select multiple)</Label>
            <div className="grid grid-cols-2 gap-3">
              {CARD_TYPES.map(({ value: type, label }) => {
                const isSelected = cardTypes.includes(type);
                return (
                  <div
                    key={type}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTypeToggle(type)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTypeToggle(type)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer',
                      isSelected
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-secondary/50 hover:bg-secondary'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <CardTypeIcon type={type} size="md" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

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
            disabled={cardTypes.length === 0 || updateCard.isPending}
          >
            {updateCard.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}