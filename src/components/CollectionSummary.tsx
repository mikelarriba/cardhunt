import { useMemo } from 'react';
import { Card } from '@/types/database';
import { Sparkles, FolderOpen } from 'lucide-react';

interface CollectionSummaryProps {
  collectionName: string;
  cards: Card[];
  isSmart?: boolean;
}

const CARD_SLOTS = ['Rookie', 'Autographed', 'Base'] as const;

function cardHasSlot(card: Card, slot: string): boolean {
  return card.card_labels?.some(l => l.toLowerCase() === slot.toLowerCase()) ?? false;
}

export function CollectionSummary({ collectionName, cards, isSmart }: CollectionSummaryProps) {
  const stats = useMemo(() => {
    const ownedCards = cards.filter(c => c.status === 'owned').length;
    const locatedCards = cards.filter(c => c.status === 'located').length;
    const missingCards = cards.filter(c => c.status === 'missing').length;
    const totalCards = cards.length;
    
    const ownedPercent = totalCards > 0 ? (ownedCards / totalCards) * 100 : 0;
    const locatedPercent = totalCards > 0 ? (locatedCards / totalCards) * 100 : 0;

    // Per-slot breakdown
    const slotStats = CARD_SLOTS.map(slot => {
      const slotCards = cards.filter(c => cardHasSlot(c, slot));
      return {
        slot,
        total: slotCards.length,
        owned: slotCards.filter(c => c.status === 'owned').length,
        located: slotCards.filter(c => c.status === 'located').length,
        missing: slotCards.filter(c => c.status === 'missing').length,
      };
    }).filter(s => s.total > 0);
    
    return { totalCards, ownedCards, locatedCards, missingCards, ownedPercent, locatedPercent, slotStats };
  }, [cards]);

  return (
    <div className="glass-card p-4 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          {isSmart ? (
            <Sparkles className="w-4 h-4 text-primary" />
          ) : (
            <FolderOpen className="w-4 h-4 text-primary" />
          )}
          {collectionName}
          {isSmart && (
            <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Smart
            </span>
          )}
        </h2>
        <span className="text-sm text-muted-foreground">
          {stats.totalCards} card{stats.totalCards !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Overall progress */}
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
          <div className="flex gap-3 text-muted-foreground">
            <span>{stats.ownedPercent.toFixed(0)}% owned</span>
            <span>{stats.locatedPercent.toFixed(0)}% located</span>
          </div>
        </div>
        
        {/* Progress bar */}
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

        {/* Per-slot breakdown */}
        {stats.slotStats.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
            {stats.slotStats.map(({ slot, total, owned, located, missing }) => {
              const pct = total > 0 ? ((owned / total) * 100).toFixed(0) : '0';
              return (
                <div key={slot} className="text-center">
                  <p className="text-xs font-medium text-foreground mb-1">{slot}</p>
                  <p className="text-lg font-display font-bold text-foreground">{pct}%</p>
                  <p className="text-[10px] text-muted-foreground">
                    {owned}✓ {located}◎ {missing}✗
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
