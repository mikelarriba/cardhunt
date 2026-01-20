import { useState } from 'react';
import { Card } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { StatusBadge } from './StatusBadge';
import { CardImageUpload } from './CardImageUpload';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, DollarSign, FileText } from 'lucide-react';
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

export function CardCarousel({ cards }: CardCarouselProps) {
  const { deleteCard } = useCards();
  const queryClient = useQueryClient();

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
    <Carousel className="w-full max-w-3xl mx-auto">
      <CarouselContent>
        {cards.map((card) => (
          <CarouselItem key={card.id}>
            <div className="glass-card p-6 mx-4">
              {/* Card Image */}
              <CardImageUpload
                cardId={card.id}
                currentImageUrl={card.image_url}
                onImageUpdated={handleImageUpdated}
              />

              {/* Card Info */}
              <div className="mt-6 space-y-4">
                {/* Type and Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTypeIcon type={card.card_type} status={card.status} size="lg" />
                    <div>
                      <h3 className="font-display font-semibold text-lg capitalize">
                        {card.card_type} Card
                      </h3>
                      <StatusBadge status={card.status} size="md" />
                    </div>
                  </div>
                  
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

                {/* Price */}
                {card.price !== null && (
                  <div className="flex items-center gap-2 text-primary">
                    <DollarSign className="w-5 h-5" />
                    <span className="font-display font-semibold text-xl">
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
                  <p>Updated: {new Date(card.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0" />
      <CarouselNext className="right-0" />
    </Carousel>
  );
}
