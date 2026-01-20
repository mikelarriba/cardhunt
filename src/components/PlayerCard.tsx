import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, Trash2, ExternalLink, Eye } from 'lucide-react';
import { PlayerWithCards, CardType, CARD_TYPES } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { SportBadge } from './SportBadge';
import { StatusBadge } from './StatusBadge';
import { ProgressDots } from './ProgressDots';
import { AddCardModal } from './AddCardModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlayers } from '@/hooks/usePlayers';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: PlayerWithCards;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const { deletePlayer } = usePlayers();
  const navigate = useNavigate();

  const getCardByType = (type: CardType) => {
    return player.cards.find((c) => c.card_type === type);
  };

  const hasAnyOwnedCard = player.cards.some((c) => c.status === 'owned');

  return (
    <>
      <div
        className={cn(
          'glass-card p-5 transition-all duration-300 hover:shadow-hover animate-fade-in',
          hasAnyOwnedCard && 'ring-1 ring-status-owned/30'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground mb-1">
              {player.name}
            </h3>
            <div className="flex items-center gap-2">
              <SportBadge sport={player.sport} />
              <span className="text-xs text-muted-foreground">{player.team}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate(`/player/${player.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => deletePlayer.mutate(player.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Player
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Card Types Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {CARD_TYPES.map(({ value: type, label }) => {
            const card = getCardByType(type);
            return (
              <div key={type} className="flex flex-col items-center">
                <CardTypeIcon
                  type={type}
                  status={card?.status}
                  size="lg"
                />
                <span className="text-[10px] text-muted-foreground mt-1">
                  {label}
                </span>
                {card && (
                  <StatusBadge status={card.status} size="sm" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <ProgressDots cards={player.cards} />
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setShowAddCard(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>

        {/* Card Details (if any cards with source URL) */}
        {player.cards.some((c) => c.source_url) && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="space-y-2">
              {player.cards
                .filter((c) => c.source_url)
                .map((card) => (
                  <a
                    key={card.id}
                    href={card.source_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="capitalize">{card.card_type}</span>
                    {card.price && (
                      <span className="text-primary font-medium">
                        ${card.price.toFixed(2)}
                      </span>
                    )}
                  </a>
                ))}
            </div>
          </div>
        )}
      </div>

      <AddCardModal
        open={showAddCard}
        onOpenChange={setShowAddCard}
        playerId={player.id}
        playerName={player.name}
        existingCards={player.cards}
      />
    </>
  );
}
