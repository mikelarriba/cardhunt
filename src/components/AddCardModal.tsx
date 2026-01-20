import { useState } from 'react';
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
import { CardType, CardStatus, Card, CARD_TYPES, CARD_STATUSES } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { useCards } from '@/hooks/useCards';
import { cn } from '@/lib/utils';

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
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [status, setStatus] = useState<CardStatus>('missing');
  const [price, setPrice] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const { createCard } = useCards();

  const existingTypes = existingCards.map((c) => c.card_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardType) return;

    createCard.mutate(
      {
        player_id: playerId,
        card_type: cardType,
        status,
        price: price ? parseFloat(price) : null,
        source_url: sourceUrl || null,
        notes: notes || null,
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
    setCardType(null);
    setStatus('missing');
    setPrice('');
    setSourceUrl('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Card for {playerName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Type Selection */}
          <div className="space-y-2">
            <Label>Card Type</Label>
            <div className="grid grid-cols-4 gap-3">
              {CARD_TYPES.map(({ value: type, label }) => {
                const isExisting = existingTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={isExisting}
                    onClick={() => setCardType(type)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200',
                      isExisting && 'opacity-40 cursor-not-allowed',
                      cardType === type
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-secondary/50 hover:bg-secondary'
                    )}
                  >
                    <CardTypeIcon type={type} size="lg" />
                    <span className="text-xs font-medium">{label}</span>
                    {isExisting && (
                      <span className="text-[10px] text-muted-foreground">Added</span>
                    )}
                  </button>
                );
              })}
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
            disabled={!cardType || createCard.isPending}
          >
            {createCard.isPending ? 'Adding...' : 'Add Card'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
