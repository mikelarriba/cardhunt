import { useNavigate } from 'react-router-dom';
import { PlayerWithCards } from '@/types/database';
import { cn } from '@/lib/utils';

interface CompactPlayerCardProps {
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

export function CompactPlayerCard({ player }: CompactPlayerCardProps) {
  const navigate = useNavigate();
  const playerStatus = getPlayerStatus(player);

  // Get status color classes
  const statusRingClass = {
    owned: 'ring-2 ring-status-owned/60',
    located: 'ring-2 ring-status-located/60',
    missing: 'ring-1 ring-border/50',
  }[playerStatus];

  const statusGlowClass = {
    owned: 'shadow-[0_0_12px_hsl(var(--status-owned)/0.3)]',
    located: 'shadow-[0_0_12px_hsl(var(--status-located)/0.3)]',
    missing: '',
  }[playerStatus];

  // Get a sample card image if available
  const cardWithImage = player.cards.find(c => c.image_url);
  const displayImage = cardWithImage?.image_url || getPlaceholderImageUrl(player.name);

  // Count cards by status
  const ownedCount = player.cards.filter(c => c.status === 'owned').length;
  const locatedCount = player.cards.filter(c => c.status === 'located').length;
  const missingCount = player.cards.filter(c => c.status === 'missing').length;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group',
        statusRingClass,
        statusGlowClass
      )}
      onClick={() => navigate(`/player/${player.id}`)}
    >
      {/* Player Image - Vertical 2:3 aspect ratio */}
      <div className="aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={displayImage}
          alt={player.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Status Dots - Top right */}
        <div className="absolute top-2 right-2 flex gap-1">
          {ownedCount > 0 && (
            <div 
              className="w-2.5 h-2.5 rounded-full bg-status-owned shadow-[0_0_6px_hsl(var(--status-owned))]" 
              title={`${ownedCount} owned`} 
            />
          )}
          {locatedCount > 0 && (
            <div 
              className="w-2.5 h-2.5 rounded-full bg-status-located shadow-[0_0_6px_hsl(var(--status-located))]" 
              title={`${locatedCount} located`} 
            />
          )}
          {missingCount > 0 && (
            <div 
              className="w-2.5 h-2.5 rounded-full bg-status-missing" 
              title={`${missingCount} missing`} 
            />
          )}
        </div>

        {/* Player Name - Bottom */}
        <div className="absolute inset-x-0 bottom-0 p-2">
          <h3 className="font-display font-semibold text-sm text-white drop-shadow-md truncate">
            {player.name}
          </h3>
        </div>
      </div>
    </div>
  );
}
