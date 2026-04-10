import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LogOut, Sparkles, LayoutGrid, SearchX, Store, Wand2, FolderOpen, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlayerCard } from './PlayerCard';
import { VirtualPlayerGrid } from './VirtualPlayerGrid';
import { CompactPlayerCard } from './CompactPlayerCard';
import { PlayersTable } from './PlayersTable';
import { AddPlayerModal } from './AddPlayerModal';
import { AddPlayerDropdown } from './AddPlayerDropdown';
import { SearchFilterBar } from './SearchFilterBar';
import { CollectionSummary } from './CollectionSummary';
import { CollectionFilterBuilder } from './CollectionFilterBuilder';
import { ThemeToggle } from './ThemeToggle';
import { ViewSwitcher } from './ViewSwitcher';
import { usePlayers } from '@/hooks/usePlayers';
import { useTags, cardMatchesRules } from '@/hooks/useTags';
import { useAuth } from '@/hooks/useAuth';
import { useViewMode } from '@/hooks/useViewMode';
import { SportType, CardStatus } from '@/types/database';

const PAGE_SIZE = 10;

export function Dashboard() {
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showSmartBuilder, setShowSmartBuilder] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<CardStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useViewMode();
  const [currentPage, setCurrentPage] = useState(1);
  const { players, isLoading, isLoadingFull, hasFullData } = usePlayers();
  const { tags, cardTagLinks } = useTags();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) console.warn('Logout warning:', error.message);
  };

  const availableTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    players.forEach(p => p.teams?.forEach(t => teamsSet.add(t)));
    return Array.from(teamsSet).sort();
  }, [players]);

  const hasActiveFilters = useMemo(() => {
    return searchQuery !== '' || selectedSport !== 'all' || selectedStatus !== 'all' || selectedTag !== 'all' || selectedTeam !== 'all';
  }, [searchQuery, selectedSport, selectedStatus, selectedTag, selectedTeam]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('all');
    setSelectedStatus('all');
    setSelectedTag('all');
    setSelectedTeam('all');
    setCurrentPage(1);
  };

  const filteredPlayers = useMemo(() => {
    const selectedTagObj = selectedTag !== 'all' ? tags.find(t => t.id === selectedTag) : null;

    return players.filter(player => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = player.name.toLowerCase().includes(query);
        const matchesTeam = player.teams?.some(team => team.toLowerCase().includes(query));
        if (!matchesName && !matchesTeam) return false;
      }

      if (selectedTag !== 'all' && selectedTagObj) {
        if (selectedTagObj.filter_rules) {
          const hasMatchingCard = player.cards.some(card =>
            cardMatchesRules(card, selectedTagObj.filter_rules!, player.sport)
          );
          if (!hasMatchingCard) return false;
        } else {
          const playerCardIds = new Set(player.cards.map(c => c.id));
          const hasTaggedCard = cardTagLinks.some(ct => ct.tag_id === selectedTag && playerCardIds.has(ct.card_id));
          if (!hasTaggedCard) return false;
        }
      }

      if (selectedTeam !== 'all' && !player.teams?.includes(selectedTeam)) return false;
      if (selectedSport !== 'all' && player.sport !== selectedSport) return false;
      if (selectedStatus !== 'all' && !player.cards.some(card => card.status === selectedStatus)) return false;

      return true;
    });
  }, [players, searchQuery, selectedSport, selectedStatus, selectedTag, selectedTeam, tags, cardTagLinks]);

  // Reset page when filters change
  useMemo(() => { setCurrentPage(1); }, [searchQuery, selectedSport, selectedStatus, selectedTag, selectedTeam]);

  const totalPages = Math.ceil(filteredPlayers.length / PAGE_SIZE);
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, currentPage]);

  const stats = useMemo(() => {
    const allCards = players.flatMap(p => p.cards);
    return {
      totalPlayers: players.length,
      ownedCards: allCards.filter(c => c.status === 'owned').length,
      locatedCards: allCards.filter(c => c.status === 'located').length,
      missingCards: allCards.filter(c => c.status === 'missing').length,
      totalValue: allCards.filter(c => c.status === 'owned' && c.price).reduce((sum, c) => sum + (c.price || 0), 0),
    };
  }, [players]);

  const selectedTagObj = useMemo(() => {
    if (selectedTag === 'all') return null;
    return tags.find(t => t.id === selectedTag) || null;
  }, [selectedTag, tags]);

  const selectedTagName = selectedTagObj?.name || null;

  const collectionCards = useMemo(() => {
    if (!selectedTagObj) return [];
    return filteredPlayers.flatMap(p => {
      if (selectedTagObj.filter_rules) {
        return p.cards.filter(c => cardMatchesRules(c, selectedTagObj.filter_rules!, p.sport, p.teams));
      }
      return p.cards.filter(c => cardTagLinks.some(ct => ct.tag_id === selectedTag && ct.card_id === c.id));
    });
  }, [filteredPlayers, selectedTagObj, selectedTag, cardTagLinks]);

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
                <h1 className="font-display font-bold text-xl text-gradient-gold">Card Hunt</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild title="Collections">
                <Link to="/collections"><FolderOpen className="w-5 h-5" /></Link>
              </Button>
              <Button variant="ghost" size="icon" asChild title="Sellers">
                <Link to="/sellers"><Store className="w-5 h-5" /></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowSmartBuilder(true)} title="Smart Collection">
                <Wand2 className="w-5 h-5" />
              </Button>
              <AddPlayerDropdown onAddSingle={() => setShowAddPlayer(true)} />
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Collapsible Stats & Filters */}
        <div className="mb-4">
          <button
            onClick={() => setShowStats(prev => !prev)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span className="font-medium">{showStats ? 'Hide' : 'Show'} Stats & Filters</span>
            {!showStats && (
              <span className="text-xs opacity-70">
                — {stats.totalPlayers} players · {stats.ownedCards} owned · ${stats.totalValue.toFixed(0)}
              </span>
            )}
          </button>

          {showStats && (
            <div className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-5 gap-2">
                <div className="glass-card px-3 py-2 text-center">
                  <p className="text-lg font-display font-bold text-foreground">{stats.totalPlayers}</p>
                  <p className="text-[10px] text-muted-foreground">Players</p>
                </div>
                <div className="glass-card px-3 py-2 text-center">
                  <p className="text-lg font-display font-bold text-status-owned">{stats.ownedCards}</p>
                  <p className="text-[10px] text-muted-foreground">Owned</p>
                </div>
                <div className="glass-card px-3 py-2 text-center">
                  <p className="text-lg font-display font-bold text-status-located">{stats.locatedCards}</p>
                  <p className="text-[10px] text-muted-foreground">Located</p>
                </div>
                <div className="glass-card px-3 py-2 text-center">
                  <p className="text-lg font-display font-bold text-status-missing">{stats.missingCards}</p>
                  <p className="text-[10px] text-muted-foreground">Missing</p>
                </div>
                <div className="glass-card px-3 py-2 text-center">
                  <p className="text-lg font-display font-bold text-primary">${stats.totalValue.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Value</p>
                </div>
              </div>

              {/* Loading indicator for card data */}
              {!hasFullData && !isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading collection data...
                </div>
              )}

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
            </div>
          )}
        </div>

        {/* View Switcher + count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
            {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
          </p>
          <ViewSwitcher value={viewMode} onChange={setViewMode} />
        </div>

        {/* Collection Summary */}
        {selectedTagName && filteredPlayers.length > 0 && (
          <CollectionSummary
            collectionName={selectedTagName}
            cards={collectionCards}
            isSmart={!!selectedTagObj?.filter_rules}
          />
        )}

        {/* Players Grid/Table */}
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
              {players.length === 0 ? 'Start Your Collection' : 'No players found'}
            </h2>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {players.length === 0
                ? 'Add your first player to begin tracking your sports card collection.'
                : "Try adjusting your search or filters to find what you're looking for."}
            </p>
            {players.length === 0 ? (
              <Button onClick={() => setShowAddPlayer(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> Add Your First Player
              </Button>
            ) : (
              <Button onClick={clearFilters} variant="outline" className="gap-2">Clear all filters</Button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <PlayersTable players={paginatedPlayers} loadingCards={!hasFullData} />
        ) : (
          <VirtualPlayerGrid players={paginatedPlayers} viewMode={viewMode === 'compact' ? 'compact' : 'grid'} />
        )}

        {/* Pagination */}
        {totalPages > 1 && filteredPlayers.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'ghost'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

      <AddPlayerModal open={showAddPlayer} onOpenChange={setShowAddPlayer} />
      <CollectionFilterBuilder open={showSmartBuilder} onOpenChange={setShowSmartBuilder} />
    </div>
  );
}
