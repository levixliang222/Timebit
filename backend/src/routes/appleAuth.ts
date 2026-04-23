import { Router, Request, Response } from 'express';
import {
  saveAppleCredentials, getAllAppleConnected, removeAppleCredentials,
  fetchAppleEvents,
} from '../appleCalDAV';

const router = Router();

// POST /auth/apple  { memberId, appleId, appPassword }
router.post('/', async (req: Request, res: Response) => {
  const { memberId, appleId, appPassword, displayName } = req.body as {
    memberId: string;
    appleId: string;
    appPassword: string;
    displayName?: string;
  };

  if (!memberId || !appleId || !appPassword) {
    res.status(400).json({ error: 'memberId, appleId, appPassword required' });
    return;
  }

  // Verify credentials by attempting a login fetch
  try {
    saveAppleCredentials(memberId, { appleId, appPassword, displayName });
    // Quick test fetch to validate credentials
    await fetchAppleEvents(memberId);
    res.json({ ok: true, memberId, appleId });
  } catch (err: any) {
    removeAppleCredentials(memberId);
    res.status(401).json({ error: 'iCloud authentication failed. Check your Apple ID and app-specific password.' });
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json(getAllAppleConnected());
});

router.delete('/:memberId', (req: Request, res: Response) => {
  removeAppleCredentials(req.params['memberId'] as string);
  res.json({ ok: true });
});

export default router;
