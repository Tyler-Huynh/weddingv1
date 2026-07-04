// /api/stats.js
//
// Vercel Serverless Function. Public, read-only endpoint:
//   GET /api/stats -> { attendingCount, totalGuests }
//
// Powers the "X friends already celebrating" tally on the site. Returns
// only aggregate counts — no names, emails, or notes — so it's safe to
// expose without any admin key.

const { sql } = require('@vercel/postgres');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { rows } = await sql`
      SELECT
        COUNT(*) FILTER (WHERE attending = 'Joyfully accepts') AS accepted_rsvps,
        COALESCE(SUM(party_size) FILTER (WHERE attending = 'Joyfully accepts'), 0) AS total_guests
      FROM rsvps
    `;
    const row = rows[0] || { accepted_rsvps: 0, total_guests: 0 };
    return res.status(200).json({
      attendingCount: Number(row.accepted_rsvps),
      totalGuests: Number(row.total_guests),
    });
  } catch (err) {
    console.error('Stats fetch failed:', err);
    return res.status(500).json({ error: 'Could not load stats.' });
  }
};
