import { corsHeaders } from '../_shared/cors.ts';

const ENDPOINT = 'https://bwvwylqltmougniyfrcx.supabase.co/functions/v1/ebay-deletion-callback';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const challengeCode = url.searchParams.get('challenge_code');

    // --- Challenge-response validation (GET with challenge_code) ---
    if (challengeCode) {
      const verificationToken = Deno.env.get('EBAY_VERIFICATION_TOKEN');
      if (!verificationToken) {
        console.error('EBAY_VERIFICATION_TOKEN not configured');
        return new Response(
          JSON.stringify({ error: 'Verification token not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(challengeCode + verificationToken + ENDPOINT);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const challengeResponse = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return new Response(
        JSON.stringify({ challengeResponse }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Notification delivery (POST from eBay) ---
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('eBay notification received:', JSON.stringify(body));

      // Acknowledge receipt — no deletion logic yet
      return new Response(
        JSON.stringify({ status: 'ok' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback for unexpected requests
    return new Response(
      JSON.stringify({ error: 'Bad request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ebay-deletion-callback:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
