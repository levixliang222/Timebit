import { Router, Request, Response } from 'express';

const router = Router();

// In-memory store (replace with DB later)
const events: any[] = [];

router.get('/', (_req: Request, res: Response) => {
  res.json(events);
});

router.post('/', (req: Request, res: Response) => {
  const event = { id: `e${Date.now()}`, ...req.body };
  events.push(event);
  res.status(201).json(event);
});

router.delete('/:id', (req: Request, res: Response) => {
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  events.splice(idx, 1);
  res.status(204).send();
});

export default router;
