import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import { getAuthUrl, createOAuthClient, saveTokens, disconnectMember, getAllConnected } from '../googleAuth';

const router = Router();

router.get('/google', (req: Request, res: Response) => {
  const memberId = req.query.memberId as string;
  if (!memberId) {
    res.status(400).json({ error: 'memberId is required' });
    return;
  }
  res.redirect(getAuthUrl(memberId));
});

router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const memberId = req.query.state as string;

  if (!code || !memberId) {
    res.status(400).send('Missing code or state');
    return;
  }

  try {
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch the Google profile so we can store email + display name
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();

    saveTokens(memberId, {
      ...tokens,
      email: data.email ?? undefined,
      name: data.name ?? undefined,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Close the popup and notify the opener
    res.send(`
      <html><body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: 'GOOGLE_AUTH_SUCCESS', memberId: '${memberId}', email: '${data.email}', name: '${data.name}' },
              '${frontendUrl}'
            );
            window.close();
          } else {
            window.location.href = '${frontendUrl}';
          }
        </script>
        <p>Connected! You can close this window.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

router.get('/status', (_req: Request, res: Response) => {
  res.json(getAllConnected());
});

router.delete('/google/:memberId', (req: Request, res: Response) => {
  disconnectMember(req.params['memberId'] as string);
  res.json({ ok: true });
});

export default router;
