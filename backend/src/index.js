const express = require('express');
const cors = require('cors');
const { authenticate } = require('./middleware/auth');
const authRouter = require('./routes/auth');
const symptomsRouter = require('./routes/symptoms');
const logsRouter = require('./routes/logs');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);

app.use('/api/symptoms', authenticate, symptomsRouter);
app.use('/api/logs', authenticate, logsRouter);
app.use('/api/reports', authenticate, reportsRouter);

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server listening on port ${PORT}`);
});
