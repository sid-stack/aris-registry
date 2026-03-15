// server.js (or wherever you define routes)
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/* --------------------------------------------------------------
   1️⃣  Table definitions (run once, e.g. via a migration script)
   -------------------------------------------------------------- */
const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_events (
      id          BIGSERIAL PRIMARY KEY,
      uid         TEXT NOT NULL,
      event_type  TEXT NOT NULL,               -- 'page_view' | 'time_spent'
      value       BIGINT DEFAULT 0,            -- seconds for time_spent, 0 otherwise
      created_at  TIMESTAMPTZ DEFAULT now()
    );
  `);
};
init();

/* --------------------------------------------------------------
   2️⃣  /api/track endpoint – receives payload from front-end
   -------------------------------------------------------------- */
app.post('/api/track', async (req, res) => {
  const { uid, event, seconds } = req.body;
  if (!uid || !event) return res.status(400).json({error:'bad payload'});

  try {
    if (event === 'page_view') {
      await pool.query(
        `INSERT INTO visitor_events (uid, event_type) VALUES ($1,$2)`,
        [uid, event]
      );
    } else if (event === 'time_spent') {
      const secs = parseInt(seconds, 10) || 0;
      await pool.query(
        `INSERT INTO visitor_events (uid, event_type, value) VALUES ($1,$2,$3)`,
        [uid, event, secs]
      );
    }
    res.json({ok:true});
  } catch (e) {
    console.error('[TRACK ERROR]', e);
    res.status(500).json({error:'db error'});
  }
});

/* --------------------------------------------------------------
   3️⃣  Helper endpoint for live dashboard (already exists)
   -------------------------------------------------------------- */
app.get('/api/demo-analytics', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      WITH daily AS (
        SELECT
          date_trunc('day', created_at)::date AS day,
          COUNT(*)                                   AS total_views,
          COUNT(DISTINCT uid)                        AS unique_visitors,
          SUM(CASE WHEN event_type='time_spent' THEN value ELSE 0 END) AS total_seconds
        FROM visitor_events
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY day
      )
      SELECT
        day,
        total_views,
        unique_visitors,
        total_seconds,
        ROUND(total_seconds/60.0,1) AS minutes_spent
      FROM daily
      ORDER BY day DESC
    `);

    // Build history array for charts
    const history = rows.map(r => ({
      date: r.day.toISOString().split('T')[0],
      views: Number(r.total_views),
      signups: 0 // keep for compatibility - you can add later
    }));

    // Calculate totals
    const totals = rows.reduce(
      (a,b) => ({
        totalViews: a.total_views + Number(b.total_views),
        uniqueVisitors: a.unique_visitors + Number(b.unique_visitors),
        totalMinutes: a.total_minutes + Number(b.minutes_spent)
      }),
      { totalViews:0, uniqueVisitors:0, totalMinutes:0 }
    );

    res.json({ ...totals, history });
  } catch (e) {
    console.error('[ANALYTICS ERROR]', e);
    res.status(500).json({error:'db error'});
  }
});

/* --------------------------------------------------------------
   4️⃣  Start server
   -------------------------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API listening on ${PORT}`));
