const pool = require('../config/db');

const SymptomLog = {
  async create({ symptom_id, user_id, occurred_at, activity, notes, severity }) {
    const { rows } = await pool.query(
      `INSERT INTO symptom_logs (symptom_id, user_id, occurred_at, activity, notes, severity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [symptom_id, user_id, occurred_at, activity || null, notes || null, severity || null]
    );
    return rows[0];
  },

  async findAll({ user_id, limit = 50, offset = 0, symptom_id } = {}) {
    let query = `
      SELECT sl.*, s.name AS symptom_name, s.emoji
      FROM symptom_logs sl
      JOIN symptoms s ON s.id = sl.symptom_id
      WHERE sl.user_id = $1
    `;
    const params = [user_id];

    if (symptom_id) {
      params.push(symptom_id);
      query += ` AND sl.symptom_id = $${params.length}`;
    }

    query += ' ORDER BY sl.occurred_at DESC';

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    return rows;
  },

  async findById(id, user_id) {
    const { rows } = await pool.query(
      `SELECT sl.*, s.name AS symptom_name, s.emoji
       FROM symptom_logs sl
       JOIN symptoms s ON s.id = sl.symptom_id
       WHERE sl.id = $1 AND sl.user_id = $2`,
      [id, user_id]
    );
    return rows[0];
  },

  async delete(id, user_id) {
    const { rowCount } = await pool.query(
      'DELETE FROM symptom_logs WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return rowCount > 0;
  },
};

module.exports = SymptomLog;
