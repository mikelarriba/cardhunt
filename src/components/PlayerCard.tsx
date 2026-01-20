import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, Trash2, Eye, ImageIcon } from 'lucide-react';
import { PlayerWithCards, CardType, CARD_TYPES } from '@/types/database';
import { CardTypeIcon } from './CardTypeIcon';
import { SportBadge } from './SportBadge';
import { ProgressDots } from './ProgressDots';
import { AddCardModal } from './AddCardModal';
import { TagManager } from './TagManager';
import { TeamPillList } from './TeamPill';
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

// Get overall player status based on cards
function getPlayerStatus(player: PlayerWithCards): 'owned' | 'located' | 'missing' {
  const hasOwned = player.cards.some(c => c.status === 'owned');
  const hasLocated = player.cards.some(c => c.status === 'located');
  
  if (hasOwned) return 'owned';
  if (hasLocated) return 'located';
  return 'missing';
}

// Generate placeholder image URL based on player name
function getPlaceholderImageUrl(name: string): string {
  const seed = encodeURIComponent(name);
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=1a1a2e&textColor=fbbf24`;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const { deletePlayer } = usePlayers();
  const navigate = useNavigate();

  const getCardByType = (type: CardType) => {
    return player.cards.find((c) => c.card_type === type);
  };

  const playerStatus = getPlayerStatus(player);
  
  // Get status color classes
  const statusRingClass = {
    owned: 'ring-2 ring-status-owned/50',
    located: 'ring-2 ring-status-located/50',
    missing: '',
  }[playerStatus];

  const statusGlowClass = {
    owned: 'shadow-[0_0_20px_hsl(var(--status-owned)/0.2)]',
    located: 'shadow-[0_0_20px_hsl(var(--status-located)/0.2)]',
    missing: '',
  }[playerStatus];

  // Get a sample card image if available
  const cardWithImage = player.cards.find(c => c.image_url);
  const displayImage = cardWithImage?.image_url || getPlaceholderImageUrl(player.name);

  return (
    <>
      <div
        className={cn(
          'glass-card overflow-hidden transition-all duration-300 hover:shadow-hover animate-fade-in cursor-pointer group',
          statusRingClass,
          statusGlowClass
        )}
        onClick={() => navigate(`/player/${player.id}`)}
      >
        {/* Player Image - Vertical 2:3 aspect ratio */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={player.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Gradient Overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          
          {/* Status Indicator - Top right corner */}
          <div className="absolute top-3 right-3 flex gap-1">
            {player.cards.some(c => c.status === 'owned') && (
              <div className="w-3 h-3 rounded-full bg-status-owned shadow-[0_0_8px_hsl(var(--status-owned))]" title="Has owned cards" />
            )}
            {player.cards.some(c => c.status === 'located') && (
              <div className="w-3 h-3 rounded-full bg-status-located shadow-[0_0_8px_hsl(var(--status-located))]" title="Has located cards" />
            )}
            {player.cards.some(c => c.status === 'missing') && (
              <div className="w-3 h-3 rounded-full bg-status-missing" title="Has missing cards" />
            )}
          </div>

          {/* Menu - Top left */}
          <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/30 hover:bg-black/50 text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover border-border">
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

          {/* Content Overlay - Bottom */}
          <div className="absolute inset-x-0 bottom-0 p-4 space-y-3">
            {/* Player Name & Sport */}
            <div>
              <h3 className="font-display font-bold text-xl text-white drop-shadow-md mb-1">
                {player.name}
              </h3>
              <div className="flex items-center gap-2">
                <SportBadge sport={player.sport} />
              </div>
            </div>

            {/* Teams - Scrollable */}
            <div className="overflow-x-auto scrollbar-hide">
              <TeamPillList teams={player.teams} maxVisible={2} />
            </div>

            {/* Card Type Icons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {CARD_TYPES.map(({ value: type }) => {
                  const card = getCardByType(type);
                  return (
                    <CardTypeIcon
                      key={type}
                      type={type}
                      status={card?.status}
                      size="sm"
                    />
                  );
                })}
              </div>
              <ProgressDots cards={player.cards} />
            </div>
          </div>
        </div>

        {/* Tags & Quick Actions - Below card */}
        <div className="p-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <TagManager playerId={player.id} playerTags={player.tags || []} />
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10 shrink-0"
              onClick={() => setShowAddCard(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Card
            </Button>
          </div>
        </div>
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
