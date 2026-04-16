const { Router } = require('express');
const SymptomLog = require('../models/symptomLog');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { limit, offset, symptom_id } = req.query;
    const logs = await SymptomLog.findAll({
      user_id: req.user.id,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      symptom_id: symptom_id ? parseInt(symptom_id, 10) : undefined,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const log = await SymptomLog.findById(req.params.id, req.user.id);
    if (!log) return res.status(404).json({ error: 'Log not found' });
    res.json(log);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { symptom_id, occurred_at, activity, notes, severity } = req.body;
    if (!symptom_id) {
      return res.status(400).json({ error: 'symptom_id is required' });
    }
    const log = await SymptomLog.create({
      symptom_id,
      user_id: req.user.id,
      occurred_at: occurred_at || new Date().toISOString(),
      activity,
      notes,
      severity,
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await SymptomLog.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Log not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
