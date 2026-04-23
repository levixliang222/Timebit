import { Router, Request, Response } from 'express';

const router = Router();

// Stub endpoint — will be backed by Claude API in Phase 3
router.post('/', (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }
  res.json({
    query,
    answer: 'Availability check via Claude API coming in Phase 3.',
    available: null,
  });
});

export default router;
