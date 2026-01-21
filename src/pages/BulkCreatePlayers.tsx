import { useState, useCallback, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Plus, Trash2, Users, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SportType, SPORTS, POPULAR_TEAMS } from '@/types/database';
import { cn } from '@/lib/utils';

interface PlayerRow {
  id: string;
  name: string;
  sport: SportType | '';
  teams: string[];
  customTeam: string;
}

const createEmptyRow = (): PlayerRow => ({
  id: crypto.randomUUID(),
  name: '',
  sport: '',
  teams: [],
  customTeam: '',
});

const sportEmoji: Record<SportType, string> = {
  football: '🏈',
  basketball: '🏀',
  baseball: '⚾',
  hockey: '🏒',
  soccer: '⚽',
  golf: '⛳',
  tennis: '🎾',
  boxing: '🥊',
  mma: '🥋',
  other: '🏆',
};

export default function BulkCreatePlayers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<PlayerRow[]>([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
  const [bulkSportEnabled, setBulkSportEnabled] = useState(false);
  const [bulkSport, setBulkSport] = useState<SportType | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const updateRow = useCallback((id: string, updates: Partial<PlayerRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
  }, []);

  const addRow = useCallback(() => {
    const newRow = createEmptyRow();
    if (bulkSportEnabled && bulkSport) {
      newRow.sport = bulkSport;
    }
    setRows((prev) => [...prev, newRow]);
  }, [bulkSportEnabled, bulkSport]);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((row) => row.id !== id);
    });
  }, []);

  const handleAddTeam = useCallback((rowId: string, team: string) => {
    if (!team.trim()) return;
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (row.teams.includes(team)) return row;
        return { ...row, teams: [...row.teams, team], customTeam: '' };
      })
    );
  }, []);

  const handleRemoveTeam = useCallback((rowId: string, team: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return { ...row, teams: row.teams.filter((t) => t !== team) };
      })
    );
  }, []);

  const handleBulkSportChange = useCallback((sport: SportType) => {
    setBulkSport(sport);
    if (bulkSportEnabled) {
      setRows((prev) => prev.map((row) => ({ ...row, sport, teams: [] })));
    }
  }, [bulkSportEnabled]);

  const handleBulkSportToggle = useCallback((enabled: boolean) => {
    setBulkSportEnabled(enabled);
    if (enabled && bulkSport) {
      setRows((prev) => prev.map((row) => ({ ...row, sport: bulkSport, teams: [] })));
    }
  }, [bulkSport]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>, rowIndex: number, field: 'name' | 'customTeam') => {
    if (e.key === 'Enter' && field === 'customTeam') {
      e.preventDefault();
      const row = rows[rowIndex];
      if (row.customTeam.trim()) {
        handleAddTeam(row.id, row.customTeam.trim());
      }
    }
  }, [rows, handleAddTeam]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Split by newlines or tabs (common spreadsheet formats)
    const names = pastedText
      .split(/[\n\r\t]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // If only one name, let default paste behavior handle it
    if (names.length <= 1) return;
    
    e.preventDefault();
    
    setRows(prev => {
      const newRows = [...prev];
      
      // Fill existing rows starting from current index
      for (let i = 0; i < names.length; i++) {
        const targetIndex = rowIndex + i;
        
        if (targetIndex < newRows.length) {
          // Update existing row
          newRows[targetIndex] = { ...newRows[targetIndex], name: names[i] };
        } else {
          // Create new row
          const newRow = createEmptyRow();
          newRow.name = names[i];
          if (bulkSportEnabled && bulkSport) {
            newRow.sport = bulkSport;
          }
          newRows.push(newRow);
        }
      }
      
      return newRows;
    });
  }, [bulkSportEnabled, bulkSport]);

  const getValidRows = useCallback(() => {
    return rows.filter(
      (row) => row.name.trim() && row.sport && row.teams.length > 0
    );
  }, [rows]);

  const handleSaveAll = async () => {
    const validRows = getValidRows();
    
    if (validRows.length === 0) {
      toast({
        title: 'No Valid Players',
        description: 'Please fill in at least one complete row (name, sport, and teams).',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const playersToInsert = validRows.map((row) => ({
        name: row.name.trim(),
        sport: row.sport as SportType,
        teams: row.teams,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('players')
        .insert(playersToInsert);

      if (error) throw error;

      toast({
        title: 'Players Created!',
        description: `Successfully added ${validRows.length} player${validRows.length > 1 ? 's' : ''} to your collection.`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create players.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validRowCount = getValidRows().length;

  return (
    <>
      <Helmet>
        <title>Bulk Create Players | Card Tracker</title>
        <meta name="description" content="Add multiple players to your collection at once with the bulk create feature." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-xl">Bulk Create Players</h1>
                    <p className="text-xs text-muted-foreground">
                      Add multiple players at once
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving || validRowCount === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save All Players ({validRowCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {/* Bulk Sport Selection */}
          <div className="glass-card p-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulkSport"
                  checked={bulkSportEnabled}
                  onCheckedChange={(checked) => handleBulkSportToggle(checked === true)}
                />
                <Label htmlFor="bulkSport" className="text-sm font-medium cursor-pointer">
                  Apply same sport to all rows
                </Label>
              </div>
              {bulkSportEnabled && (
                <Select
                  value={bulkSport}
                  onValueChange={(value) => handleBulkSportChange(value as SportType)}
                >
                  <SelectTrigger className="w-[180px] bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Select sport..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {SPORTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-2">
                          <span>{sportEmoji[s.value]}</span>
                          <span>{s.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Spreadsheet Grid */}
          <div className="glass-card overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[1fr_160px_1fr_48px] gap-4 p-4 bg-secondary/30 border-b border-border/50 font-medium text-sm text-muted-foreground">
              <div>Player Name</div>
              <div>Sport</div>
              <div>Teams</div>
              <div></div>
            </div>

            {/* Data Rows */}
            <div className="divide-y divide-border/30">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_160px_1fr_48px] gap-4 p-4 items-start hover:bg-secondary/10 transition-colors"
                >
                  {/* Player Name */}
                  <Input
                    placeholder="e.g., Michael Jordan (paste list here)"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, index, 'name')}
                    onPaste={(e) => handlePaste(e, index)}
                    className="bg-secondary/50 border-border/50"
                  />

                  {/* Sport Select */}
                  <Select
                    value={row.sport}
                    onValueChange={(value) =>
                      updateRow(row.id, { sport: value as SportType, teams: [] })
                    }
                    disabled={bulkSportEnabled}
                  >
                    <SelectTrigger className={cn(
                      "bg-secondary/50 border-border/50",
                      bulkSportEnabled && "opacity-60"
                    )}>
                      <SelectValue placeholder="Sport" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {SPORTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <span className="flex items-center gap-2">
                            <span>{sportEmoji[s.value]}</span>
                            <span>{s.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Teams Multi-select */}
                  <div className="space-y-2">
                    {/* Selected Teams */}
                    {row.teams.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {row.teams.map((team) => (
                          <Badge
                            key={team}
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/20 pl-2 pr-1 py-0.5 text-xs"
                          >
                            {team}
                            <button
                              type="button"
                              onClick={() => handleRemoveTeam(row.id, team)}
                              className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Team Selection */}
                    {row.sport && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {POPULAR_TEAMS[row.sport as SportType]?.slice(0, 6).map((team) => (
                            <button
                              key={team}
                              type="button"
                              onClick={() => handleAddTeam(row.id, team)}
                              disabled={row.teams.includes(team)}
                              className={cn(
                                'px-2 py-0.5 rounded text-xs transition-colors',
                                row.teams.includes(team)
                                  ? 'bg-primary/30 text-primary cursor-not-allowed'
                                  : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {team}
                            </button>
                          ))}
                        </div>
                        <Input
                          placeholder="Custom team..."
                          value={row.customTeam}
                          onChange={(e) => updateRow(row.id, { customTeam: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, index, 'customTeam')}
                          className="bg-secondary/50 border-border/50 h-8 text-sm"
                        />
                      </div>
                    )}

                    {!row.sport && (
                      <p className="text-xs text-muted-foreground italic">
                        Select a sport first
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={addRow}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>
          </div>

          {/* Bottom Save Button */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving || validRowCount === 0}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Saving Players...
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Save All Players ({validRowCount})
                </>
              )}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
