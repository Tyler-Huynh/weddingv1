// /api/rsvp.js
//
// Vercel Serverless Function. Handles:
//   POST /api/rsvp        -> saves a new RSVP to Postgres
//   GET  /api/rsvp?key=... -> returns all RSVPs as JSON (simple admin view)
//
// Requires the `@vercel/postgres` package and a connected Postgres database
// (see README.md). Vercel automatically injects the POSTGRES_URL env var
// once you add the Postgres/Neon integration to your project — no manual
// connection string wiring needed.

const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  // Basic CORS so the static site can call this if ever hosted separately.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const guestName = (body.guestName || '').trim();
      const email = (body.email || '').trim();
      const attending = body.attending === 'Regretfully declines'
        ? 'Regretfully declines'
        : 'Joyfully accepts';
      const partySize = Math.max(1, Math.min(20, parseInt(body.partySize, 10) || 1));
      const guestNames = Array.isArray(body.guestNames)
        ? body.guestNames.map((n) => String(n).trim()).filter(Boolean).join(', ')
        : '';
      const allergies = (body.allergies || '').trim();
      const numOver21 = Math.max(0, parseInt(body.numOver21, 10) || 0);
      const numUnder12 = Math.max(0, parseInt(body.numUnder12, 10) || 0);
      const notes = (body.notes || '').trim();

      if (!guestName || !email) {
        return res.status(400).json({ error: 'Name and email are required.' });
      }

      // If the party size implies additional guests, require their names too
      // (mirrors the frontend's required attribute, kept here as a backstop).
      if (attending !== 'Regretfully declines' && partySize > 1 && !guestNames) {
        return res.status(400).json({ error: 'Please include the names of everyone in your party.' });
      }

      // Validate the numeric age counts
      if (attending !== 'Regretfully declines' && (numOver21 + numUnder12) > partySize) {
        return res.status(400).json({ error: 'The total of guests 21+ and children (12 or under) cannot exceed the party size.' });
      }

      await sql`
        INSERT INTO rsvps (guest_name, email, attending, party_size, additional_guest_names, allergies, num_over_21, num_under_12, notes)
        VALUES (${guestName}, ${email}, ${attending}, ${partySize}, ${guestNames}, ${allergies}, ${numOver21}, ${numUnder12}, ${notes})
      `;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('RSVP insert failed:', err);
      return res.status(500).json({ error: 'Something went wrong saving your RSVP.' });
    }
  }

  if (req.method === 'GET') {
    // Simple shared-secret admin view. Set ADMIN_KEY in your Vercel project's
    // environment variables, then visit /api/rsvp?key=YOUR_ADMIN_KEY to see
    // all responses as JSON. Not fancy, but private and good enough for a
    // guest list only you and your partner will check.
    const key = req.query?.key;
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    try {
      const { rows } = await sql`
        SELECT id, guest_name, email, attending, party_size, additional_guest_names, allergies, num_over_21, num_under_12, notes, submitted_at
        FROM rsvps
        ORDER BY submitted_at DESC
      `;
      return res.status(200).json({ count: rows.length, rsvps: rows });
    } catch (err) {
      console.error('RSVP fetch failed:', err);
      return res.status(500).json({ error: 'Could not load RSVPs.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
