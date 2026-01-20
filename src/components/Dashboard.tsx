import { useState, useMemo } from 'react';
import { Plus, LogOut, Sparkles, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerCard } from './PlayerCard';
import { AddPlayerModal } from './AddPlayerModal';
import { FilterBar } from './FilterBar';
import { CollectionSummary } from './CollectionSummary';
import { ThemeToggle } from './ThemeToggle';
import { usePlayers } from '@/hooks/usePlayers';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { SportType, CardStatus } from '@/types/database';

export function Dashboard() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CardStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const { players, isLoading } = usePlayers();
  const { tags } = useTags();
  const { signOut, user } = useAuth();

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // Filter by tag/collection
      if (selectedTag !== 'all') {
        const hasTag = player.tags?.some(t => t.id === selectedTag);
        if (!hasTag) return false;
      }

      // Filter by sport
      if (selectedSport !== 'all' && player.sport !== selectedSport) {
        return false;
      }

      // Filter by status
      if (selectedStatus !== 'all') {
        const hasMatchingCard = player.cards.some(
          (card) => card.status === selectedStatus
        );
        if (!hasMatchingCard) return false;
      }

      return true;
    });
  }, [players, selectedSport, selectedStatus, selectedTag]);

  const stats = useMemo(() => {
    const allCards = players.flatMap((p) => p.cards);
    return {
      totalPlayers: players.length,
      ownedCards: allCards.filter((c) => c.status === 'owned').length,
      locatedCards: allCards.filter((c) => c.status === 'located').length,
      missingCards: allCards.filter((c) => c.status === 'missing').length,
      totalValue: allCards
        .filter((c) => c.status === 'owned' && c.price)
        .reduce((sum, c) => sum + (c.price || 0), 0),
    };
  }, [players]);

  const selectedTagName = useMemo(() => {
    if (selectedTag === 'all') return null;
    return tags.find(t => t.id === selectedTag)?.name || null;
  }, [selectedTag, tags]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-gradient-gold">
                  Card Tracker
                </h1>
                <p className="text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setShowAddPlayer(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-display font-bold text-foreground">
              {stats.totalPlayers}
            </p>
            <p className="text-xs text-muted-foreground">Players</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-display font-bold text-status-owned">
              {stats.ownedCards}
            </p>
            <p className="text-xs text-muted-foreground">Owned</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-display font-bold text-status-located">
              {stats.locatedCards}
            </p>
            <p className="text-xs text-muted-foreground">Located</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-display font-bold text-status-missing">
              {stats.missingCards}
            </p>
            <p className="text-xs text-muted-foreground">Missing</p>
          </div>
          <div className="glass-card p-4 text-center col-span-2 md:col-span-1">
            <p className="text-2xl font-display font-bold text-primary">
              ${stats.totalValue.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Collection Value</p>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          selectedSport={selectedSport}
          selectedStatus={selectedStatus}
          selectedTag={selectedTag}
          onSportChange={setSelectedSport}
          onStatusChange={setSelectedStatus}
          onTagChange={setSelectedTag}
        />

        {/* Collection Summary when viewing a specific collection */}
        {selectedTagName && filteredPlayers.length > 0 && (
          <CollectionSummary 
            collectionName={selectedTagName} 
            players={filteredPlayers} 
          />
        )}

        {/* Players Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your collection...</p>
            </div>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <LayoutGrid className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="font-display font-semibold text-xl mb-2">
              {players.length === 0
                ? 'Start Your Collection'
                : 'No Players Match Filters'}
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {players.length === 0
                ? 'Add your first player to begin tracking your sports card collection.'
                : 'Try adjusting your filters to see more players.'}
            </p>
            {players.length === 0 && (
              <Button
                onClick={() => setShowAddPlayer(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Player
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </main>

      <AddPlayerModal open={showAddPlayer} onOpenChange={setShowAddPlayer} />
    </div>
  );
}
