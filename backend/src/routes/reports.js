const { Router } = require('express');
const pool = require('../config/db');

const router = Router();

router.get('/frequency', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.emoji, COUNT(sl.id)::int AS count
       FROM symptoms s
       LEFT JOIN symptom_logs sl
         ON sl.symptom_id = s.id
         AND sl.user_id = $1
         AND sl.occurred_at >= NOW() - make_interval(days => $2)
       WHERE s.user_id = $1
       GROUP BY s.id
       HAVING COUNT(sl.id) > 0
       ORDER BY count DESC`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/timeline', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const { rows } = await pool.query(
      `SELECT
         DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
         s.name,
         s.emoji,
         COUNT(*)::int AS count
       FROM symptom_logs sl
       JOIN symptoms s ON s.id = sl.symptom_id
       WHERE sl.user_id = $1
         AND sl.occurred_at >= NOW() - make_interval(days => $2)
       GROUP BY date, s.name, s.emoji
       ORDER BY date`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/severity', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const { rows } = await pool.query(
      `SELECT
         DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
         s.name,
         s.emoji,
         ROUND(AVG(sl.severity), 1)::float AS avg_severity
       FROM symptom_logs sl
       JOIN symptoms s ON s.id = sl.symptom_id
       WHERE sl.user_id = $1
         AND sl.severity IS NOT NULL
         AND sl.occurred_at >= NOW() - make_interval(days => $2)
       GROUP BY date, s.name, s.emoji
       ORDER BY date`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/hourly', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const { rows } = await pool.query(
      `SELECT
         EXTRACT(HOUR FROM sl.occurred_at)::int AS hour,
         COUNT(*)::int AS count
       FROM symptom_logs sl
       WHERE sl.user_id = $1
         AND sl.occurred_at >= NOW() - make_interval(days => $2)
       GROUP BY hour
       ORDER BY hour`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/daily-total', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days || '30', 10);
    const { rows } = await pool.query(
      `SELECT
         DATE(sl.occurred_at AT TIME ZONE 'UTC') AS date,
         COUNT(*)::int AS count
       FROM symptom_logs sl
       WHERE sl.user_id = $1
         AND sl.occurred_at >= NOW() - make_interval(days => $2)
       GROUP BY date
       ORDER BY date`,
      [req.user.id, days]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
