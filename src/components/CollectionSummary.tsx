import { useMemo } from 'react';
import { PlayerWithCards } from '@/types/database';
import { Progress } from '@/components/ui/progress';

interface CollectionSummaryProps {
  collectionName: string;
  players: PlayerWithCards[];
}

export function CollectionSummary({ collectionName, players }: CollectionSummaryProps) {
  const stats = useMemo(() => {
    const allCards = players.flatMap(p => p.cards);
    const ownedCards = allCards.filter(c => c.status === 'owned').length;
    const locatedCards = allCards.filter(c => c.status === 'located').length;
    const missingCards = allCards.filter(c => c.status === 'missing').length;
    const totalCards = allCards.length;
    
    const ownedPercent = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;
    
    return {
      totalCards,
      ownedCards,
      locatedCards,
      missingCards,
      ownedPercent,
    };
  }, [players]);

  return (
    <div className="glass-card p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-foreground">
          📁 {collectionName}
        </h2>
        <span className="text-sm text-muted-foreground">
          {players.length} {players.length === 1 ? 'player' : 'players'} • {stats.totalCards} cards
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <span className="text-status-owned">
              <span className="font-medium">{stats.ownedCards}</span> Owned
            </span>
            <span className="text-status-located">
              <span className="font-medium">{stats.locatedCards}</span> Located
            </span>
            <span className="text-status-missing">
              <span className="font-medium">{stats.missingCards}</span> Missing
            </span>
          </div>
          <span className="text-muted-foreground">
            {stats.ownedPercent.toFixed(0)}% complete
          </span>
        </div>
        
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-status-owned transition-all duration-500"
            style={{ width: `${(stats.ownedCards / Math.max(stats.totalCards, 1)) * 100}%` }}
          />
          <div 
            className="absolute top-0 h-full bg-status-located transition-all duration-500"
            style={{ 
              left: `${(stats.ownedCards / Math.max(stats.totalCards, 1)) * 100}%`,
              width: `${(stats.locatedCards / Math.max(stats.totalCards, 1)) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
}
