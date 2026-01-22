import { useState } from 'react';
import { Pencil, X, ImageIcon, RotateCcw, DollarSign, Calendar, Building2, Tag, FileText } from 'lucide-react';
import { Card, SportType, LEAGUE_LOGOS } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { BrandBadge } from './BrandBadge';
import { SerialNumberBadge } from './SerialNumberInput';
import { LeagueLogo } from './LeagueLogo';
import { BuyOptionsTable } from './BuyOptionsTable';
import { EditCardModal } from './EditCardModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card;
  sport?: SportType;
}

export function CardDetailModal({ open, onOpenChange, card, sport }: CardDetailModalProps) {
  const [showBack, setShowBack] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const cardImage = card.image_front || card.image_url;
  const hasBackImage = !!card.image_back;
  const currentImage = showBack && card.image_back ? card.image_back : cardImage;
  const displayLabels = card.card_labels?.length ? card.card_labels : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-xl border-border/50 p-0">
          <DialogTitle className="sr-only">Card Details</DialogTitle>
          
          {/* Header with Edit Button */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-lg border-b border-border/50">
            <h2 className="font-display font-semibold text-xl">Card Details</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEdit(true)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Main Content Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card Image */}
              <div className="relative">
                {/* Brand Badge */}
                <BrandBadge brand={card.brand} />
                
                {/* League Logo */}
                {sport && LEAGUE_LOGOS[sport] && (
                  <div className="absolute top-2 right-2 z-10">
                    <LeagueLogo sport={sport} size="md" />
                  </div>
                )}
                
                {/* Serial Number */}
                {card.is_numbered && card.serial_num && card.serial_total && (
                  <SerialNumberBadge
                    serialNum={card.serial_num}
                    serialTotal={card.serial_total}
                    className="absolute bottom-2 left-2 z-10"
                  />
                )}

                <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-muted relative group shadow-lg">
                  {currentImage ? (
                    <>
                      <img
                        src={currentImage}
                        alt="Card"
                        className="w-full h-full object-cover"
                      />
                      {hasBackImage && (
                        <button
                          onClick={() => setShowBack(!showBack)}
                          className="absolute bottom-4 right-4 z-10 p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-20 h-20 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Front/Back Indicator */}
                {hasBackImage && (
                  <div className="flex justify-center gap-2 mt-3">
                    <div className={cn('w-2.5 h-2.5 rounded-full transition-colors', !showBack ? 'bg-primary' : 'bg-muted-foreground/30')} />
                    <div className={cn('w-2.5 h-2.5 rounded-full transition-colors', showBack ? 'bg-primary' : 'bg-muted-foreground/30')} />
                  </div>
                )}
              </div>

              {/* Card Information */}
              <div className="space-y-6">
                {/* Status and Labels */}
                <div className="space-y-3">
                  <StatusBadge status={card.status} size="lg" />
                  
                  {displayLabels.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {displayLabels.map((label) => (
                        <span
                          key={label}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-4">
                  {card.series && (
                    <div className="flex items-start gap-3">
                      <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Series</p>
                        <p className="font-semibold">{card.series}</p>
                      </div>
                    </div>
                  )}

                  {card.brand && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Brand</p>
                        <p className="font-semibold">{card.brand}</p>
                      </div>
                    </div>
                  )}

                  {card.card_year && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Year</p>
                        <p className="font-semibold">{card.card_year}</p>
                      </div>
                    </div>
                  )}

                  {card.card_team && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Card Team</p>
                        <p className="font-semibold">{card.card_team}</p>
                      </div>
                    </div>
                  )}

                  {card.price !== null && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-display font-bold text-xl text-primary">
                          ${card.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {card.notes && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-foreground">{card.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                  <p>Added: {new Date(card.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(card.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Buy Options Section */}
            <div className="pt-6 border-t border-border/50">
              <BuyOptionsTable cardId={card.id} readOnly={false} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {showEdit && (
        <EditCardModal
          open={showEdit}
          onOpenChange={setShowEdit}
          card={card}
        />
      )}
    </>
  );
}
