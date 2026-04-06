import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Plus, Trash2, Eye } from 'lucide-react';
import { PlayerWithCards } from '@/types/database';
import { SportBadge } from './SportBadge';
import { ProgressDots } from './ProgressDots';
import { AddCardModal } from './AddCardModal';
import { TeamPillList } from './TeamPill';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

// Generate placeholder image URL showing the full player name
function getPlaceholderImageUrl(name: string): string {
  const lines = name.split(' ');
  const textElements = lines.map((line, i) => {
    const y = 50 + (i - (lines.length - 1) / 2) * 14;
    return `<text x="50" y="${y}" font-family="system-ui,sans-serif" font-size="11" fill="%23fbbf24" text-anchor="middle" dominant-baseline="central">${encodeURIComponent(line)}</text>`;
  }).join('');
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a1a2e"/>${textElements}</svg>`;
}

export function PlayerCard({ player }: PlayerCardProps) {
  const [showAddCard, setShowAddCard] = useState(false);
  const queryClient = useQueryClient();
  const deletePlayer = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.from('players').delete().eq('id', playerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
  const navigate = useNavigate();

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

  // Get a sample card image if available (prefer image_front, fallback to image_url)
  const cardWithImage = player.cards.find(c => c.image_front || c.image_url);
  const displayImage = cardWithImage?.image_front || cardWithImage?.image_url || getPlaceholderImageUrl(player.name);

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
              <TeamPillList teams={player.teams} sport={player.sport} maxVisible={2} />
            </div>

            {/* Card count and progress */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">{player.cards.length} card{player.cards.length !== 1 ? 's' : ''}</span>
              <ProgressDots cards={player.cards} />
            </div>
          </div>
        </div>

        {/* Quick Actions - Below card */}
        <div className="p-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {player.cards.length} card{player.cards.length !== 1 ? 's' : ''}
            </span>
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
