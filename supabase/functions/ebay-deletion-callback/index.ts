import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const challengeCode = url.searchParams.get('challenge_code');

    if (!challengeCode) {
      return new Response(
        JSON.stringify({ error: 'challenge_code query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verificationToken = Deno.env.get('EBAY_VERIFICATION_TOKEN');
    if (!verificationToken) {
      return new Response(
        JSON.stringify({ error: 'Verification token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The endpoint URL eBay will use
    const endpoint = `https://bwvwylqltmougniyfrcx.supabase.co/functions/v1/ebay-deletion-callback`;

    // SHA-256 hash of: challengeCode + verificationToken + endpoint
    const encoder = new TextEncoder();
    const data = encoder.encode(challengeCode + verificationToken + endpoint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const challengeResponse = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return new Response(
      JSON.stringify({ challengeResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ebay-deletion-callback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
