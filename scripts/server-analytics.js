// server.js (or wherever you define routes)
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/* --------------------------------------------------------------
   1️⃣  Table definitions (Enhanced for Funnel Tracking)
   -------------------------------------------------------------- */
const init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS visitor_events (
      id          BIGSERIAL PRIMARY KEY,
      uid         TEXT NOT NULL,
      event_type  TEXT NOT NULL,               -- 'page_view', 'demo_view', 'signup_click', 'conversion'
      page_url    TEXT,
      value       BIGINT DEFAULT 0,            -- seconds or other numeric values
      metadata    JSONB DEFAULT '{}',          -- flexible context
      created_at  TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_event_type ON visitor_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_uid ON visitor_events(uid);
  `);
};
init();

/* --------------------------------------------------------------
   2️⃣  /api/track endpoint –receives payload from front-end
   -------------------------------------------------------------- */
app.post('/api/track', async (req, res) => {
  const { uid, event, value, page, metadata } = req.body;
  if (!uid || !event) return res.status(400).json({error:'bad payload'});

  try {
    await pool.query(
      `INSERT INTO visitor_events (uid, event_type, value, page_url, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [uid, event, value || 0, page || '', JSON.stringify(metadata || {})]
    );
    res.json({ok:true});
  } catch (e) {
    console.error('[TRACK ERROR]', e);
    res.status(500).json({error:'db error'});
  }
});

/* --------------------------------------------------------------
   3️⃣  Dashboard Aggregator (Matches analytics.html expectations)
   -------------------------------------------------------------- */
app.get('/api/demo-analytics', async (req, res) => {
  try {
    // 1. Core Totals
    const statsQuery = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE event_type = 'page_view') as total_views,
        COUNT(DISTINCT uid) as unique_visitors,
        COUNT(*) FILTER (WHERE event_type = 'demo_view') as demo_views,
        COUNT(*) FILTER (WHERE event_type = 'signup_click') as signup_clicks,
        COUNT(*) FILTER (WHERE event_type = 'conversion') as signups
      FROM visitor_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const s = statsQuery.rows[0];

    // 2. History (Daily aggregation)
    const historyQuery = await pool.query(`
      SELECT 
        date_trunc('day', created_at)::date AS day,
        COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
        COUNT(*) FILTER (WHERE event_type = 'conversion') as signups
      FROM visitor_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    // 3. Recent Activity
    const activityQuery = await pool.query(`
      SELECT 
        event_type as type,
        page_url as page,
        created_at as timestamp
      FROM visitor_events
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.json({
      totalViews: parseInt(s.total_views) || 0,
      uniqueVisitors: parseInt(s.unique_visitors) || 0,
      demoViews: parseInt(s.demo_views) || 0,
      signupClicks: parseInt(s.signup_clicks) || 0,
      signups: parseInt(s.signups) || 0,
      history: historyQuery.rows.map(r => ({
        date: r.day.toISOString().split('T')[0],
        views: parseInt(r.views),
        signups: parseInt(r.signups)
      })),
      recentActivity: activityQuery.rows
    });
  } catch (e) {
    console.error('[ANALYTICS ERROR]', e);
    res.status(500).json({error:'db error'});
  }
});

const PORT = process.env.PORT || 3001; // Avoid conflict with main API if local
app.listen(PORT, () => console.log(`📊 Analytics Engine listening on ${PORT}`));

