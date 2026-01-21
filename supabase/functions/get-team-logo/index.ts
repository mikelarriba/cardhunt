import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map our sport types to TheSportsDB league search terms
const sportToLeague: Record<string, string[]> = {
  football: ['NFL', 'American Football'],
  basketball: ['NBA', 'Basketball'],
  baseball: ['MLB', 'Baseball'],
  hockey: ['NHL', 'Ice Hockey'],
  soccer: ['English Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'MLS', 'Soccer'],
  golf: ['PGA', 'Golf'],
  tennis: ['ATP', 'WTA', 'Tennis'],
  boxing: ['Boxing'],
  mma: ['UFC', 'MMA'],
  other: [],
};

interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamBadge: string | null;
  strTeamLogo: string | null;
  strLeague: string;
}

interface TheSportsDBResponse {
  teams: TheSportsDBTeam[] | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamName, sport } = await req.json();

    if (!teamName) {
      return new Response(
        JSON.stringify({ error: 'Team name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('THESPORTSDB_API_KEY') || '3'; // Default to test key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create Supabase client with service role for caching
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached } = await supabase
      .from('team_logos')
      .select('logo_url, thesportsdb_id')
      .eq('team_name', teamName)
      .eq('sport', sport)
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({ 
          logoUrl: cached.logo_url, 
          teamId: cached.thesportsdb_id,
          cached: true 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
          } 
        }
      );
    }

    // Search TheSportsDB
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
    
    const response = await fetch(searchUrl);
    const data: TheSportsDBResponse = await response.json();

    let logoUrl: string | null = null;
    let teamId: string | null = null;

    if (data.teams && data.teams.length > 0) {
      // Try to find best match based on sport/league
      const sportLeagues = sportToLeague[sport] || [];
      
      let bestMatch = data.teams[0]; // Default to first result
      
      // Try to find a team in the matching league
      for (const team of data.teams) {
        if (sportLeagues.some(league => 
          team.strLeague?.toLowerCase().includes(league.toLowerCase())
        )) {
          bestMatch = team;
          break;
        }
      }

      logoUrl = bestMatch.strTeamBadge || bestMatch.strTeamLogo || null;
      teamId = bestMatch.idTeam;
    }

    // Cache the result (even if null, to avoid repeated API calls)
    await supabase.from('team_logos').upsert({
      team_name: teamName,
      sport: sport,
      logo_url: logoUrl,
      thesportsdb_id: teamId,
    }, { 
      onConflict: 'team_name,sport' 
    });

    return new Response(
      JSON.stringify({ 
        logoUrl, 
        teamId,
        cached: false 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        } 
      }
    );

  } catch (error) {
    console.error('Error fetching team logo:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch team logo' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
