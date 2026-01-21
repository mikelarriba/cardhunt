import { useState, useMemo } from 'react';
import { Plus, LogOut, Sparkles, LayoutGrid, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerCard } from './PlayerCard';
import { CompactPlayerCard } from './CompactPlayerCard';
import { PlayersTable } from './PlayersTable';
import { AddPlayerModal } from './AddPlayerModal';
import { AddPlayerDropdown } from './AddPlayerDropdown';
import { SearchFilterBar } from './SearchFilterBar';
import { CollectionSummary } from './CollectionSummary';
import { ThemeToggle } from './ThemeToggle';
import { ViewSwitcher } from './ViewSwitcher';
import { usePlayers } from '@/hooks/usePlayers';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { useViewMode } from '@/hooks/useViewMode';
import { SportType, CardStatus } from '@/types/database';

export function Dashboard() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CardStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useViewMode();
  const { players, isLoading } = usePlayers();
  const { tags } = useTags();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.warn('Logout warning:', error.message);
    }
  };

  // Get all unique teams from players
  const availableTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    players.forEach((player) => {
      player.teams?.forEach((team) => teamsSet.add(team));
    });
    return Array.from(teamsSet).sort();
  }, [players]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      selectedSport !== 'all' ||
      selectedStatus !== 'all' ||
      selectedTag !== 'all' ||
      selectedTeam !== 'all'
    );
  }, [searchQuery, selectedSport, selectedStatus, selectedTag, selectedTeam]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('all');
    setSelectedStatus('all');
    setSelectedTag('all');
    setSelectedTeam('all');
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      // Text search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesTeam = player.teams?.some((team) =>
          team.toLowerCase().includes(query)
        );
        const matchesCollection = player.tags?.some((tag) =>
          tag.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesTeam && !matchesCollection) return false;
      }

      // Filter by tag/collection
      if (selectedTag !== 'all') {
        const hasTag = player.tags?.some((t) => t.id === selectedTag);
        if (!hasTag) return false;
      }

      // Filter by team
      if (selectedTeam !== 'all') {
        const hasTeam = player.teams?.includes(selectedTeam);
        if (!hasTeam) return false;
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
  }, [players, searchQuery, selectedSport, selectedStatus, selectedTag, selectedTeam]);

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
    return tags.find((t) => t.id === selectedTag)?.name || null;
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
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AddPlayerDropdown onAddSingle={() => setShowAddPlayer(true)} />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
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

        {/* TOP: Global Search & Filter Bar */}
        <SearchFilterBar
          searchQuery={searchQuery}
          selectedSport={selectedSport}
          selectedStatus={selectedStatus}
          selectedTag={selectedTag}
          selectedTeam={selectedTeam}
          availableTeams={availableTeams}
          onSearchChange={setSearchQuery}
          onSportChange={setSelectedSport}
          onStatusChange={setSelectedStatus}
          onTagChange={setSelectedTag}
          onTeamChange={setSelectedTeam}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* MIDDLE: View Switcher */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} found
          </p>
          <ViewSwitcher value={viewMode} onChange={setViewMode} />
        </div>

        {/* Collection Summary when viewing a specific collection */}
        {selectedTagName && filteredPlayers.length > 0 && (
          <CollectionSummary
            collectionName={selectedTagName}
            players={filteredPlayers}
          />
        )}

        {/* BOTTOM: Players Grid/Table */}
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
              {hasActiveFilters ? (
                <SearchX className="w-10 h-10 text-muted-foreground" />
              ) : (
                <LayoutGrid className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h2 className="font-display font-semibold text-xl mb-2">
              {players.length === 0
                ? 'Start Your Collection'
                : 'No players found'}
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {players.length === 0
                ? 'Add your first player to begin tracking your sports card collection.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'}
            </p>
            {players.length === 0 ? (
              <Button
                onClick={() => setShowAddPlayer(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Player
              </Button>
            ) : (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="gap-2"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <PlayersTable players={filteredPlayers} />
        ) : viewMode === 'compact' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredPlayers.map((player) => (
              <CompactPlayerCard key={player.id} player={player} />
            ))}
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
