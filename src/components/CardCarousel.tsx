import { useState, useMemo } from 'react';
import { Card, SportType, LEAGUE_LOGOS } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { BestValueBadge } from './BestValueBadge';
import { BrandBadge } from './BrandBadge';
import { EditCardModal } from './EditCardModal';
import { SerialNumberBadge } from './SerialNumberInput';
import { LeagueLogo } from './LeagueLogo';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, DollarSign, FileText, Pencil, ImageIcon, RotateCcw } from 'lucide-react';
import { useCards } from '@/hooks/useCards';
import { useQueryClient } from '@tanstack/react-query';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
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

interface CardCarouselProps {
  cards: Card[];
  sport?: SportType;
}

// Helper to get best value cards per label
function getBestValueCardIds(cards: Card[]): Set<string> {
  const bestValueIds = new Set<string>();
  
  // Group cards by each label
  const cardsByLabel: Record<string, Card[]> = {};

  cards.forEach((card) => {
    const labels = card.card_labels?.length ? card.card_labels : [];
    labels.forEach((label) => {
      if (!cardsByLabel[label]) {
        cardsByLabel[label] = [];
      }
      cardsByLabel[label].push(card);
    });
  });

  // Find cheapest card for each label (only if there's a price and more than 1 card)
  Object.values(cardsByLabel).forEach((labelCards) => {
    const cardsWithPrice = labelCards.filter((c) => c.price !== null && c.price > 0);
    if (cardsWithPrice.length > 1) {
      const cheapest = cardsWithPrice.reduce((min, c) => 
        (c.price! < min.price!) ? c : min
      );
      bestValueIds.add(cheapest.id);
    }
  });

  return bestValueIds;
}

export function CardCarousel({ cards, sport }: CardCarouselProps) {
  const { deleteCard } = useCards();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const bestValueIds = useMemo(() => getBestValueCardIds(cards), [cards]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No cards added yet</p>
        <p className="text-sm">Add cards from the player dashboard</p>
      </div>
    );
  }

  return (
    <>
      <Carousel 
        className="w-full"
        opts={{
          align: 'start',
          loop: false,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {cards.map((card) => {
            const isBestValue = bestValueIds.has(card.id);
            const displayLabels = card.card_labels?.length ? card.card_labels : [];
            const cardImage = card.image_front || card.image_url;
            const hasBackImage = !!card.image_back;
            
            return (
              <CarouselItem key={card.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <CardDisplay
                  card={card}
                  cardImage={cardImage}
                  hasBackImage={hasBackImage}
                  displayLabels={displayLabels}
                  isBestValue={isBestValue}
                  sport={sport}
                  onEdit={() => setEditingCard(card)}
                  onDelete={() => deleteCard.mutate(card.id)}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:-left-6" />
        <CarouselNext className="-right-4 md:-right-6" />
      </Carousel>

      {editingCard && (
        <EditCardModal
          open={!!editingCard}
          onOpenChange={(open) => !open && setEditingCard(null)}
          card={editingCard}
        />
      )}
    </>
  );
}

function CardDisplay({
  card,
  cardImage,
  hasBackImage,
  displayLabels,
  isBestValue,
  sport,
  onEdit,
  onDelete,
}: {
  card: Card;
  cardImage: string | null;
  hasBackImage: boolean;
  displayLabels: string[];
  isBestValue: boolean;
  sport?: SportType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showBack, setShowBack] = useState(false);
  const currentImage = showBack && card.image_back ? card.image_back : cardImage;

  return (
    <div className="glass-card p-4 relative">
      {/* Best Value Badge */}
      {isBestValue && <BestValueBadge />}
      
      {/* Card Image - Vertical 2:3 aspect ratio */}
      <div className="relative">
        {/* Brand Badge - Top Left */}
        <BrandBadge brand={card.brand} />
        
        {/* League Logo - Top Right */}
        {sport && LEAGUE_LOGOS[sport] && (
          <div className="absolute top-2 right-2 z-10">
            <LeagueLogo sport={sport} size="md" />
          </div>
        )}
        
        {/* Serial Number - Bottom Left */}
        {card.is_numbered && card.serial_num && card.serial_total && (
          <SerialNumberBadge
            serialNum={card.serial_num}
            serialTotal={card.serial_total}
            className="absolute bottom-2 left-2 z-10"
          />
        )}

        {/* Card Image */}
        <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted relative group">
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt="Card"
                className="w-full h-full object-cover transition-transform duration-300"
              />
              {/* Flip button for dual images */}
              {hasBackImage && (
                <button
                  onClick={() => setShowBack(!showBack)}
                  className="absolute bottom-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Front/Back indicator */}
        {hasBackImage && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
            <div className={cn('w-2 h-2 rounded-full transition-colors', !showBack ? 'bg-white' : 'bg-white/40')} />
            <div className={cn('w-2 h-2 rounded-full transition-colors', showBack ? 'bg-white' : 'bg-white/40')} />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="mt-4 space-y-3">
        {/* Labels and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Labels as pills */}
            {displayLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {displayLabels.map((label) => (
                  <span
                    key={label}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
            
            {/* Series */}
            {card.series && (
              <h3 className="font-display font-semibold text-base">
                {card.series}
              </h3>
            )}
            
            <StatusBadge status={card.status} size="md" />
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="w-5 h-5" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Card</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this card? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Brand */}
        {card.brand && (
          <div className="text-sm text-muted-foreground">
            Brand: <span className="font-medium text-foreground">{card.brand}</span>
          </div>
        )}

        {/* Price */}
        {card.price !== null && (
          <div className="flex items-center gap-2 text-primary">
            <DollarSign className="w-4 h-4" />
            <span className="font-display font-semibold text-lg">
              {card.price.toFixed(2)}
            </span>
          </div>
        )}

        {/* Source URL */}
        {card.source_url && (
          <a
            href={card.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{card.source_url}</span>
          </a>
        )}

        {/* Notes */}
        {card.notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{card.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <p>Added: {new Date(card.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
