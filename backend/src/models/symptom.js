const pool = require('../config/db');

const Symptom = {
  async seedForUser(userId) {
    await pool.query(
      `INSERT INTO symptoms (user_id, name, emoji, display_order)
       SELECT $1, name, emoji, display_order FROM default_symptoms
       ON CONFLICT (user_id, name) DO NOTHING`,
      [userId]
    );
  },

  async findAllForUser(userId, { includeArchived = false } = {}) {
    let query = 'SELECT * FROM symptoms WHERE user_id = $1';
    if (!includeArchived) {
      query += ' AND archived = FALSE';
    }
    query += ' ORDER BY display_order, id';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  },

  async findById(id, userId) {
    const { rows } = await pool.query(
      'SELECT * FROM symptoms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rows[0];
  },

  async create({ userId, name, emoji, display_order }) {
    const { rows: existing } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM symptoms WHERE user_id = $1',
      [userId]
    );
    const order = display_order ?? existing[0].next_order;

    const { rows } = await pool.query(
      `INSERT INTO symptoms (user_id, name, emoji, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name, emoji, order]
    );
    return rows[0];
  },

  async update(id, userId, { name, emoji, display_order }) {
    const sets = [];
    const params = [id, userId];
    if (name !== undefined) {
      params.push(name);
      sets.push(`name = $${params.length}`);
    }
    if (emoji !== undefined) {
      params.push(emoji);
      sets.push(`emoji = $${params.length}`);
    }
    if (display_order !== undefined) {
      params.push(display_order);
      sets.push(`display_order = $${params.length}`);
    }
    if (sets.length === 0) return this.findById(id, userId);

    const { rows } = await pool.query(
      `UPDATE symptoms SET ${sets.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );
    return rows[0];
  },

  async archive(id, userId) {
    const { rows } = await pool.query(
      'UPDATE symptoms SET archived = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return rows[0];
  },

  async unarchive(id, userId) {
    const { rows } = await pool.query(
      'UPDATE symptoms SET archived = FALSE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return rows[0];
  },

  async hasLogs(id, userId) {
    const { rows } = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM symptom_logs WHERE symptom_id = $1 AND user_id = $2) AS has_logs',
      [id, userId]
    );
    return rows[0].has_logs;
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      'DELETE FROM symptoms WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return rowCount > 0;
  },
};

module.exports = Symptom;
