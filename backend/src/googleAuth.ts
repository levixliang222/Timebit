import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback',
  );
}

export function getAuthUrl(memberId: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: memberId,
  });
}

// In-memory token store keyed by memberId (swap for DB in production)
const tokenStore = new Map<string, Credentials & { email?: string; name?: string }>();

export function saveTokens(memberId: string, tokens: Credentials & { email?: string; name?: string }) {
  tokenStore.set(memberId, tokens);
}

export function getTokens(memberId: string) {
  return tokenStore.get(memberId) ?? null;
}

export function getAllConnected(): { memberId: string; email: string; name: string }[] {
  return Array.from(tokenStore.entries()).map(([memberId, t]) => ({
    memberId,
    email: t.email ?? '',
    name: t.name ?? '',
  }));
}

export function disconnectMember(memberId: string) {
  tokenStore.delete(memberId);
}

export function getAuthedClient(memberId: string) {
  const tokens = getTokens(memberId);
  if (!tokens) return null;
  const client = createOAuthClient();
  client.setCredentials(tokens);
  return client;
}
