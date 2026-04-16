const { Router } = require('express');
const Symptom = require('../models/symptom');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const includeArchived = req.query.include_archived === 'true';
    const symptoms = await Symptom.findAllForUser(req.user.id, { includeArchived });
    res.json(symptoms);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const symptom = await Symptom.findById(req.params.id, req.user.id);
    if (!symptom) return res.status(404).json({ error: 'Symptom not found' });
    res.json(symptom);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, emoji } = req.body;
    if (!name || !emoji) {
      return res.status(400).json({ error: 'name and emoji are required' });
    }
    const symptom = await Symptom.create({
      userId: req.user.id,
      name,
      emoji,
      display_order: req.body.display_order,
    });
    res.status(201).json(symptom);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already have a symptom with that name' });
    }
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, emoji, display_order } = req.body;
    const symptom = await Symptom.update(req.params.id, req.user.id, {
      name, emoji, display_order,
    });
    if (!symptom) return res.status(404).json({ error: 'Symptom not found' });
    res.json(symptom);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already have a symptom with that name' });
    }
    next(err);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const symptom = await Symptom.archive(req.params.id, req.user.id);
    if (!symptom) return res.status(404).json({ error: 'Symptom not found' });
    res.json(symptom);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/unarchive', async (req, res, next) => {
  try {
    const symptom = await Symptom.unarchive(req.params.id, req.user.id);
    if (!symptom) return res.status(404).json({ error: 'Symptom not found' });
    res.json(symptom);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const hasLogs = await Symptom.hasLogs(req.params.id, req.user.id);
    if (hasLogs) {
      return res.status(409).json({
        error: 'This symptom has logs and cannot be deleted. Archive it instead.',
      });
    }
    const deleted = await Symptom.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Symptom not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
