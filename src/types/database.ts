export type SportType = 'football' | 'basketball' | 'baseball' | 'hockey' | 'soccer' | 'golf' | 'tennis' | 'boxing' | 'mma' | 'other';
export type CardType = 'rookie' | 'regular' | 'signed' | 'rated';
export type CardStatus = 'owned' | 'located' | 'missing';

export interface Player {
  id: string;
  user_id: string;
  name: string;
  sport: SportType;
  team: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  player_id: string;
  user_id: string;
  card_type: CardType;
  status: CardStatus;
  price: number | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerWithCards extends Player {
  cards: Card[];
}

export const SPORTS: { value: SportType; label: string }[] = [
  { value: 'football', label: 'Football' },
  { value: 'basketball', label: 'Basketball' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'golf', label: 'Golf' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'boxing', label: 'Boxing' },
  { value: 'mma', label: 'MMA' },
  { value: 'other', label: 'Other' },
];

export const CARD_TYPES: { value: CardType; label: string }[] = [
  { value: 'rookie', label: 'Rookie' },
  { value: 'regular', label: 'Regular' },
  { value: 'signed', label: 'Signed' },
  { value: 'rated', label: 'Rated' },
];

export const CARD_STATUSES: { value: CardStatus; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'located', label: 'Located' },
  { value: 'missing', label: 'Missing' },
];

export const POPULAR_TEAMS: Record<SportType, string[]> = {
  football: ['Dallas Cowboys', 'New England Patriots', 'Kansas City Chiefs', 'San Francisco 49ers', 'Green Bay Packers'],
  basketball: ['Los Angeles Lakers', 'Boston Celtics', 'Chicago Bulls', 'Golden State Warriors', 'Miami Heat'],
  baseball: ['New York Yankees', 'Los Angeles Dodgers', 'Boston Red Sox', 'Chicago Cubs', 'Atlanta Braves'],
  hockey: ['Toronto Maple Leafs', 'Montreal Canadiens', 'Boston Bruins', 'New York Rangers', 'Chicago Blackhawks'],
  soccer: ['Manchester United', 'Real Madrid', 'Barcelona', 'Liverpool', 'Bayern Munich'],
  golf: ['PGA Tour', 'LIV Golf', 'European Tour', 'LPGA', 'Champions Tour'],
  tennis: ['ATP Tour', 'WTA Tour', 'Grand Slam', 'Davis Cup', 'Fed Cup'],
  boxing: ['WBC', 'WBA', 'IBF', 'WBO', 'Matchroom'],
  mma: ['UFC', 'Bellator', 'ONE Championship', 'PFL', 'Rizin'],
  other: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
};
