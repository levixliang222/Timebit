import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRouter from './routes/events';
import availabilityRouter from './routes/availability';
import authRouter from './routes/auth';
import calendarRouter from './routes/calendar';
import appleAuthRouter from './routes/appleAuth';
import calendarCreateRouter from './routes/calendarCreate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/events', eventsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/auth', authRouter);
app.use('/auth/apple', appleAuthRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/calendar/create', calendarCreateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Timebit API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Timebit API running on http://localhost:${PORT}`);
});
