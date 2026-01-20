import { useState, useMemo } from 'react';
import { Card, CardType, CARD_TYPES } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { StatusBadge } from './StatusBadge';
import { CardImageUpload } from './CardImageUpload';
import { BestValueBadge } from './BestValueBadge';
import { BrandBadge } from './BrandBadge';
import { EditCardModal } from './EditCardModal';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, DollarSign, FileText, Pencil } from 'lucide-react';
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

interface CardCarouselProps {
  cards: Card[];
}

// Helper to get best value cards per type
function getBestValueCardIds(cards: Card[]): Set<string> {
  const bestValueIds = new Set<string>();
  
  // Group cards by each type they belong to
  const cardsByType: Record<CardType, Card[]> = {
    rookie: [],
    regular: [],
    autographed: [],
    rated: [],
  };

  cards.forEach((card) => {
    const types = card.card_types?.length ? card.card_types : [card.card_type];
    types.forEach((type) => {
      if (cardsByType[type]) {
        cardsByType[type].push(card);
      }
    });
  });

  // Find cheapest card for each type (only if there's a price and more than 1 card)
  Object.values(cardsByType).forEach((typeCards) => {
    const cardsWithPrice = typeCards.filter((c) => c.price !== null && c.price > 0);
    if (cardsWithPrice.length > 1) {
      const cheapest = cardsWithPrice.reduce((min, c) => 
        (c.price! < min.price!) ? c : min
      );
      bestValueIds.add(cheapest.id);
    }
  });

  return bestValueIds;
}

export function CardCarousel({ cards }: CardCarouselProps) {
  const { deleteCard } = useCards();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const bestValueIds = useMemo(() => getBestValueCardIds(cards), [cards]);

  const handleImageUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['player'] });
  };

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
      <Carousel className="w-full max-w-md mx-auto">
        <CarouselContent>
          {cards.map((card) => {
            const isBestValue = bestValueIds.has(card.id);
            const displayTypes = card.card_types?.length ? card.card_types : [card.card_type];
            
            return (
              <CarouselItem key={card.id}>
                <div className="glass-card p-4 mx-2 relative">
                  {/* Best Value Badge */}
                  {isBestValue && <BestValueBadge />}
                  
                  {/* Card Image - Vertical 2:3 aspect ratio */}
                  <div className="max-w-[280px] mx-auto relative">
                    {/* Brand Badge */}
                    <BrandBadge brand={card.brand} />
                    
                    <CardImageUpload
                      cardId={card.id}
                      currentImageUrl={card.image_url}
                      onImageUpdated={handleImageUpdated}
                    />
                  </div>

                  {/* Card Info */}
                  <div className="mt-4 space-y-3">
                    {/* Types and Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {displayTypes.map((type) => (
                            <CardTypeIcon key={type} type={type} status={card.status} size="lg" />
                          ))}
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-base">
                            {displayTypes.map((t) => 
                              CARD_TYPES.find((ct) => ct.value === t)?.label
                            ).join(' / ')}
                          </h3>
                          <StatusBadge status={card.status} size="md" />
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingCard(card)}
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
                                onClick={() => deleteCard.mutate(card.id)}
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
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
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